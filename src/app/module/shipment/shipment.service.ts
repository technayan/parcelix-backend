import type { UploadApiResponse } from "cloudinary";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import {
  CourierAvailabilityStatus,
  CourierVerificationStatus,
  PaymentStatus,
  Role,
  ShipmentStatus,
  TrackingShipmentStatus,
} from "../../../generated/prisma/enums";
import type { ShipmentWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import type { IQuery } from "../../interfaces";
import { getBkashIdToken } from "../../lib/bkash";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import { generateInvoiceNumber } from "../../utils/getInvoiceNumber";
import { generateTrackingId } from "../../utils/getTrackingId";
import type { IRequestUser } from "../auth/auth.interface";
import type {
  IAssignCourierPayload,
  ICreateShipmentPayload,
  IPayShipmentPayload,
  IShipmentStatusPayload,
  IUpdateShipmentStatusPayload,
} from "./shipment.interface";

//* Create Shipment
const createShipmentIntoDB = async (
  payload: ICreateShipmentPayload,
  userId: string,
) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { id: userId },
      include: { customer: true },
      omit: { password: true },
    });

    if (!existingUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found!");
    }

    // Calculaing Delivery Fee
    let deliveryFee = 0;
    const additionalWeight = Math.ceil(payload.weight - 1);

    const originHub = await tx.hub.findUnique({
      where: { id: payload.originHubId },
    });

    const destinationHub = await tx.hub.findUnique({
      where: { id: payload.destinationHubId },
    });

    const isInDhaka = originHub?.isInDhaka && destinationHub?.isInDhaka;

    const pricing = await tx.pricing.findFirst({
      where: { insideDhaka: isInDhaka },
    });

    if (!pricing) {
      throw new AppError(httpStatus.NOT_FOUND, "Pricing not found!");
    }

    const base = Number(pricing?.base);
    const additionalFee = Number(pricing?.additionalPerKg);

    if (additionalWeight > 0) {
      deliveryFee = base + additionalWeight * additionalFee;
    } else {
      deliveryFee = base;
    }

    const companyEarning = deliveryFee - Number(pricing.courierEarning);

    const shipment = await tx.shipment.create({
      data: {
        ...payload,
        customerId: existingUser?.customer?.id as string,
        deliveryFee,
      },
      include: { customer: { include: { user: true } } },
    });

    const bkashIdToken = await getBkashIdToken();

    const bkashCreatePaymentResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-key": config.bkash_app_key,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: existingUser.email,
          callbackURL: `${config.bkash_callback_url}/shipments/payment/callback`,
          amount: deliveryFee,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: shipment.id,
        }),
      },
    );

    const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

    //* Create Payment
    await tx.payment.create({
      data: {
        totalAmount: deliveryFee,
        merchantInvoiceNumber: shipment.id,
        bkashPaymentId: bkashCreatePaymentResult.paymentID,
        payerReference: existingUser.email,
        getwayResponse: bkashCreatePaymentResult,
        shipmentId: shipment.id,
        companyEarning,
        courierEarning: pricing.courierEarning,
      },
    });

    return bkashCreatePaymentResult.bkashURL;
  });

  return { paymentUrl: transactionResult };
};

