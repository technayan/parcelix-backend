import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validationRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	validateRequest(authValidation.RegistrationZodSchema),
	AuthController.registerCustomer,
);

router.post("/email-verification", AuthController.verifyEmail);

router.post("/login", AuthController.login);

router.get(
	"/profile",
	auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
	AuthController.getProfile,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

router.post("/google", AuthController.googleLogin);

export const AuthRoutes = router;
