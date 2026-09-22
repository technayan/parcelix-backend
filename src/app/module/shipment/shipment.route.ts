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

router.patch(
  "/request-pickup",
  auth(Role.CUSTOMER),
  ShipmentController.requestPickup,
);

router.get("/", auth(Role.ADMIN), ShipmentController.getAllShipments);

router.get(
  "/details/:shipmentId",
  auth(Role.ADMIN, Role.CUSTOMER, Role.COURIER),
  ShipmentController.getShipmentById,
);

router.post(
  "/cancel/:shipmentId",
  auth(Role.CUSTOMER),
  ShipmentController.cancelShipment,
);

router.patch(
  "/assign-courier/:shipmentId",
  auth(Role.ADMIN),
  ShipmentController.assignCourier,
);

router.get(
  "/assigned",
  auth(Role.COURIER),
  ShipmentController.getAssignedShipments,
);

router.patch(
  "/update-status/:shipmentId",
  auth(Role.COURIER),
  ShipmentController.updateShipmentStatus,
);

export const ShipmentRoutes = router;
