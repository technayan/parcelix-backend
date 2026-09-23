import cron from "node-cron";
import { CourierVerificationStatus, Role } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

export const deleteUnverifiedCouriers = async () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const deletedCouriers = await prisma.user.deleteMany({
        where: {
          role: Role.COURIER,
          emailVerified: false,
          createdAt: { lte: oneHourAgo },
          courier: {
            verificationStatus: CourierVerificationStatus.PENDING,
          },
        },
      });

      if (deletedCouriers.count > 0) {
        console.log(
          `Cron: Deleted ${deletedCouriers.count} courier applications with unverified email and older than one hour.`,
        );
      }
    } catch (error) {
      console.log(
        "Cron: Failed to delete courier applications with unverified email.",
        error,
      );
    }

    console.log(
      "Cron: Unverified courier delete crons schedule (every 10 minutes)",
    );
  });
};
