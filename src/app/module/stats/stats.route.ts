import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { StatsController } from "./stats.controller";

const router = Router();

router.get("/", auth(Role.ADMIN), StatsController.getStatistics);

export const StatsRoutes = router;
