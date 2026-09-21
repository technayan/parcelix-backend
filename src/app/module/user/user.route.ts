import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();

router.patch(
	"/profile/:id",
	auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
	UserController.updateUser,
);

router.patch(
	"/profile-photo",
	auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
	upload.single("profilePhoto"),
	UserController.uploadProfilePhoto,
);

export const UserRoutes = router;
