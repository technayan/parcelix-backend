import { z } from "zod";

export const chatRequestSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(500),
          })
          .strict(),
      )
      .min(1)
      .max(6),
  })
  .strict()
  .refine((body) => body.messages.at(-1)?.role === "user", {
    message: "The last message must be from the user.",
    path: ["messages"],
  });

export type ChatRequest = z.infer<typeof chatRequestSchema>;
