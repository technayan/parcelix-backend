import z from "zod";

const RegistrationZodSchema = z.object({
  name: z
    .string("Name must be string")
    .min(3, "Name must be atleast 3 characters long")
    .max(50, "Name can be maximum 30 characters long"),
  email: z.email("Provide a valid email"),
  password: z
    .string()
    .regex(/[A-Z]/, "Password must have atleast one uppercase character")
    .regex(/[a-z]/, "Password must have atleast one lowercase character")
    .regex(/[0-9]/, "Password must have atleast one number")
    .regex(/[^A-Za-z0-9]/, "Password must have atleast one special character")
    .min(6, "Password must be atleast 6 characters long"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "Please enter a valid Bangladeshi phone numer.",
    )
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters long.")
    .max(255, "Address cannot exceed 255 characters")
    .optional(),
});

export const authValidation = {
  RegistrationZodSchema,
};
