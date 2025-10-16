export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


export function getAddressString(addr: unknown): string {
  if (typeof addr === "string") return addr;
  if (typeof addr === "object" && addr !== null && "current" in addr) {
    return (addr as { current: unknown }).current as string || "";
  }
  return "";
}

// Smart contract constants
export const MIN_CONTRIBUTION_MICROSTX = 100; // Minimum 100 microSTX = 0.0001 STX
export const MIN_CONTRIBUTION_STX = 0.0001; // Minimum in STX

export const formatMicroSTXToSTX = (microSTX: number): string => {
  if (isNaN(microSTX) || microSTX < 0) return "0.000000";
  return (microSTX / 1000000).toFixed(6);
};

export const formatSTXToMicroSTX = (stx: number): number => {
  if (isNaN(stx) || stx < 0) return 0;
  return Math.floor(stx * 1000000);
};

// Helper function to validate STX amount
export const isValidSTXAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0 && num <= 1000000; // Max 1M STX
};

// Helper function to format STX amount for display
export const formatSTXDisplay = (stx: number): string => {
  if (isNaN(stx) || stx < 0) return "0.000000";
  return stx.toFixed(6);
};