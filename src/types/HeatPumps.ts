// https://www.pickhvac.com/heat-pump-efficiency-temperature-cop-curves-smart-cold
export const COP_POINTS = [
  { tempC: -20.6, cop: 1.85 }, // -5°F
  { tempC: -15, cop: 2.25 }, // 5°F
  { tempC: -8.3, cop: 2.75 }, // 17°F
  { tempC: -3.9, cop: 3.2 }, // 25°F
  { tempC: 1.7, cop: 3.6 }, // 35°F
  { tempC: 8.3, cop: 4.0 }, // 47°F
  { tempC: 15.6, cop: 4.5 }, // 60°F
];

// https://moovair.com/wp-content/uploads/SUB_M_S24FMA_2.pdf
// 1.41 at -30°C (-22°F)
// 1.91 at -15°C (5°F)
// 2.5 at -8.3°C (17°F)

export const getDynamicCOP = (tempC: number) => {
  if (tempC <= COP_POINTS[0].tempC) return COP_POINTS[0].cop;
  if (tempC >= COP_POINTS[COP_POINTS.length - 1].tempC)
    return COP_POINTS[COP_POINTS.length - 1].cop;
  for (let i = 1; i < COP_POINTS.length; i++) {
    const prev = COP_POINTS[i - 1];
    const curr = COP_POINTS[i];
    if (tempC <= curr.tempC) {
      // Linear interpolation
      const t = (tempC - prev.tempC) / (curr.tempC - prev.tempC);
      return prev.cop + t * (curr.cop - prev.cop);
    }
  }
  return COP_POINTS[COP_POINTS.length - 1].cop;
};