//* Pay Shipment
const payShipment = async (
  payload: IPayShipmentPayload,
  user: IRequestUser,
) => {
  const shipmentId = payload.shipmentId;

  const existingShipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      customer: true,
    },
  });

  if (!existingShipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (existingShipment.status !== ShipmentStatus.PENDING_PAYMENT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Shipment is ${existingShipment.status}`,
    );
  }

  const amount = existingShipment.deliveryFee.toString();

  const bkashIdToken = await getBkashIdToken();

  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: user.email,
        callbackURL: `${config.bkash_callback_url}/shipments/payment/callback`,
        amount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: existingShipment.id,
      }),
    },
  );

  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  await prisma.payment.update({
    where: { shipmentId: existingShipment.id },
    data: {
      merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
      getwayResponse: bkashCreatePaymentResult,
      bkashPaymentId: bkashCreatePaymentResult.paymentID,
    },
  });

  return { paymentUrl: bkashCreatePaymentResult.bkashURL };
};

//* Pay Shipment Callback
const payShipmentCallback = async (query: Record<string, any>) => {
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const paymentId = query.paymentID;
      if (!paymentId)
        throw new AppError(httpStatus.NOT_FOUND, "PaymentID not found!");

      const status = query.status;
      if (!status)
        throw new AppError(httpStatus.BAD_REQUEST, "Payment failed!");

      const bkashIdToken = await getBkashIdToken();
      if (!bkashIdToken)
        throw new AppError(httpStatus.NOT_FOUND, "Bkash IdToken not found!");

      //* Payment Execute
      const paymentExecuteResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/execute`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            authorization: bkashIdToken,
            "X-App-Key": config.bkash_app_key,
          },
          body: JSON.stringify({
            paymentID: paymentId,
          }),
        },
      );

      const paymentExecuteResult = await paymentExecuteResponse.json();

      if (status === "success") {
        const shipment = await tx.shipment.findUnique({
          where: { id: paymentExecuteResult.merchantInvoiceNumber },
          include: {
            customer: {
              include: { user: true },
            },
          },
        });

        if (!shipment) {
          throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
        }

        const invoiceNumber = generateInvoiceNumber();

        const trackingId = generateTrackingId();

        const updatedPayment = await tx.payment.update({
          where: { bkashPaymentId: paymentId },
          data: {
            bkashTrxId: paymentExecuteResult.trxID,
            getwayResponse: paymentExecuteResult,
            paidAt: paymentExecuteResult.paymentExecuteTime,
            status: PaymentStatus.PAID,
          },
        });

        //* Genereate Invoice PDF
        const payload = {
          invoiceNumber,
          shipmentId: shipment.id,
          trackingId,
          senderName: shipment.senderName,
          senderPhone: shipment.senderPhone,
          senderAddress: shipment.senderAddress,
          receiverName: shipment.receiverName,
          receiverPhone: shipment.receiverPhone,
          receiverAddress: shipment.receiverAddress,
          weight: Number(shipment.weight),
          isFragile: shipment.isFragile,
          paymentGateway: updatedPayment.paymentGateway,
          transactionId: updatedPayment.bkashTrxId as string,
          totalAmount: Number(updatedPayment.totalAmount),
        };
        const invoicePDF = await generateInvoicePDF(payload);

        // Upload Invoice to Cloudinary
        const invoiceUploadResult = await new Promise<UploadApiResponse>(
          (resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                { resource_type: "raw", format: "pdf" },
                (error, result) => {
                  if (error) {
                    return reject(error);
                  }

                  if (!result) {
                    return reject(
                      new AppError(
                        httpStatus.INTERNAL_SERVER_ERROR,
                        "No Result Returned From Cloudinary",
                      ),
                    );
                  }

                  resolve(result);
                },
              )
              .end(invoicePDF);
          },
        );

        await tx.shipment.update({
          where: { id: paymentExecuteResult.merchantInvoiceNumber },
          data: {
            status: ShipmentStatus.PAID,
            trackingId,
            invoiceUrl: invoiceUploadResult.secure_url,
            invoicePublicId: invoiceUploadResult.public_id,
          },
        });

        await tx.trackingShipment.create({
          data: {
            shipmentId: paymentExecuteResult.merchantInvoiceNumber,
            status: TrackingShipmentStatus.PAID,
          },
        });

        // Send Invoice via Email
        const templatePath = path.join(
          process.cwd(),
          "src/app/templates/payment.ejs",
        );

        const html = await ejs.renderFile(templatePath, {
          name: shipment.customer.user.name,
          trackingId,
          invoiceNumber,
          amount: updatedPayment.totalAmount,
          paymentGateway: updatedPayment.paymentGateway,
        });

        await transporter.sendMail({
          from: config.email_sender,
          to: shipment.customer.user.email,
          subject: "Shipment Payment Invoice - Parcelix",
          html,
          attachments: [
            {
              filename: "invoice.pdf",
              content: invoicePDF,
            },
          ],
        });

        return {
          redirectUrl: `${config.frontend_url}/dashboard/shipments?status=success`,
        };
      } else if (status === "failure") {
        await tx.payment.update({
          where: { bkashPaymentId: paymentId },
          data: {
            getwayResponse: paymentExecuteResult,
            status: PaymentStatus.FAILED,
          },
        });
        return {
          redirectUrl: `${config.frontend_url}/dashboard/shipments?status=failure`,
        };
      } else if (status === "cancel") {
        await tx.payment.update({
          where: { bkashPaymentId: paymentId },
          data: {
            getwayResponse: paymentExecuteResult,
            status: PaymentStatus.CANCELLED,
          },
        });
        return {
          redirectUrl: `${config.frontend_url}/dashboard/shipments?status=cancel`,
        };
      } else {
        return {
          redirectUrl: `${config.frontend_url}/dashboard/shipments?error=payment-failed`,
        };
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    },
  );
  return transactionResult;
};

