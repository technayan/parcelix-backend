import Groq from "groq-sdk";
import config from "../../config";
import { PARCELIX_SYSTEM_PROMPT } from "./ai-assistant.prompt";

const groq = new Groq({
  apiKey: config.groq_api_key,
  timeout: 20_000,
  maxRetries: 0,
});

const MODEL = config.groq_model || "openai/gpt-oss-20b";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateAssistantReply(
  messages: ChatMessage[],
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: PARCELIX_SYSTEM_PROMPT,
      },
      ...messages.slice(-10),
    ],
    temperature: 0.2,
    max_completion_tokens: 400,
  });

  const reply = completion.choices[0]?.message?.content;

  if (!reply || typeof reply !== "string") {
    throw new Error("Groq returned an empty response.");
  }

  return reply;
}
