import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
  IEmailVerificationPayload,
  IForgotPasswordPayload,
  ILoginPayload,
  IRegisterCustomerPayload,
  IRequestUser,
  IResetPasswordPayload,
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

  // Store in Redis
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

  // Send OTP Email
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

  // Get Redis Data and verify
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

  // Create user into Database
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

  // Clear Redis data
  await redisClient.del([verificationKey, userInfoKey]);

  // Send welcome email
  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/welcome-email.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: createdUser.name,
    url: config.backend_url,
  });

  await transporter.sendMail({
    from: config.email_sender,
    subject: "Welcome to Parcelix",
    to: createdUser.email,
    html,
  });

  const { customer, ...user } = createdUser;

  return {
    user,
    customer,
  };
};

//* Login
const login = async (payload: ILoginPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.NOT_FOUND, "User is deleted");
  }

  if (user?.password === null || user?.googleId !== null) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This user is registered with Google.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

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
    accessToken,
    refreshToken,
  };
};

//* Get Profile
const getProfile = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      customer: true,
      courier: true,
    },
    omit: { password: true },
  });

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  return isUserExists;
};

//* Refresh Token
const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh Token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User is inactive or not found",
    );
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    newAccessToken,
    newRefreshToken,
  };
};

//* Forgot Password
const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Please, contact support.",
    );
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.NOT_FOUND, "User is deleted.");
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User email is not verified!");
  }

  if (user.googleId && user.authProvider === "GOOGLE") {
    throw new AppError(httpStatus.BAD_REQUEST, "You have account with Google.");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const key = `parcelix-forgot-password-otp:${user.email}`;

  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password-email.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: user.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.email_sender,
    subject: "Forgot Password OTP",
    to: user.email,
    html,
  });
};

//* Reset Password
const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Please, contact support.",
    );
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.NOT_FOUND, "User is deleted.");
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User email is not verified!");
  }

  if (user.googleId && user.authProvider === "GOOGLE") {
    throw new AppError(httpStatus.BAD_REQUEST, "You have account with Google.");
  }

  const key = `parcelix-forgot-password-otp:${user.email}`;

  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not exist.");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { email: user.email },
    data: {
      password: hashedPassword,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "/src/app/templates/reset-password.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: user.name,
    loginUrl: config.backend_url,
  });

  await transporter.sendMail({
    from: config.email_sender,
    subject: "Password Reset Successful - Parcelix",
    to: user.email,
    html,
  });
};

export const AuthServices = {
  RegisterIntoDB,
  emailVerification,
  login,
  getProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
};
