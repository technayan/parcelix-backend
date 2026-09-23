import z from "zod";
import {
  CourierAvailabilityStatus,
  CourierVerificationStatus,
} from "../../../generated/prisma/enums";

const ApplyAsCourierZodSchema = z.object({
  name: z
    .string("Name must be a string")
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name cannot exceed 50 characters"),

  email: z.email("Provide a valid email"),

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

const VerifyCourierEmailZodSchema = z.object({
  email: z.email("Provide a valid email"),

  otp: z
    .string("OTP must be a string")
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

const ReviewCourierZodSchema = z
  .object({
    courierId: z
      .string("Courier ID must be a string")
      .trim()
      .min(1, "Courier ID is required"),

    verificationStatus: z.enum([
      CourierVerificationStatus.APPROVED,
      CourierVerificationStatus.REJECTED,
    ]),

    rejectionReason: z
      .string("Rejection reason must be a string")
      .trim()
      .max(500, "Rejection reason cannot exceed 500 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.verificationStatus === CourierVerificationStatus.REJECTED &&
      !data.rejectionReason
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting a courier",
      });
    }
  });

const UpdateCourierAvailabilityZodSchema = z.object({
  status: z.enum(CourierAvailabilityStatus),
});

export const courierValidation = {
  ApplyAsCourierZodSchema,
  VerifyCourierEmailZodSchema,
  ReviewCourierZodSchema,
  UpdateCourierAvailabilityZodSchema,
};
