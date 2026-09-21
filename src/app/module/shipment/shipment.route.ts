import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { ShipmentController } from "./shipment.controller";

const router = Router();

router.post("/", auth(Role.CUSTOMER), ShipmentController.createShipment);

export const ShipmentRoutes = router;
