import z from "zod";
import { ZoneStatus } from "../../../generated/prisma/enums";

const CreateZoneZodSchema = z.object({
  name: z
    .string("Zone name must be a string")
    .trim()
    .min(3, "Zone name must be at least 3 characters long")
    .max(100, "Zone name cannot exceed 100 characters"),

  area: z
    .string("Area must be a string")
    .trim()
    .min(4, "Area must be at least 4 characters long")
    .max(255, "Area cannot exceed 255 characters"),
});

const UpdateZoneZodSchema = z.object({
  name: z
    .string("Zone name must be a string")
    .trim()
    .min(3, "Zone name must be at least 3 characters long")
    .max(100, "Zone name cannot exceed 100 characters")
    .optional(),

  area: z
    .string("Area must be a string")
    .trim()
    .min(4, "Area must be at least 4 characters long")
    .max(255, "Area cannot exceed 255 characters")
    .optional(),

  status: z.enum(ZoneStatus).optional(),
});

export const zoneValidation = {
  CreateZoneZodSchema,
  UpdateZoneZodSchema,
};
