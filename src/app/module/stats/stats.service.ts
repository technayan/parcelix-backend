import { ShipmentStatus, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

//* Get Overall Statistics
const getStatistics = async () => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const [earnings, completeShipmentCount, courierCount, customerCount] =
      await Promise.all([
        tx.payment.aggregate({
          _sum: {
            companyEarning: true,
          },
          where: {
            shipment: {
              status: {
                in: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED],
              },
            },
          },
        }),

        tx.shipment.count({
          where: {
            status: { in: [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED] },
          },
        }),

        tx.courier.count({
          where: {
            user: {
              status: UserStatus.ACTIVE,
            },
          },
        }),

        tx.customer.count({
          where: {
            user: {
              status: UserStatus.ACTIVE,
            },
          },
        }),
      ]);

    return {
      totalEarnings: earnings._sum.companyEarning ?? 0,
      totalCompletedShipments: completeShipmentCount ?? 0,
      totalCouriers: courierCount ?? 0,
      totalCustomers: customerCount ?? 0,
    };
  });
  return transactionResult;
};

export const StatsServices = { getStatistics };
