import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { TrackingController } from "./tracking.controller";

const router = Router();

router.get(
  "/:trackingId",
  auth(Role.CUSTOMER, Role.ADMIN),
  TrackingController.trackingShipment,
);

export const TrackingRoutes = router;
