import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TrackingServices } from "./tracking.service";

//* Tracking Shipment
const trackingShipment = catchAsync(async (req: Request, res: Response) => {
  const trackingId = req.params.trackingId as string;
  const user = req.user;

  const result = await TrackingServices.trackingShipment(trackingId, user!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Track shipment successfully.",
    data: result,
  });
});

export const TrackingController = { trackingShipment };
