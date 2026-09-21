import bcrypt from "bcryptjs";
import type { UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import {
	CourierVerificationStatus,
	Role,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import type {
	IApplyAsCourierPayload,
	IApproveCourierPayload,
	IVerifyCourierEmailPayload,
} from "./courier.interface";

//* Apply as Courier
const applyAsCourier = async (
	payload: IApplyAsCourierPayload,
	resume: Express.Multer.File | null,
) => {
	const isUserExists = await prisma.user.findUnique({
		where: {
			email: payload.email,
		},
	});

	if (isUserExists) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User Already Exists With This Email",
		);
	}

	const resumeUploadResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},

					async (error, result) => {
						if (error) {
							return reject(error);
						}

						if (!result) {
							return reject(
								new AppError(
									httpStatus.INTERNAL_SERVER_ERROR,
									"No result returned from Cloudinary",
								),
							);
						}

						resolve(result);
					},
				)
				.end(resume?.buffer);
		},
	);

	const courierApplication = await prisma.user.create({
		data: {
			name: payload.name,
			email: payload.email,
			phone: payload.phone,
			role: Role.COURIER,
			courier: {
				create: {
					address: payload.address,
					resume: resumeUploadResult.secure_url,
					resumePublicId: resumeUploadResult.public_id,
				},
			},
		},
		include: {
			courier: true,
		},
		omit: { password: true },
	});

	const expirationSeconds = 60 * 60;

	const otpKey = `parcelix-courier-application-otp:${payload.email}`;
	const otpValue = crypto.randomInt(100000, 1000000).toString();

	await redisClient.set(otpKey, otpValue, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/email-verification.ejs",
	);

	const html = await ejs.renderFile(tempatePath, {
		name: payload.name,
		otp: otpValue,
		expirationMinutes: expirationSeconds / 60,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: payload.email,
		subject: "Courier Application - Email Verification",
		html,
	});

	return courierApplication;
};

//* Verify Courier Email
const verifyCourierEmail = async (payload: IVerifyCourierEmailPayload) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	const existingUser = await prisma.user.findUnique({
		where: { email, role: Role.COURIER },
	});

	if (!existingUser) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Courier Application Not Found. Please Apply Again.",
		);
	}

	if (existingUser.emailVerified) {
		throw new AppError(httpStatus.CONFLICT, "Email Already Verified");
	}

	const otpKey = `parcelix-courier-application-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"OTP Expired. Your Application Window Has Closed, Please Apply Again.",
		);
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
	}

	await redisClient.del(otpKey);

	const verifiedUser = await prisma.user.update({
		where: { id: existingUser.id },
		data: { emailVerified: true },
		omit: { password: true },
		include: { courier: true },
	});

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/courier-email-verified.ejs",
	);

	const html = await ejs.renderFile(tempatePath, {
		name: verifiedUser.name,
	});

	await transporter.sendMail({
		from: config.email_sender,
		to: verifiedUser.email,
		subject: "Courier Email Verified",
		html,
	});

	return verifiedUser;
};

//* Review Courier
const reviewCourier = async (
	payload: IApproveCourierPayload,
	userId: string,
) => {
	const transactionResult = await prisma.$transaction(async (tx) => {
		const reviewer = await tx.user.findUnique({
			where: { id: userId },
			omit: { password: true },
		});

		if (!reviewer) {
			throw new AppError(httpStatus.NOT_FOUND, "Reviewer not found!");
		}

		if (reviewer.role !== Role.ADMIN) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You have no permission to review any applications.",
			);
		}

		const { courierId, verificationStatus, rejectionReason } = payload;

		const existingCourier = await tx.courier.findUnique({
			where: { id: courierId },
			include: { user: true },
		});

		if (!existingCourier || existingCourier.user.isDeleted) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"Courier application not found!",
			);
		}

		if (!existingCourier.user.emailVerified) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Courier has not verified their email yet. Application cannot be reviewed.",
			);
		}

		if (
			existingCourier.verificationStatus !== CourierVerificationStatus.PENDING
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				`Courier application has already been ${existingCourier.verificationStatus.toLowerCase()}`,
			);
		}

		if (
			verificationStatus === CourierVerificationStatus.REJECTED &&
			!rejectionReason
		) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Rejection reason is required when rejecting a courier application",
			);
		}

		const updatedCourier = await tx.courier.update({
			where: { id: courierId },
			data: {
				verificationStatus,
				rejectionReason:
					verificationStatus === CourierVerificationStatus.REJECTED
						? rejectionReason
						: null,
				reviewedAt: new Date(),
			},
			include: {
				user: {
					omit: { password: true },
				},
			},
		});

		if (verificationStatus === CourierVerificationStatus.REJECTED) {
			const tempatePath = path.join(
				process.cwd(),
				`src/app/templates/courier-rejected.ejs`,
			);

			const html = await ejs.renderFile(tempatePath, {
				name: updatedCourier.user.name,
				rejectionReason,
			});

			await transporter.sendMail({
				from: config.email_sender,
				to: updatedCourier.user.email,
				subject: "Courier Application Not Approved",
				html,
			});

			return updatedCourier;
		}

		// Aapply Generated Password to the Courier Account
		const randomCourierPassword = Math.random().toString(36).slice(-8);

		const hashedPassword = await bcrypt.hash(
			randomCourierPassword,
			Number(config.bcrypt_salt_rounds),
		);

		const updatedUser = await tx.user.update({
			where: { id: updatedCourier.userId },
			data: {
				password: hashedPassword,
			},
			omit: { password: true },
		});

		const tempatePath = path.join(
			process.cwd(),
			`src/app/templates/courier-approved.ejs`,
		);

		const html = await ejs.renderFile(tempatePath, {
			name: updatedUser.name,
			email: updatedUser.email,
			password: randomCourierPassword,
			loginUrl: config.backend_url,
		});

		await transporter.sendMail({
			from: config.email_sender,
			to: updatedUser.email,
			subject: "Courier Application Approved",
			html,
		});

		return updatedCourier;
	});

	return transactionResult;
};

export const CourierServices = {
	applyAsCourier,
	verifyCourierEmail,
	reviewCourier,
};
