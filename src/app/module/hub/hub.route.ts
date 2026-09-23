import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { HubController } from "./hub.controller";
import { hubValidation } from "./hub.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(hubValidation.CreateHubZodSchema),
  HubController.createHub,
);
router.patch(
  "/:hubId",
  auth(Role.ADMIN),
  validateRequest(hubValidation.UpdateHubZodSchema),
  HubController.updateHub,
);

export const HubRoutes = router;
