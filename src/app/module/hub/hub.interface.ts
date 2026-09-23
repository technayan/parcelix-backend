import type { HubStatus } from "../../../generated/prisma/enums";

export interface ICreateHubPayload {
  name: string;
  location: string;
  isInDhaka: boolean;
  zoneId: string;
}

export interface IUpdateHubPayload {
  name?: string;
  location?: string;
  isInDhaka?: boolean;
  zoneId?: string;
  status?: HubStatus;
}
