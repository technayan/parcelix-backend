import type { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import type { UserWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
  IUpdateUserPayload,
  IUpdateUserStatusPayload,
} from "./user.interface";

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

//* Upload Profile Photo
const uploadProfilePhotoIntoDB = async (buffer: Buffer, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profilePhoto: true,
      profilePhotoPublicId: true,
    },
  });

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(
                new AppError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  "Error while file uploading.",
                ),
              );
            }

            return resolve(result);
          },
        )
        .end(buffer);
    },
  );

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profilePhoto: cloudinaryResult?.secure_url,
      profilePhotoPublicId: cloudinaryResult.public_id,
    },
    omit: { password: true },
  });

  if (currentUser?.profilePhotoPublicId && currentUser.profilePhoto) {
    await cloudinary.uploader.destroy(currentUser.profilePhotoPublicId);
  }

  return updatedUser;
};

//* Get All Users
const getAllUsers = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: UserWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: query.searchTerm, mode: "insensitive" } },
        { email: { contains: query.searchTerm, mode: "insensitive" } },
        { phone: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  if (query.emailVerified) {
    andConditions.push({ emailVerified: query.emailVerified });
  }

  if (query.role) {
    andConditions.push({ role: query.role });
  }

  const users = await prisma.user.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      role: true,
      status: true,
    },
  });

  const total = await prisma.user.count({
    where: { AND: andConditions },
  });

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

//* Get User by ID
const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true, courier: true },
    omit: { password: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  return user;
};

//* Update User Status
const updateUserStatus = async (
  userId: string,
  payload: IUpdateUserStatusPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });

  if (!user || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.status === payload.status) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User is already ${user.status}`,
    );
  }

  const isDeleted = payload.status === UserStatus.DELETED;
  const deletedAt = isDeleted ? new Date() : undefined;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: payload.status,
      isDeleted,
      deletedAt,
    },
  });

  return updatedUser;
};

export const UserServices = {
  updateUserIntoDB,
  uploadProfilePhotoIntoDB,
  getAllUsers,
  getUserById,
  updateUserStatus,
};
