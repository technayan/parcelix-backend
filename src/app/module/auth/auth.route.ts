import { Router } from "express";
import { validateRequest } from "../../middleware/validationRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(authValidation.RegistrationZodSchema),
  AuthController.registerCustomer,
);

export const AuthRoutes = router;
