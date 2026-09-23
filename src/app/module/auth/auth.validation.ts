import z from "zod";

const RegisterCustomerZodSchema = z.object({
  name: z
    .string("Name must be a string")
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name cannot exceed 50 characters"),

  email: z.email("Provide a valid email"),

  password: z
    .string()
    .regex(/[A-Z]/, "Password must have atleast one uppercase character")
    .regex(/[a-z]/, "Password must have atleast one lowercase character")
    .regex(/[0-9]/, "Password must have atleast one number")
    .regex(/[^A-Za-z0-9]/, "Password must have atleast one special character")
    .min(6, "Password must be atleast 6 characters long")
    .max(100, "Password cannot exceed 100 characters"),

  phone: z
    .string("Phone must be a string")
    .trim()
    .regex(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi phone number",
    )
    .optional()
    .or(z.literal("")),

  address: z
    .string("Address must be a string")
    .trim()
    .min(5, "Address must be at least 5 characters long")
    .max(255, "Address cannot exceed 255 characters")
    .optional(),
});

const EmailVerificationZodSchema = z.object({
  email: z.email("Provide a valid email"),

  otp: z
    .string("OTP must be a string")
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

const LoginZodSchema = z.object({
  email: z.email("Provide a valid email"),

  password: z
    .string("Password must be a string")
    .min(1, "Password is required"),
});

const ForgotPasswordZodSchema = z.object({
  email: z.email("Provide a valid email"),
});

const ResetPasswordZodSchema = z.object({
  email: z.email("Provide a valid email"),

  otp: z
    .string("OTP must be a string")
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),

  newPassword: z
    .string()
    .regex(/[A-Z]/, "Password must have atleast one uppercase character")
    .regex(/[a-z]/, "Password must have atleast one lowercase character")
    .regex(/[0-9]/, "Password must have atleast one number")
    .regex(/[^A-Za-z0-9]/, "Password must have atleast one special character")
    .min(6, "Password must be atleast 6 characters long")
    .max(100, "Password cannot exceed 100 characters"),
});

const GoogleLoginZodSchema = z.object({
  idToken: z
    .string("ID token must be a string")
    .trim()
    .min(1, "ID token is required"),
});

export const authValidation = {
  RegisterCustomerZodSchema,
  EmailVerificationZodSchema,
  LoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
  GoogleLoginZodSchema,
};