//* Cancel Shipment
const cancelShipment = async (shipmentId: string, user: IRequestUser) => {
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const existingShipment = await tx.shipment.findUnique({
        where: {
          id: shipmentId,
          customer: {
            userId: user.userId,
          },
        },
        include: {
          payment: true,
        },
      });

      if (!existingShipment) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
      }

      if (existingShipment.status === ShipmentStatus.CANCELLED) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Shipment is already cancelled.",
        );
      }

      const cancellable =
        existingShipment.status === ShipmentStatus.PENDING_PAYMENT ||
        existingShipment.status === ShipmentStatus.PAID ||
        existingShipment.status === ShipmentStatus.PICKUP_REQUESTED ||
        existingShipment.status === ShipmentStatus.COURIER_ASSIGNED;

      if (!cancellable) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Shipment is ${existingShipment.status} and cannot be cancelled.`,
        );
      }

      //* Update Shipment
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: ShipmentStatus.CANCELLED,
        },
      });

      const isRefundable =
        existingShipment.status !== ShipmentStatus.PENDING_PAYMENT;

      if (isRefundable) {
        //* Refund Payment
        const bkashIdToken = await getBkashIdToken();

        if (!bkashIdToken) {
          throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Bkash IdToken not found!",
          );
        }

        const bkashRefundResponse = await fetch(
          `${config.bkash_base_url}/tokenized/checkout/payment/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              authorization: bkashIdToken,
              "X-App-Key": config.bkash_app_key,
            },
            body: JSON.stringify({
              paymentID: existingShipment.payment?.bkashPaymentId,
              trxID: existingShipment.payment?.bkashTrxId,
              amount: existingShipment.payment?.totalAmount.toString(),
              sku: "Shipment Cancellation",
              reason: "Customer cancelled the shipment",
            }),
          },
        );

        const bkashRefundResult = await bkashRefundResponse.json();

        //* Update Payment
        await tx.payment.update({
          where: { shipmentId: existingShipment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundTrxId: bkashRefundResult.refundTrxID,
            refundAmount: bkashRefundResult.amount.toString(),
            refundedAt: bkashRefundResult.completedTime,
            refundReason: "Customer cancelled the shipment",
            getwayResponse: bkashRefundResult,
          },
        });
      }

      const newPaymentInfo = await tx.payment.findUnique({
        where: { shipmentId },
      });

      const templatePath = path.join(
        process.cwd(),
        "src/app/templates/cancel-shipment.ejs",
      );

      const html = await ejs.renderFile(templatePath, {
        name: user.name,
        trackingId: existingShipment.trackingId,
        shipmentId,
        amount: newPaymentInfo?.totalAmount,
      });

      await transporter.sendMail({
        from: config.email_sender,
        to: user.email,
        subject: "Shipment Cancelled - Parcelix",
        html,
      });

      return {
        updatedShipment,
        newPaymentInfo,
      };
    },
    {
      maxWait: 10000,
      timeout: 30000,
    },
  );

  return transactionResult;
};

