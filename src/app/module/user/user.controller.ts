import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";

//* Update User
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user?.userId as string;

  const result = await UserServices.updateUserIntoDB(payload, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully.",
    data: result,
  });
});

//* Upload Profile Photo
const uploadProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  if (!req.file)
    throw new AppError(httpStatus.BAD_REQUEST, "No file provided.");
  const userId = req.user?.userId as string;

  const result = await UserServices.uploadProfilePhotoIntoDB(
    req.file.buffer,
    userId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Profile photo uploaded successfully.",
    data: result,
  });
});

//* Get All Users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully.",
    data: result,
  });
});

//* Get User by ID
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const result = await UserServices.getUserById(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User details fetched successfully.",
    data: result,
  });
});

//* Update User Status
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const payload = req.body;

  const result = await UserServices.updateUserStatus(userId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated successfully.",
    data: result,
  });
});

export const UserController = {
  updateUser,
  uploadProfilePhoto,
  getAllUsers,
  getUserById,
  updateUserStatus,
};
