import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";

//* Register
const registerCustomer = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthServices.RegisterIntoDB(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Register successfully.",
    data: null,
  });
});

export const AuthController = {
  registerCustomer,
};
