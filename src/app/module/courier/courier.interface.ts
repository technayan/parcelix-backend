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
