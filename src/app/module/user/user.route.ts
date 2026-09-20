import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
  UserController.updateUser,
);

export const UserRoutes = router;
