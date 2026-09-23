export interface ICreatePricingPayload {
  name: string;
  insideDhaka: boolean;
  base: number;
  additionalPerKg: number;
  courierEarning: number;
}

export interface IUpdatePricingPayload {
  name?: string;
  insideDhaka?: boolean;
  base?: number;
  additionalPerKg?: number;
  courierEarning?: number;
}
