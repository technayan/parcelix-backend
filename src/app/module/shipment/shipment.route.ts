import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { ShipmentController } from "./shipment.controller";
import { shipmentValidation } from "./shipment.validation";

const router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(shipmentValidation.CreateShipmentZodSchema),
  ShipmentController.createShipment,
);

router.post(
  "/pay-shipment",
  auth(Role.CUSTOMER),
  validateRequest(shipmentValidation.PayShipmentZodSchema),
  ShipmentController.payShipment,
);

router.get("/payment/callback", ShipmentController.payShipmentCallback);

router.patch(
  "/request-pickup",
  auth(Role.CUSTOMER),
  validateRequest(shipmentValidation.ShipmentStatusZodSchema),
  ShipmentController.requestPickup,
);

router.get("/", auth(Role.ADMIN), ShipmentController.getAllShipments);

router.get(
  "/details/:shipmentId",
  auth(Role.ADMIN, Role.CUSTOMER, Role.COURIER),
  ShipmentController.getShipmentById,
);

router.patch(
  "/cancel/:shipmentId",
  auth(Role.CUSTOMER),
  ShipmentController.cancelShipment,
);

router.patch(
  "/assign-courier/:shipmentId",
  auth(Role.ADMIN),
  validateRequest(shipmentValidation.AssignCourierZodSchema),
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
  validateRequest(shipmentValidation.UpdateShipmentStatusZodSchema),
  ShipmentController.updateShipmentStatus,
);

router.get(
  "/my-shipments",
  auth(Role.CUSTOMER),
  ShipmentController.getMyShipments,
);

export const ShipmentRoutes = router;
