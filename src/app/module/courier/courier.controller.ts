import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CourierServices } from "./courier.service";

//* Apply as Courier
const applyAsCourier = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const resume = files?.["resume"] ? files["resume"][0] : null;
  const payload = JSON.parse(req?.body?.data);

  const result = await CourierServices.applyAsCourier(payload, resume);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applied As Courier Successfully.",
    data: result,
  });
});

//* Verify Courier Email
const verifyCourierEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await CourierServices.verifyCourierEmail(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier Email Verified Successfully",
    data: result,
  });
});

//* Review Courier
const reviewCourier = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await CourierServices.reviewCourier(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier Application Reviewed Successfully",
    data: result,
  });
});

//* Get All Couriers
const getAllCouriers = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await CourierServices.getAllCouriers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All couriers fetched Successfully",
    data: data,
    meta: meta,
  });
});

//* Get Courier by ID
const getCourierById = catchAsync(async (req: Request, res: Response) => {
  const courierId = req.params.courierId as string;

  const result = await CourierServices.getCourierById(courierId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier details fetched Successfully",
    data: result,
  });
});

//* Get Courier Stats
const getCourierStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const result = await CourierServices.getCourierStats(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier stats fetched Successfully",
    data: result,
  });
});

export const CourierController = {
  applyAsCourier,
  verifyCourierEmail,
  reviewCourier,
  getAllCouriers,
  getCourierById,
  getCourierStats,
};
