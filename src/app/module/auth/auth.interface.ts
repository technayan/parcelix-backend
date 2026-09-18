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
