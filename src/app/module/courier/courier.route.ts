import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { CourierController } from "./courier.controller";
import { courierValidation } from "./courier.validation";

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

router.post(
  "/verify-email",
  validateRequest(courierValidation.VerifyCourierEmailZodSchema),
  CourierController.verifyCourierEmail,
);

router.post(
  "/review-courier",
  auth(Role.ADMIN),
  validateRequest(courierValidation.ReviewCourierZodSchema),
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
  validateRequest(courierValidation.UpdateCourierAvailabilityZodSchema),
  CourierController.updateCourierAvailability,
);

export const CourierRoutes = router;
