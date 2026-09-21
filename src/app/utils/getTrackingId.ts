export const generateTrackingId = () => {
  const prefix = "TRK";

  const firstPart = Math.random().toString(36).slice(-8).toUpperCase();
  const secondPart = Math.random().toString(36).slice(-8).toUpperCase();

  // Example output: TRK-M7K8W-A4D9X2
  return `${prefix}-${firstPart}-${secondPart}`;
};
