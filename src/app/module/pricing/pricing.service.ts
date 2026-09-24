import httpStatus from "http-status";
import type { PricingWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
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

//* Get Pricings
const getPricings = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: PricingWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { id: { contains: query.searchTerm, mode: "insensitive" } },
        { name: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.insideDhaka) {
    andConditions.push({
      insideDhaka: query.insideDhaka === "true",
    });
  }

  const pricings = await prisma.pricing.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.pricing.count({
    where: { AND: andConditions },
  });

  return {
    data: pricings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const PricingServices = { createPricing, updatePricing, getPricings };
