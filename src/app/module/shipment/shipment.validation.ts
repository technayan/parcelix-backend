import z from "zod";
import { TrackingShipmentStatus } from "../../../generated/prisma/enums";

const CreateShipmentZodSchema = z.object({
  originZoneId: z
    .string("Origin zone ID must be a string")
    .trim()
    .min(1, "Origin zone ID is required"),

  originHubId: z
    .string("Origin hub ID must be a string")
    .trim()
    .min(1, "Origin hub ID is required"),

  destinationZoneId: z
    .string("Destination zone ID must be a string")
    .trim()
    .min(1, "Destination zone ID is required"),

  destinationHubId: z
    .string("Destination hub ID must be a string")
    .trim()
    .min(1, "Destination hub ID is required"),

  senderName: z
    .string("Sender name must be a string")
    .trim()
    .min(3, "Sender name must be at least 3 characters long")
    .max(100, "Sender name cannot exceed 100 characters"),

  senderPhone: z
    .string("Sender phone must be a string")
    .trim()
    .regex(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi phone number",
    ),

  senderAddress: z
    .string("Sender address must be a string")
    .trim()
    .min(5, "Sender address must be at least 5 characters long")
    .max(255, "Sender address cannot exceed 255 characters"),

  receiverName: z
    .string("Receiver name must be a string")
    .trim()
    .min(3, "Receiver name must be at least 3 characters long")
    .max(100, "Receiver name cannot exceed 100 characters"),

  receiverPhone: z
    .string("Receiver phone must be a string")
    .trim()
    .regex(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi phone number",
    ),

  receiverAddress: z
    .string("Receiver address must be a string")
    .trim()
    .min(5, "Receiver address must be at least 5 characters long")
    .max(255, "Receiver address cannot exceed 255 characters"),

  weight: z
    .number("Weight must be a number")
    .positive("Weight must be greater than 0"),

  description: z
    .string("Description must be a string")
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  isFragile: z.boolean("isFragile must be a boolean"),

  pickupInstructions: z
    .string("Pickup instructions must be a string")
    .trim()
    .max(255, "Pickup instructions cannot exceed 500 characters")
    .optional(),
});

const PayShipmentZodSchema = z.object({
  shipmentId: z
    .string("Shipment ID must be a string")
    .trim()
    .min(1, "Shipment ID is required"),
});

const ShipmentStatusZodSchema = z.object({
  shipmentId: z
    .string("Shipment ID must be a string")
    .trim()
    .min(1, "Shipment ID is required"),
});

const AssignCourierZodSchema = z.object({
  courierId: z
    .string("Courier ID must be a string")
    .trim()
    .min(1, "Courier ID is required"),
});

const UpdateShipmentStatusZodSchema = z.object({
  status: z.enum(TrackingShipmentStatus),

  returnReason: z
    .string("Return reason must be a string")
    .trim()
    .max(500, "Return reason cannot exceed 500 characters")
    .optional(),
});

export const shipmentValidation = {
  CreateShipmentZodSchema,
  PayShipmentZodSchema,
  ShipmentStatusZodSchema,
  AssignCourierZodSchema,
  UpdateShipmentStatusZodSchema,
};
