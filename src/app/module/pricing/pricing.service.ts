import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  ICreatePricingPayload,
  IUpdatePricingPayload,
} from "./pricing.interface";

//* Create Pricing
const createPricing = async (payload: ICreatePricingPayload) => {
  const pricing = await prisma.pricing.create({
    data: {
      ...payload,
    },
  });

  return pricing;
};

//* Update Pricing
const updatePricing = async (
  pricingId: string,
  payload: IUpdatePricingPayload,
) => {
  const pricing = await prisma.pricing.findUnique({
    where: { id: pricingId },
  });

  if (!pricing) {
    throw new AppError(httpStatus.NOT_FOUND, "Pricing not found!");
  }

  const updatedPricing = await prisma.pricing.update({
    where: { id: pricingId },
    data: {
      ...payload,
    },
  });

  return updatedPricing;
};

export const PricingServices = { createPricing, updatePricing };
