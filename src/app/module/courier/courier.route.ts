import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { CourierController } from "./courier.controller";

const router = Router();

router.post(
	"/",
	upload.fields([
		{
			name: "resume",
			maxCount: 1,
		},
	]),
	CourierController.applyAsCourier,
);

router.post("/verify-email", CourierController.verifyCourierEmail);

router.post(
	"/review-courier",
	auth(Role.ADMIN),
	CourierController.reviewCourier,
);

export const CourierRoutes = router;
