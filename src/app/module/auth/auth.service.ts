import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { IRegisterCustomerPayload } from "./auth.interface";

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

export const AuthServices = {
  RegisterIntoDB,
};
