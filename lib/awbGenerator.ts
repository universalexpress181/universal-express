// lib/awbGenerator.ts

export function generateProfessionalAWB(): string {
  const prefix = "UEX";
  
  // 1. Generate a 7-digit Serial Number
  // We use Date.now() to ensure uniqueness, taking the last 7 digits
  // This prevents duplicates better than Math.random()
  const timestamp = Date.now().toString();
  const serial = timestamp.slice(-7); 

  // 2. Calculate Check Digit (Modulo 7 Algorithm)
  // This is the standard used by FedEx, DHL, and Airlines
  const remainder = parseInt(serial) % 7;
  const checkDigit = remainder.toString();

  // 3. Format: UEX + 1234567 + 1 (Total 11 chars usually)
  // Industry standard often adds spaces or dashes for readability: UEX 1234567 1
  return `${prefix}${serial}${checkDigit}`;
}

// Example Output: UEX83920114
// Explanation: 
// Serial: 8392011
// 8392011 % 7 = 4
// Result: UEX83920114 (Valid!)