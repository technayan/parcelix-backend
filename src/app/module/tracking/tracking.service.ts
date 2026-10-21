import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

//* Tracking Shipment
const trackingShipment = async (trackingId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { trackingId },
      select: { id: true, trackingId: true },
    });

    if (!shipment) {
      throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
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
