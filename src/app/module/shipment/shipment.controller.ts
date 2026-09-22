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

//* Cancel Shipment
const cancelShipment = catchAsync(async (req: Request, res: Response) => {
  const shipmentId = req.params.shipmentId as string;
  const user = req.user;

  const result = await ShipmentServices.cancelShipment(shipmentId, user!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shipment cancelled successfully.",
    data: result,
  });
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

//* Get All Shipments (Admin)
const getAllShipments = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ShipmentServices.getAllShipments(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All shipments fetched successfully.",
    data: data,
    meta: meta,
  });
});

//* Get Shipment By ID
const getShipmentById = catchAsync(async (req: Request, res: Response) => {
  const shipmentId = req.params.shipmentId as string;
  const user = req.user!;

  const result = await ShipmentServices.getShipmentById(shipmentId, user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shipment details fetched successfully.",
    data: result,
  });
});

export const ShipmentController = {
  createShipment,
  payShipment,
  payShipmentCallback,
  requestPickup,
  getAllShipments,
  getShipmentById,
  cancelShipment,
};
