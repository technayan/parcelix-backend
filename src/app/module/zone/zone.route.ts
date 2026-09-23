import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { ZoneController } from "./zone.controller";

const router = Router();

router.post("/", auth(Role.ADMIN), ZoneController.createZone);
router.patch("/:zoneId", auth(Role.ADMIN), ZoneController.updateZone);

export const ZoneRoutes = router;
