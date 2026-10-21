import { Router } from "express";
import {
  aiHourlyLimiter,
  aiShortWindowLimiter,
} from "../../middleware/public-ai-rate-limit";
import { chatWithAssistant } from "./ai-assistant.controller";

const router = Router();

router.post("/", aiShortWindowLimiter, aiHourlyLimiter, chatWithAssistant);

export const aiAssistantRoutes = router;
