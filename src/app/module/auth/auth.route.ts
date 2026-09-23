import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(authValidation.RegisterCustomerZodSchema),
  AuthController.registerCustomer,
);

router.post(
  "/email-verification",
  validateRequest(authValidation.EmailVerificationZodSchema),
  AuthController.verifyEmail,
);

router.post(
  "/login",
  validateRequest(authValidation.LoginZodSchema),
  AuthController.login,
);

router.get(
  "/profile",
  auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
  AuthController.getProfile,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/forgot-password",
  validateRequest(authValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(authValidation.ResetPasswordZodSchema),
  AuthController.resetPassword,
);

router.post(
  "/google",
  validateRequest(authValidation.GoogleLoginZodSchema),
  AuthController.googleLogin,
);

export const AuthRoutes = router;
