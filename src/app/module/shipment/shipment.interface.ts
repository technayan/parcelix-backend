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
