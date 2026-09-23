import type { UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateUserPayload {
  name?: string;
  phone?: string;
  address?: string;
}

export interface IUpdateUserStatusPayload {
  status: UserStatus;
}
