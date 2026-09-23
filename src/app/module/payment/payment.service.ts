import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import type { PaymentWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IRequestUser } from "../auth/auth.interface";

//* Get My Payments
const getMyPayments = async (query: IQuery, userId: string) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const transactionResult = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new AppError(httpStatus.NOT_FOUND, "Customer not found!");
    }

    const andConditions: PaymentWhereInput[] = [];

    andConditions.push({ shipment: { customerId: customer.id } });

    if (query.searchTerm) {
      andConditions.push({
        OR: [
          { id: { contains: query.searchTerm, mode: "insensitive" } },
          { bkashTrxId: { contains: query.searchTerm, mode: "insensitive" } },
        ],
      });
    }

    if (query.status) {
      andConditions.push({ status: query.status });
    }

    const payments = await tx.payment.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        bkashTrxId: true,
        paidAt: true,
        totalAmount: true,
        currency: true,
        refundAmount: true,
        refundedAt: true,
        refundReason: true,
        status: true,
      },
    });

    const total = await tx.payment.count({
      where: { AND: andConditions },
    });

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  return transactionResult;
};

//* Get Payment by ID
const getPaymentById = async (paymentId: string, user: IRequestUser) => {
  if (user.role === Role.COURIER) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You have no permission to access this resource.",
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    omit: { getwayResponse: true, companyEarning: true, courierEarning: true },
    include: {
      shipment: { select: { customer: { select: { userId: true } } } },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found!");
  }

  if (
    user.role === Role.CUSTOMER &&
    payment.shipment.customer.userId !== user.userId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You have no permission to access this resource.",
    );
  }

  return payment;
};

//* Get All Payments
const getAllPayments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const transactionResult = await prisma.$transaction(async (tx) => {
    const andConditions: PaymentWhereInput[] = [];

    if (query.searchTerm) {
      andConditions.push({
        OR: [
          { id: { contains: query.searchTerm, mode: "insensitive" } },
          { bkashTrxId: { contains: query.searchTerm, mode: "insensitive" } },
        ],
      });
    }

    if (query.status) {
      andConditions.push({ status: query.status });
    }

    const payments = await tx.payment.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        bkashTrxId: true,
        paidAt: true,
        totalAmount: true,
        currency: true,
        refundAmount: true,
        refundedAt: true,
        refundReason: true,
        status: true,
      },
    });

    const total = await tx.payment.count({
      where: { AND: andConditions },
    });

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  return transactionResult;
};

export const PaymentServices = {
  getMyPayments,
  getPaymentById,
  getAllPayments,
};
