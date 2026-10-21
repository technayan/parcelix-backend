import { Router } from "express";
import { TrackingController } from "./tracking.controller";

const router = Router();

router.get("/:trackingId", TrackingController.trackingShipment);

export const TrackingRoutes = router;
