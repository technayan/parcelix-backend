import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ZoneServices } from "./zone.service";

//* Create Zone
const createZone = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await ZoneServices.createZone(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Zone created successfully.",
    data: result,
  });
});

//* Update Zone
const updateZone = catchAsync(async (req: Request, res: Response) => {
  const zoneId = req.params.zoneId as string;
  const payload = req.body;
  const result = await ZoneServices.updateZone(zoneId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Zone updated successfully.",
    data: result,
  });
});

//* Get Zones
const getZones = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneServices.getZones();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Zones fetched successfully.",
    data: result,
  });
});

export const ZoneController = { createZone, updateZone, getZones };
