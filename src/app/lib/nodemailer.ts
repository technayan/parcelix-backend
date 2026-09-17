import { createTransport } from "nodemailer";
import config from "../config";

export const transporter = createTransport({
  service: "gmail",
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
});
