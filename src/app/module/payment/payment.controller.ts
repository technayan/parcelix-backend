import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";

//* Get My Payments
const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const { data, meta } = await PaymentServices.getMyPayments(req.query, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments fetched successfully.",
    data: data,
    meta: meta,
  });
});

//* Get Payment by ID
const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const paymentId = req.params.paymentId as string;
  const user = req.user;

  const result = await PaymentServices.getPaymentById(paymentId, user!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment details fetched successfully.",
    data: result,
  });
});

//* Get All Payments (Admin)
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await PaymentServices.getAllPayments(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments fetched successfully.",
    data: data,
    meta: meta,
  });
});

export const PaymentController = {
  getMyPayments,
  getPaymentById,
  getAllPayments,
};
