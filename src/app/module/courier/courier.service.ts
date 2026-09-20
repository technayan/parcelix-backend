import type { UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import { Role } from "../../../generated/prisma/enums";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import type {
  IApplyAsCourierPayload,
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

export const CourierServices = {
  applyAsCourier,
  verifyCourierEmail,
};
