import { Router } from "express";
import { upload } from "../../lib/multer";
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

export const CourierRoutes = router;
