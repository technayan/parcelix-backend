import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PricingController } from "./pricing.controller";

const router = Router();

router.post("/", auth(Role.ADMIN), PricingController.createPricing);
router.patch("/:pricingId", auth(Role.ADMIN), PricingController.updatePricing);

export const PricingRoutes = router;
