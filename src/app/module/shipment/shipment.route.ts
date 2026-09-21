import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { ShipmentController } from "./shipment.controller";

const router = Router();

router.post("/", auth(Role.CUSTOMER), ShipmentController.createShipment);

router.post(
  "/pay-shipment",
  auth(Role.CUSTOMER),
  ShipmentController.payShipment,
);

router.get("/payment/callback", ShipmentController.payShipmentCallback);

export const ShipmentRoutes = router;
