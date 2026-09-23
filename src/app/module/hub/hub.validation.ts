import z from "zod";
import { HubStatus } from "../../../generated/prisma/enums";

const CreateHubZodSchema = z.object({
  name: z
    .string("Hub name must be a string")
    .trim()
    .min(3, "Hub name must be at least 3 characters long")
    .max(100, "Hub name cannot exceed 100 characters"),

  location: z
    .string("Location must be a string")
    .trim()
    .min(3, "Location must be at least 3 characters long")
    .max(255, "Location cannot exceed 255 characters"),

  isInDhaka: z.boolean("isInDhaka must be a boolean"),

  zoneId: z
    .string("Zone ID must be a string")
    .trim()
    .min(1, "Zone ID is required"),
});

const UpdateHubZodSchema = z.object({
  name: z
    .string("Hub name must be a string")
    .trim()
    .min(3, "Hub name must be at least 3 characters long")
    .max(100, "Hub name cannot exceed 100 characters")
    .optional(),

  location: z
    .string("Location must be a string")
    .trim()
    .min(3, "Location must be at least 3 characters long")
    .max(255, "Location cannot exceed 255 characters")
    .optional(),

  isInDhaka: z.boolean("isInDhaka must be a boolean").optional(),

  zoneId: z
    .string("Zone ID must be a string")
    .trim()
    .min(1, "Zone ID cannot be empty")
    .optional(),

  status: z.enum(HubStatus).optional(),
});

export const hubValidation = {
  CreateHubZodSchema,
  UpdateHubZodSchema,
};
