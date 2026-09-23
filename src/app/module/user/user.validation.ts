import z from "zod";
import { UserStatus } from "../../../generated/prisma/enums";

const UpdateUserZodSchema = z.object({
  name: z
    .string("Name must be a string")
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),

  phone: z
    .string("Phone must be a string")
    .trim()
    .regex(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi phone number",
    )
    .optional(),

  address: z
    .string("Address must be a string")
    .trim()
    .min(5, "Address must be at least 5 characters long")
    .max(255, "Address cannot exceed 255 characters")
    .optional(),
});

const UpdateUserStatusZodSchema = z.object({
  status: z.enum(UserStatus),
});

export const userValidation = {
  UpdateUserZodSchema,
  UpdateUserStatusZodSchema,
};
