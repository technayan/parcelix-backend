import type {
  CourierAvailabilityStatus,
  CourierVerificationStatus,
} from "../../../generated/prisma/enums";

export interface IApplyAsCourierPayload {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface IVerifyCourierEmailPayload {
  email: string;
  otp: string;
}

export interface IReviewCourierPayload {
  courierId: string;
  verificationStatus: CourierVerificationStatus;
  rejectionReason?: string;
}

export interface IUpdateCourierAvailabilityPayload {
  status: CourierAvailabilityStatus;
}
