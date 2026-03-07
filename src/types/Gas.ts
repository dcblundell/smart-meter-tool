import { CustomerType } from "./Energy";

export const GasServiceCharge = {
  [CustomerType.RESIDENTIAL]: 27.17,
  [CustomerType.NON_RESIDENTIAL]: 87.88,
};

// 2026 Gas Rates (per m3)
export const GasPricingBlocks = [
  { limit: 1500, price: 0.3852 },
  { limit: 3500, price: 0.3458 },
  { limit: 70000, price: 0.3041 },
  { limit: Infinity, price: 0.2857 },
];

export const GAS_KWH_PER_M3 = 10.55;
export const GAS_EFFICIENCY = 0.85;
