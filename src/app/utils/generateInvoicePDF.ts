import PDFDocument from "pdfkit";
import type { IGenerateInvoicePayload } from "../module/shipment/shipment.interface";

export const generateInvoicePDF = async (payload: IGenerateInvoicePayload) => {
  const pdfDocument = new PDFDocument({ margin: 50 });

  const pdfChunks: Buffer[] = [];

  pdfDocument.on("data", (chunk: Buffer) => {
    pdfChunks.push(chunk);
  });

  const pdfReadyPromise = new Promise<Buffer>((resolve) => {
    pdfDocument.on("end", () => {
      resolve(Buffer.concat(pdfChunks));
    });
  });

  // ==============================
  // COLORS
  // ==============================

  const navy = "#0F172A";
  const orange = "#F97316";
  const green = "#10B981";
  const gray = "#64748B";
  const lightGray = "#E2E8F0";

  // ==============================
  // HEADER
  // ==============================

  pdfDocument
    .fillColor(navy)
    .fontSize(28)
    .font("Helvetica-Bold")
    .text("Parcel", {
      continued: true,
    });

  pdfDocument.fillColor(orange).text("ix");

  pdfDocument
    .fillColor(gray)
    .fontSize(10)
    .font("Helvetica")
    .text("Logistics made simple");

  pdfDocument.moveDown(1);

  // ==============================
  // INVOICE TITLE
  // ==============================

  pdfDocument
    .fillColor(navy)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Payment Invoice");

  pdfDocument.moveDown(0.5);

  pdfDocument
    .fillColor(gray)
    .fontSize(12)
    .font("Helvetica")
    .text(`Invoice Number: ${payload.invoiceNumber}`);

  pdfDocument.moveDown();

  pdfDocument
    .fillColor(gray)
    .fontSize(12)
    .font("Helvetica")
    .text(`Shipment ID: ${payload.shipmentId}`);

  pdfDocument.moveDown();

  pdfDocument
    .fillColor(gray)
    .fontSize(12)
    .font("Helvetica")
    .text(`Tracking ID: ${payload.trackingId}`);

  pdfDocument.moveDown();

  // PAID STATUS

  pdfDocument
    .fillColor(green)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("✓ PAYMENT SUCCESSFUL");

  pdfDocument.moveDown();

  // ==============================
  // SENDER
  // ==============================

  pdfDocument
    .fillColor(navy)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Sender:");

  pdfDocument.moveDown(0.3);

  pdfDocument
    .fillColor("#334155")
    .fontSize(12)
    .font("Helvetica")
    .text(`Name: ${payload.senderName}`)
    .text(`Phone: ${payload.senderPhone}`)
    .text(`Address: ${payload.senderAddress}`);

  pdfDocument.moveDown();

  // ==============================
  // RECEIVER
  // ==============================

  pdfDocument
    .fillColor(navy)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Receiver:");

  pdfDocument.moveDown(0.3);

  pdfDocument
    .fillColor("#334155")
    .fontSize(12)
    .font("Helvetica")
    .text(`Name: ${payload.receiverName}`)
    .text(`Phone: ${payload.receiverPhone}`)
    .text(`Address: ${payload.receiverAddress}`);

  pdfDocument.moveDown();

  // ==============================
  // SHIPMENT DETAILS
  // ==============================

  pdfDocument
    .fillColor(navy)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Shipment Details:");

  pdfDocument.moveDown(0.3);

  pdfDocument
    .fillColor("#334155")
    .fontSize(12)
    .font("Helvetica")
    .text(`Weight: ${payload.weight} kg`)
    .text(`Fragile: ${payload.isFragile ? "Yes" : "No"}`);

  pdfDocument.moveDown();

  // ==============================
  // PAYMENT
  // ==============================

  pdfDocument
    .fillColor(navy)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Payment Details:");

  pdfDocument.moveDown(0.3);

  pdfDocument
    .fillColor("#334155")
    .fontSize(12)
    .font("Helvetica")
    .text(`Payment Gateway: ${payload.paymentGateway}`)
    .text(`Transaction ID: ${payload.transactionId}`);

  pdfDocument.moveDown();

  // ==============================
  // TOTAL
  // ==============================

  pdfDocument
    .moveTo(50, pdfDocument.y)
    .lineTo(545, pdfDocument.y)
    .strokeColor(lightGray)
    .stroke();

  pdfDocument.moveDown();

  pdfDocument
    .fillColor(gray)
    .fontSize(12)
    .font("Helvetica")
    .text("Delivery Fee:", {
      continued: true,
    });

  pdfDocument
    .fillColor(navy)
    .font("Helvetica-Bold")
    .text(`BDT ${payload.totalAmount}`, {
      align: "right",
    });

  pdfDocument.moveDown(0.5);

  pdfDocument
    .fillColor(navy)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Total Paid", {
      continued: true,
    });

  pdfDocument.fillColor(orange).text(`BDT ${payload.totalAmount}`, {
    align: "right",
  });

  pdfDocument.moveDown(3);

  // ==============================
  // FOOTER
  // ==============================

  pdfDocument
    .fillColor(gray)
    .fontSize(12)
    .font("Helvetica")
    .text("Thank you for choosing Parcelix!", {
      align: "center",
    });

  pdfDocument.text("This is a computer-generated invoice.", {
    align: "center",
  });

  pdfDocument.end();

  const invoicePDF = await pdfReadyPromise;

  return invoicePDF;
};
