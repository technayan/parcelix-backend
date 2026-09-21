import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ShipmentServices } from "./shipment.service";

//* Create Shipment
const createShipment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user?.userId as string;

  const result = await ShipmentServices.createShipmentIntoDB(payload, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Shipment Created Successfully. Make payment to request pickup.",
    data: result,
  });
});

//* Pay Shipment
const payShipment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;

  const result = await ShipmentServices.payShipment(payload, user!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment URL created.",
    data: result,
  });
});

//* Pay Shipment Callback
const payShipmentCallback = catchAsync(async (req: Request, res: Response) => {
  const { redirectUrl } = await ShipmentServices.payShipmentCallback(req.query);
  res.redirect(redirectUrl);
});

//* Request for Pickup
const requestPickup = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user?.userId as string;

  const result = await ShipmentServices.requestPickup(payload, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Request for pickup successfully.",
    data: result,
  });
});

export const ShipmentController = {
  createShipment,
  payShipment,
  payShipmentCallback,
  requestPickup,
};
