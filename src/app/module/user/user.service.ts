import type { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IUpdateUserPayload } from "./user.interface";

//* Update User
const updateUserIntoDB = async (
	payload: IUpdateUserPayload,
	userId: string,
) => {
	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			customer: true,
			courier: true,
		},
	});

	if (!existingUser) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	if (existingUser.status === UserStatus.BLOCKED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is blocked. Please, contact support.",
		);
	}

	if (existingUser.isDeleted || existingUser.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.NOT_FOUND, "User is deleted.");
	}

	if (!existingUser.emailVerified) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User email is not verified!");
	}

	const transactionResult = await prisma.$transaction(async (tx) => {
		if (existingUser.role === Role.CUSTOMER && existingUser.customer) {
			await tx.customer.update({
				where: {
					userId,
				},
				data: {
					address: payload.address,
				},
			});
		}

		if (existingUser.role === Role.COURIER && existingUser.courier) {
			await tx.courier.update({
				where: {
					userId,
				},
				data: {
					address: payload.address,
				},
			});
		}

		const updatedUser = await tx.user.update({
			where: { id: userId },
			data: {
				name: payload.name,
				phone: payload.phone,
			},
			omit: { password: true },
			include: { courier: true, customer: true },
		});

		return updatedUser;
	});

	return transactionResult;
};

//* Upload Profile Photo
const uploadProfilePhotoIntoDB = async (buffer: Buffer, userId: string) => {
	const currentUser = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			profilePhoto: true,
			profilePhotoPublicId: true,
		},
	});

	if (!currentUser) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found!");
	}

	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},
					(error, result) => {
						if (error) {
							return reject(error);
						}

						if (!result) {
							return reject(
								new AppError(
									httpStatus.INTERNAL_SERVER_ERROR,
									"Error while file uploading.",
								),
							);
						}

						return resolve(result);
					},
				)
				.end(buffer);
		},
	);

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			profilePhoto: cloudinaryResult?.secure_url,
			profilePhotoPublicId: cloudinaryResult.public_id,
		},
		omit: { password: true },
	});

	if (currentUser?.profilePhotoPublicId && currentUser.profilePhoto) {
		await cloudinary.uploader.destroy(currentUser.profilePhotoPublicId);
	}

	return updatedUser;
};

export const UserServices = {
	updateUserIntoDB,
	uploadProfilePhotoIntoDB,
};
