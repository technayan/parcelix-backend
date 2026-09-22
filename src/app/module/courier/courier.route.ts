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

router.get("/", auth(Role.ADMIN), CourierController.getAllCouriers);

router.get(
  "/details/:courierId",
  auth(Role.ADMIN),
  CourierController.getCourierById,
);

router.get("/stats", auth(Role.COURIER), CourierController.getCourierStats);

router.patch(
  "/availability-status",
  auth(Role.COURIER),
  CourierController.updateCourierAvailability,
);

export const CourierRoutes = router;
