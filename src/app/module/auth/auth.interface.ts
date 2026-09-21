import type { Role } from "../../../generated/prisma/enums";

export interface IRegisterCustomerPayload {
	name: string;
	email: string;
	password: string;
	phone?: string;
	address?: string;
}

export interface IEmailVerificationPayload {
	email: string;
	otp: string;
}

export interface ILoginPayload {
	email: string;
	password: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IGoogleLoginPayload {
	idToken: string;
}
