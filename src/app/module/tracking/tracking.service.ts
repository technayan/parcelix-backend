import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IRequestUser } from "../auth/auth.interface";

//* Tracking Shipment
const trackingShipment = async (trackingId: string, user: IRequestUser) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { trackingId },
      select: { id: true, trackingId: true, customerId: true },
    });

    if (!shipment) {
      throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
    }

    // Authorize Customer
    if (user.role === Role.CUSTOMER) {
      const customer = await tx.customer.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });

      if (!customer) {
        throw new AppError(httpStatus.NOT_FOUND, "Customer not found!");
      }

      if (shipment?.customerId !== customer.id) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You have no permission to access this resource",
        );
      }
    }

    const tracking = await tx.trackingShipment.findMany({
      where: { shipmentId: shipment.id },
      orderBy: { createdAt: "asc" },
    });

    return tracking;
  });
  return transactionResult;
};

export const TrackingServices = { trackingShipment };
