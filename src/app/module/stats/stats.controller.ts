import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsServices } from "./stats.service";

//* Get Overall Statistics
const getStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsServices.getStatistics();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Overall statistics fetched successfully.",
    data: result,
  });
});

export const StatsController = { getStatistics };
