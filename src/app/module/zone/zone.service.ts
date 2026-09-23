import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateZonePayload, IUpdateZonePayload } from "./zone.interface";

//* Create Zone
const createZone = async (payload: ICreateZonePayload) => {
  const zone = await prisma.zone.create({
    data: {
      ...payload,
    },
  });

  return zone;
};

//* Update Zone
const updateZone = async (zoneId: string, payload: IUpdateZonePayload) => {
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
  });

  if (!zone) {
    throw new AppError(httpStatus.NOT_FOUND, "Zone not found!");
  }

  const updatedZone = await prisma.zone.update({
    where: { id: zoneId },
    data: {
      ...payload,
    },
  });

  return updatedZone;
};

export const ZoneServices = { createZone, updateZone };
