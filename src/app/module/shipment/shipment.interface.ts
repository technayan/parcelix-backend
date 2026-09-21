export interface ICreateShipmentPayload {
  originZoneId: string;
  originHubId: string;
  destinationZoneId: string;
  destinationHubId: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  description?: string;
  isFragile: boolean;
  pickupInstructions?: string;
}

export interface IPayShipmentPayload {
  shipmentId: string;
}

export interface IGenerateInvoicePayload {
  invoiceNumber: string;
  shipmentId: string;
  trackingId: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  isFragile: boolean;
  paymentGateway: string;
  transactionId: string;
  totalAmount: number;
}

export interface IShipmentStatusPayload {
  shipmentId: string;
}
