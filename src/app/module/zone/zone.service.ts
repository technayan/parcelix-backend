import httpStatus from "http-status";
import type { ZoneWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
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

//* Get Zones
const getZones = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: ZoneWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { id: { contains: query.searchTerm, mode: "insensitive" } },
        { name: { contains: query.searchTerm, mode: "insensitive" } },
        { area: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  const zones = await prisma.zone.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.zone.count({
    where: { AND: andConditions },
  });

  return {
    data: zones,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const ZoneServices = { createZone, updateZone, getZones };
