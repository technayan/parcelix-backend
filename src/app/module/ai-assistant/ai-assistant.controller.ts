import type { Request, Response } from "express";
import { generateAssistantReply } from "./ai-assistant.service";
import { chatRequestSchema } from "./ai-assistant.validation";

export async function chatWithAssistant(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = chatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid chat request.",
      errors: parsed.error.flatten(),
    });
    return;
  }

  try {
    const reply = await generateAssistantReply(parsed.data.messages);

    res.status(200).json({
      success: true,
      message: "Assistant response generated successfully.",
      data: { reply },
    });
  } catch (error) {
    // Log the diagnostic on the server, never the API key.
    console.error("Parcelix Gemini assistant error:", error);

    res.status(503).json({
      success: false,
      message:
        "The assistant is temporarily unavailable. Please try again later.",
    });
  }
}
