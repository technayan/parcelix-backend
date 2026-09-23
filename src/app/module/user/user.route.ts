import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { UserController } from "./user.controller";
import { userValidation } from "./user.validation";

const router = Router();

router.patch(
  "/profile",
  auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
  validateRequest(userValidation.UpdateUserZodSchema),
  UserController.updateUser,
);

router.patch(
  "/profile-photo",
  auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
  upload.single("profilePhoto"),
  UserController.uploadProfilePhoto,
);

router.get("/", auth(Role.ADMIN), UserController.getAllUsers);

router.get("/details/:userId", auth(Role.ADMIN), UserController.getUserById);

router.patch(
  "/update-status/:userId",
  auth(Role.ADMIN),
  validateRequest(userValidation.UpdateUserStatusZodSchema),
  UserController.updateUserStatus,
);

export const UserRoutes = router;
