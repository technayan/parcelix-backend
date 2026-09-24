import httpStatus from "http-status";
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
const getHubs = async () => {
  const hubs = await prisma.hub.findMany();
  return hubs;
};

export const HubServices = { createHub, updateHub, getHubs };
