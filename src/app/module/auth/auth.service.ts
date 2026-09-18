import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import { SignOptions } from "jsonwebtoken";
import path from "path";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import {
  IEmailVerificationPayload,
  IRegisterCustomerPayload,
} from "./auth.interface";

//* Register
const RegisterIntoDB = async (payload: IRegisterCustomerPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email is already exists!",
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const expirationSeconds = 5 * 60;

  const verificationKey = `parcelix-email-verification-otp:${email}`;
  const otp = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(verificationKey, otp, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const userInfoKey = `parcelix-user-info:${email}`;
  const userInfo = {
    name,
    email,
    password: hashedPassword,
    phone: payload?.phone ?? null,
    address: payload?.address ?? null,
  };

  await redisClient.set(userInfoKey, JSON.stringify(userInfo), {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/email-verification.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.email_sender,
    subject: "Email verification OTP",
    to: email,
    html,
  });
};

//* Email Verification
const emailVerification = async (payload: IEmailVerificationPayload) => {
  const { email, otp } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist?.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified.");
  }

  if (isUserExist?.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked.");
  }

  if (isUserExist?.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User is deleted.");
  }

  const verificationKey = `parcelix-email-verification-otp:${email}`;
  const redisVerificationOtp = await redisClient.get(verificationKey);

  if (!redisVerificationOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  }

  if (redisVerificationOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP did not matched.");
  }

  const userInfoKey = `parcelix-user-info:${email}`;
  const userInfo = await redisClient.get(userInfoKey);

  if (!userInfo) {
    throw new AppError(httpStatus.NOT_FOUND, "User data is not found!");
  }

  const userData: IRegisterCustomerPayload = JSON.parse(userInfo);

  const createdUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData?.phone,
      emailVerified: true,
      role: Role.CUSTOMER,
      customer: {
        create: {
          address: userData?.address,
        },
      },
    },
    omit: { password: true },
    include: { customer: true },
  });

  await redisClient.del([verificationKey, userInfoKey]);

  const { customer, ...user } = createdUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user,
    customer,
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  RegisterIntoDB,
  emailVerification,
};
