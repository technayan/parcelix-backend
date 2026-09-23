import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PricingServices } from "./pricing.service";

//* Create Pricing
const createPricing = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await PricingServices.createPricing(payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Pricing created successfully.",
    data: result,
  });
});

//* Update Pricing
const updatePricing = catchAsync(async (req: Request, res: Response) => {
  const pricingId = req.params.pricingId as string;
  const payload = req.body;
  const result = await PricingServices.updatePricing(pricingId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Pricing updated successfully.",
    data: result,
  });
});

export const PricingController = { createPricing, updatePricing };
