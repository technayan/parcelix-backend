import z from "zod";

const CreatePricingZodSchema = z.object({
  name: z
    .string("Pricing name must be a string")
    .trim()
    .min(3, "Pricing name must be at least 3 characters long")
    .max(100, "Pricing name cannot exceed 100 characters"),

  insideDhaka: z.boolean("insideDhaka must be a boolean"),

  base: z
    .number("Base price must be a number")
    .nonnegative("Base price cannot be negative"),

  additionalPerKg: z
    .number("Additional per kg must be a number")
    .nonnegative("Additional per kg cannot be negative"),

  courierEarning: z
    .number("Courier earning must be a number")
    .nonnegative("Courier earning cannot be negative"),
});

const UpdatePricingZodSchema = z.object({
  name: z
    .string("Pricing name must be a string")
    .trim()
    .min(2, "Pricing name must be at least 2 characters long")
    .max(100, "Pricing name cannot exceed 100 characters")
    .optional(),

  insideDhaka: z.boolean("insideDhaka must be a boolean").optional(),

  base: z
    .number("Base price must be a number")
    .nonnegative("Base price cannot be negative")
    .optional(),

  additionalPerKg: z
    .number("Additional per kg must be a number")
    .nonnegative("Additional per kg cannot be negative")
    .optional(),

  courierEarning: z
    .number("Courier earning must be a number")
    .nonnegative("Courier earning cannot be negative")
    .optional(),
});

export const pricingValidation = {
  CreatePricingZodSchema,
  UpdatePricingZodSchema,
};
