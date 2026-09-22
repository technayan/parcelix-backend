import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();

router.get(
  "/my-payments",
  auth(Role.CUSTOMER),
  PaymentController.getMyPayments,
);

router.get(
  "/details/:paymentId",
  auth(Role.CUSTOMER, Role.ADMIN),
  PaymentController.getPaymentById,
);

export const PaymentRoutes = router;
