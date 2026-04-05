export interface PricingBlock {
  limit: number;
  price: number;
}

export interface GasRate {
  pricingBlocks: PricingBlock[];
  // Service charge is currently not used in calculations
  serviceCharge: {
    residential: number;
    nonResidential: number;
  };
}

// Gas rate schedules Map with effective dates as keys (per m³)
export const gasRateSchedules = new Map<Date, GasRate>([
  [
    new Date('2024-08-01'),
    {
      pricingBlocks: [
        { limit: 1500, price: 0.3384 },
        { limit: 3500, price: 0.3026 },
        { limit: 70000, price: 0.2647 },
        { limit: Infinity, price: 0.2481 },
      ],
      serviceCharge: {
        residential: 24.65,
        nonResidential: 79.74,
      },
    },
  ],
  [
    new Date('2025-04-01'),
    {
      pricingBlocks: [
        { limit: 1500, price: 0.3565 },
        { limit: 3500, price: 0.3182 },
        { limit: 70000, price: 0.2777 },
        { limit: Infinity, price: 0.2599 },
      ],
      serviceCharge: {
        residential: 26.38,
        nonResidential: 85.32,
      },
    },
  ],
  [
    new Date('2025-08-01'),
    {
      pricingBlocks: [
        { limit: 1500, price: 0.3729 },
        { limit: 3500, price: 0.3346 },
        { limit: 70000, price: 0.2941 },
        { limit: Infinity, price: 0.2763 },
      ],
      serviceCharge: {
        residential: 26.38,
        nonResidential: 85.32,
      },
    },
  ],
  [
    new Date('2026-01-01'),
    {
      pricingBlocks: [
        { limit: 1500, price: 0.3852 },
        { limit: 3500, price: 0.3458 },
        { limit: 70000, price: 0.3041 },
        { limit: Infinity, price: 0.2857 },
      ],
      serviceCharge: {
        residential: 27.17,
        nonResidential: 87.88,
      },
    },
  ]
]);

export const GAS_KWH_PER_M3 = 10.55;
export const GAS_EFFICIENCY = 0.85;