//* Request for Pickup
const requestPickup = async (
  payload: IShipmentStatusPayload,
  userId: string,
) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: payload.shipmentId },
    include: { customer: true },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (shipment.customer.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You have no permission to access this resource",
    );
  }

  if (shipment.status === ShipmentStatus.PENDING_PAYMENT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please, pay for the shipment to request for pickup.",
    );
  }

  if (shipment.status !== ShipmentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Shipment is ${shipment.status}`,
    );
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id: payload.shipmentId },
    data: {
      status: ShipmentStatus.PICKUP_REQUESTED,
    },
  });

  return updatedShipment;
};

//* Get All Shipments (Admin)
const getAllShipments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: ShipmentWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { description: { contains: query.searchTerm, mode: "insensitive" } },
        { senderName: { contains: query.searchTerm, mode: "insensitive" } },
        { receiverName: { contains: query.searchTerm, mode: "insensitive" } },
        { senderPhone: { contains: query.searchTerm, mode: "insensitive" } },
        { receiverPhone: { contains: query.searchTerm, mode: "insensitive" } },
        { trackingId: { contains: query.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (query.status) {
    andConditions.push({ status: query.status });
  }

  if (query.customerId) {
    andConditions.push({ customerId: query.customerId });
  }

  if (query.courierId) {
    andConditions.push({ courierId: query.courierId });
  }

  if (query.trackingId) {
    andConditions.push({ trackingId: query.trackingId });
  }

  const shipments = await prisma.shipment.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      trackingId: true,
      senderName: true,
      courier: { select: { user: { select: { name: true } } } },
      originHub: { select: { name: true } },
      destinationHub: { select: { name: true } },
      status: true,
    },
  });

  const total = await prisma.shipment.count({
    where: { AND: andConditions },
  });

  return {
    data: shipments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

//* Get Shipment by ID
const getShipmentById = async (shipmentId: string, user: IRequestUser) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      customer: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      courier: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      payment: {
        select: { id: true, bkashTrxId: true, totalAmount: true, status: true },
      },
      originZone: {
        select: { name: true },
      },
      originHub: {
        select: { name: true },
      },
      destinationZone: {
        select: { name: true },
      },
      destinationHub: {
        select: { name: true },
      },
    },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (user.role === Role.CUSTOMER) {
    if (shipment.customer.user.id !== user.userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You have no permission to access this resource.",
      );
    }
  }

  if (user.role === Role.COURIER) {
    if (shipment.courier?.user.id !== user.userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You have no permission to access this resource.",
      );
    }
  }

  return shipment;
};

//* Assign Courier
const assignCourier = async (
  shipmentId: string,
  payload: IAssignCourierPayload,
) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
    }

    if (shipment.status !== ShipmentStatus.PICKUP_REQUESTED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No pickup request were created.",
      );
    }

    const courier = await tx.courier.findUnique({
      where: { id: payload.courierId },
    });

    if (!courier) {
      throw new AppError(httpStatus.NOT_FOUND, "Courier not found!");
    }

    if (courier.verificationStatus !== CourierVerificationStatus.APPROVED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Courier is not verified.");
    }

    if (courier.availabilityStatus !== CourierAvailabilityStatus.AVAILABLE) {
      throw new AppError(httpStatus.BAD_REQUEST, "Courier is not available.");
    }

    const updatedShipment = tx.shipment.update({
      where: { id: shipmentId },
      data: {
        courierId: courier.id,
        status: ShipmentStatus.COURIER_ASSIGNED,
      },
    });

    return updatedShipment;
  });

  return transactionResult;
};

//* Get Assigned Shipments for (Courier)
const getAssignedShipments = async (query: IQuery, userId: string) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "asc";

  const transactionResult = await prisma.$transaction(async (tx) => {
    const courier = await tx.courier.findUnique({
      where: { userId },
    });

    if (!courier) {
      throw new AppError(httpStatus.NOT_FOUND, "Courier not found!");
    }

    const assignedShipments = await tx.shipment.findMany({
      where: { courierId: courier.id, status: ShipmentStatus.COURIER_ASSIGNED },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        courierId: true,
        customerId: true,
        senderName: true,
        status: true,
        originZone: { select: { name: true } },
        originHub: { select: { name: true } },
        destinationZone: { select: { name: true } },
        destinationHub: { select: { name: true } },
      },
    });

    const total = await tx.shipment.count({
      where: { courierId: courier.id, status: ShipmentStatus.COURIER_ASSIGNED },
    });

    return {
      data: assignedShipments,
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

//* Update Shipment Status
const updateShipmentStatus = async (
  shipmentId: string,
  payload: IUpdateShipmentStatusPayload,
  userId: string,
) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        customer: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
    }

    const courier = await tx.courier.findUnique({
      where: { userId },
    });

    if (shipment.courierId !== courier?.id) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have no permission to access this resource.",
      );
    }

    if (shipment.status === ShipmentStatus.CANCELLED) {
      throw new AppError(httpStatus.BAD_REQUEST, "The shipment is cancelled.");
    }

    if (
      shipment.status === ShipmentStatus.PENDING_PAYMENT ||
      shipment.status === ShipmentStatus.PAID ||
      shipment.status === ShipmentStatus.PICKUP_REQUESTED
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `You have no permission to access this resource.s`,
      );
    }

    if (
      shipment.status === ShipmentStatus.COURIER_ASSIGNED &&
      payload.status !== ShipmentStatus.PICKED_UP
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status must be ${ShipmentStatus.PICKED_UP}`,
      );
    }

    if (
      shipment.status === ShipmentStatus.PICKED_UP &&
      payload.status !== ShipmentStatus.AT_ORIGIN_HUB
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status must be ${ShipmentStatus.AT_ORIGIN_HUB}`,
      );
    }

    if (
      shipment.status === ShipmentStatus.AT_ORIGIN_HUB &&
      payload.status !== ShipmentStatus.IN_TRANSIT
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status must be ${ShipmentStatus.IN_TRANSIT}`,
      );
    }

    if (
      shipment.status === ShipmentStatus.IN_TRANSIT &&
      payload.status !== ShipmentStatus.AT_DESTINATION_HUB
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status must be ${ShipmentStatus.AT_DESTINATION_HUB}`,
      );
    }

    if (
      shipment.status === ShipmentStatus.AT_DESTINATION_HUB &&
      payload.status !== ShipmentStatus.OUT_FOR_DELIVERY
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status must be ${ShipmentStatus.OUT_FOR_DELIVERY}`,
      );
    }

    if (
      shipment.status === ShipmentStatus.OUT_FOR_DELIVERY &&
      payload.status !== ShipmentStatus.DELIVERED &&
      payload.status !== ShipmentStatus.DELIVERY_FAILED
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status can be either ${ShipmentStatus.DELIVERED} or ${ShipmentStatus.DELIVERY_FAILED}`,
      );
    }

    if (
      shipment.status === ShipmentStatus.DELIVERY_FAILED &&
      payload.status !== ShipmentStatus.RETURNED
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Shipment with status ${shipment.status} can not be updated to ${payload.status}. Next status must be ${ShipmentStatus.RETURNED}`,
      );
    }

    if (payload.status === ShipmentStatus.RETURNED && !payload.returnReason) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Return reason must be provided while returning the shipment`,
      );
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `The shipment is already delivered.`,
      );
    }

    if (shipment.status === ShipmentStatus.RETURNED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `The shipment is already returned.`,
      );
    }

    const pickupDate =
      payload.status === ShipmentStatus.PICKED_UP ? new Date() : undefined;

    const deliveryDate =
      payload.status === ShipmentStatus.DELIVERED ? new Date() : undefined;

    const returnDate =
      payload.status === ShipmentStatus.RETURNED ? new Date() : undefined;

    const reason =
      payload.status === ShipmentStatus.RETURNED
        ? payload.returnReason
        : undefined;

    // Update Shipment Status
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status: payload.status,
        pickupDate,
        returnReason: reason,
        deliveredAt: deliveryDate,
        returnedAt: returnDate,
      },
    });

    // Update Shipment Tracking
    await tx.trackingShipment.create({
      data: {
        shipmentId: updatedShipment.id,
        status: payload.status,
      },
    });

    // Send Email
    if (
      payload.status === ShipmentStatus.RETURNED ||
      payload.status === ShipmentStatus.DELIVERED
    ) {
      const isDelivered = payload.status === ShipmentStatus.DELIVERED;

      const tempatePath = path.join(
        process.cwd(),
        `src/app/templates/${isDelivered ? "shipment-delivered.ejs" : "shipment-returned.ejs"}`,
      );

      const html = await ejs.renderFile(tempatePath, {
        name: shipment.customer.user.name,
        trackingId: updatedShipment.trackingId,
        receiverName: updatedShipment.receiverName,
        deliveredAt: updatedShipment.deliveredAt,
        returnReason: updatedShipment.returnReason,
        returnedAt: updatedShipment.returnedAt,
      });

      await transporter.sendMail({
        from: config.email_sender,
        to: shipment.customer.user.email,
        subject: isDelivered
          ? "Shipment Delivered - Parcelix"
          : "Shipment Returned - Parcelix",
        html,
      });
    }

    return updatedShipment;
  });

  return transactionResult;
};

export const ShipmentServices = {
  createShipmentIntoDB,
  payShipment,
  payShipmentCallback,
  requestPickup,
  getAllShipments,
  getShipmentById,
  cancelShipment,
  assignCourier,
  getAssignedShipments,
  updateShipmentStatus,
};
