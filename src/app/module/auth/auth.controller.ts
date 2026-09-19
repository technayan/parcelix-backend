import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthServices } from "./auth.service";

//* Register
const registerCustomer = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthServices.RegisterIntoDB(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message:
      "The verification OTP has been sent to your email. Please, verify the email to register.",
    data: null,
  });
});

//* Email Verification
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthServices.emailVerification(payload);

  const { user, customer } = result;

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered and email verified successfully.",
    data: {
      user,
      customer,
    },
  });
});

//* Login
const login = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthServices.login(payload);

  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

//* Get Profile
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;

  if (!user) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User information is missing in the request.",
    );
  }

  const result = await AuthServices.getProfile(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully.",
    data: result,
  });
});

//* Refresh Token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
  }
  const result = await AuthServices.refreshToken(req.cookies.refreshToken);
  const { newAccessToken, newRefreshToken } = result;

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

export const AuthController = {
  registerCustomer,
  verifyEmail,
  login,
  getProfile,
  refreshToken,
};
