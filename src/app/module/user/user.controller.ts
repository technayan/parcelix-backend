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

export const UserController = {
  updateUser,
  uploadProfilePhoto,
};
