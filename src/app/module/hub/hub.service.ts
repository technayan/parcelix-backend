import httpStatus from "http-status";
import type { HubWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateHubPayload, IUpdateHubPayload } from "./hub.interface";

//* Create Hub
const createHub = async (payload: ICreateHubPayload) => {
  const hub = await prisma.hub.create({
    data: {
      ...payload,
    },
  });

  return hub;
};

//* Update Hub
const updateHub = async (hubId: string, payload: IUpdateHubPayload) => {
  const hub = await prisma.hub.findUnique({
    where: { id: hubId },
  });

  if (!hub) {
    throw new AppError(httpStatus.NOT_FOUND, "Hub not found!");
  }

  const updatedHub = await prisma.hub.update({
    where: { id: hubId },
    data: {
      ...payload,
    },
  });

  return updatedHub;
};

//* Get Hubs
const getHubs = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: HubWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { id: { contains: query.searchTerm, mode: "insensitive" } },
        { name: { contains: query.searchTerm, mode: "insensitive" } },
        { location: { contains: query.searchTerm, mode: "insensitive" } },
        { zoneId: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  if (query.isInDhaka) {
    andConditions.push({
      isInDhaka: query.isInDhaka === "true",
    });
  }

  const hubs = await prisma.hub.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.hub.count({
    where: { AND: andConditions },
  });

  return {
    data: hubs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const HubServices = { createHub, updateHub, getHubs };
