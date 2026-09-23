import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { HubServices } from "./hub.service";

//* Create Hub
const createHub = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await HubServices.createHub(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Hub created successfully.",
    data: result,
  });
});

//* Update Hub
const updateHub = catchAsync(async (req: Request, res: Response) => {
  const hubId = req.params.hubId as string;
  const payload = req.body;
  const result = await HubServices.updateHub(hubId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Hub updated successfully.",
    data: result,
  });
});

export const HubController = { createHub, updateHub };
