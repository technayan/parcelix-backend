import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { HubController } from "./hub.controller";

const router = Router();

router.post("/", auth(Role.ADMIN), HubController.createHub);
router.patch("/:hubId", auth(Role.ADMIN), HubController.updateHub);

export const HubRoutes = router;
