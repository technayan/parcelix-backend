import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateShipmentPayload } from "./shipment.interface";

//* Create Shipment
const createShipmentIntoDB = async (
  payload: ICreateShipmentPayload,
  userId: string,
) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { id: userId },
      include: { customer: true },
      omit: { password: true },
    });

    if (!existingUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found!");
    }

    // Calculaing Delivery Fee
    let deliveryFee = 0;
    const additionalWeight = Math.ceil(payload.weight - 1);

    const originHub = await tx.hub.findUnique({
      where: { id: payload.originHubId },
    });

    const destinationHub = await tx.hub.findUnique({
      where: { id: payload.destinationHubId },
    });

    const isInDhaka = originHub?.isInDhaka && destinationHub?.isInDhaka;

    const pricing = await tx.pricing.findFirst({
      where: { insideDhaka: isInDhaka },
    });

    if (!pricing) {
      throw new AppError(httpStatus.NOT_FOUND, "Pricing not found!");
    }

    const base = Number(pricing?.base);
    const additionalFee = Number(pricing?.additionalPerKg);

    if (additionalWeight > 0) {
      deliveryFee = base + additionalWeight * additionalFee;
    } else {
      deliveryFee = base;
    }

    const shipment = await tx.shipment.create({
      data: {
        ...payload,
        customerId: existingUser?.customer?.id as string,
        deliveryFee,
      },
    });

    return shipment;
  });

  return transactionResult;
};

export const ShipmentServices = {
  createShipmentIntoDB,
};
