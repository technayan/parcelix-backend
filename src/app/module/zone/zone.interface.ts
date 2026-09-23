import type { ZoneStatus } from "../../../generated/prisma/enums";

export interface ICreateZonePayload {
  name: string;
  area: string;
}

export interface IUpdateZonePayload {
  name?: string;
  area?: string;
  status?: ZoneStatus;
}
