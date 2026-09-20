import httpStatus from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IUpdateUserPayload } from "./user.interface";

//* Update User
const updateUserIntoDB = async (
  payload: IUpdateUserPayload,
  userId: string,
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customer: true,
      courier: true,
    },
  });

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (existingUser.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Please, contact support.",
    );
  }

  if (existingUser.isDeleted || existingUser.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.NOT_FOUND, "User is deleted.");
  }

  if (!existingUser.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User email is not verified!");
  }

  const transactionResult = await prisma.$transaction(async (tx) => {
    if (existingUser.role === Role.CUSTOMER && existingUser.customer) {
      await tx.customer.update({
        where: {
          userId,
        },
        data: {
          address: payload.address,
        },
      });
    }

    if (existingUser.role === Role.COURIER && existingUser.courier) {
      await tx.courier.update({
        where: {
          userId,
        },
        data: {
          address: payload.address,
        },
      });
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
        phone: payload.phone,
      },
      omit: { password: true },
      include: { courier: true, customer: true },
    });

    return updatedUser;
  });

  return transactionResult;
};

export const UserServices = {
  updateUserIntoDB,
};
