import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { PricingController } from "./pricing.controller";
import { pricingValidation } from "./pricing.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(pricingValidation.CreatePricingZodSchema),
  PricingController.createPricing,
);
router.patch(
  "/:pricingId",
  auth(Role.ADMIN),
  validateRequest(pricingValidation.UpdatePricingZodSchema),
  PricingController.updatePricing,
);
router.get("", PricingController.getPricings);

export const PricingRoutes = router;
