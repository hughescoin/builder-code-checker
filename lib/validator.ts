/**
 * 8021 Attribution Validator
 * 
 * Validates if a transaction's input data is 8021 attributed by checking
 * if the last 16 bytes (32 hex characters) match the pattern "8021" repeated 8 times.
 */

// The 8021 pattern repeated 8 times = 16 bytes = 32 hex characters
export const PATTERN_8021 = '80218021802180218021802180218021'

export interface ValidationResult {
  isAttributed: boolean
  last16Bytes: string
  expectedPattern: string
  inputDataLength: number
}

/**
 * Check if the input data ends with the 8021 attribution pattern.
 * The pattern is "8021" repeated 8 times (16 bytes / 32 hex characters).
 * 
 * @param inputData - The transaction input data as a hex string (with or without 0x prefix)
 * @returns ValidationResult with attribution status and details
 */
export function validate8021Attribution(inputData: string): ValidationResult {
  // Remove 0x prefix if present
  const cleanData = inputData.startsWith('0x') ? inputData.slice(2) : inputData
  
  // Get the last 32 hex characters (16 bytes)
  const last16Bytes = cleanData.slice(-32).toLowerCase()
  
  // Check if it matches the 8021 pattern
  const isAttributed = last16Bytes === PATTERN_8021.toLowerCase()
  
  return {
    isAttributed,
    last16Bytes,
    expectedPattern: PATTERN_8021,
    inputDataLength: cleanData.length / 2, // Convert hex chars to bytes
  }
}

/**
 * Simple boolean check for 8021 attribution.
 * 
 * @param inputData - The transaction input data as a hex string
 * @returns true if the transaction is 8021 attributed
 */
export function is8021Attributed(inputData: string): boolean {
  return validate8021Attribution(inputData).isAttributed
}

/**
 * Validates if a string is a valid transaction hash format.
 * 
 * @param hash - The transaction hash to validate
 * @returns true if the hash is valid (66 chars with 0x prefix, all hex)
 */
export function isValidTransactionHash(hash: string): boolean {
  const hashRegex = /^0x[a-fA-F0-9]{64}$/
  return hashRegex.test(hash)
}
