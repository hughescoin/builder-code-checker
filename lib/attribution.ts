import { Attribution } from 'ox/erc8021'

/**
 * Parsed attribution data from an 8021-attributed transaction
 */
export interface ParsedAttribution {
  /** Schema ID (0 = canonical registry, 1 = custom registry) */
  schemaId: number
  /** Builder codes (e.g., ["baseapp", "morpho"]) */
  codes: string[]
  /** Custom code registry (only for schema 1) */
  codeRegistry?: {
    address: string
    chainId: number
  }
  /** Whether the attribution was successfully parsed */
  isValid: boolean
  /** The raw input data that was parsed */
  rawInputData: string
}

/**
 * Parse attribution data from transaction input data using the ox library.
 * 
 * @param inputData - The transaction input data (hex string with 0x prefix)
 * @returns ParsedAttribution object or null if invalid/not attributed
 */
export function parseAttribution(inputData: string): ParsedAttribution | null {
  // Ensure 0x prefix
  const data = (inputData.startsWith('0x') ? inputData : `0x${inputData}`) as `0x${string}`
  
  try {
    const attribution = Attribution.fromData(data)
    
    if (!attribution || attribution.id === undefined) {
      return null
    }

    return {
      schemaId: attribution.id,
      codes: [...attribution.codes],
      codeRegistry: attribution.codeRegistry ? {
        address: attribution.codeRegistry.address,
        chainId: attribution.codeRegistry.chainId,
      } : undefined,
      isValid: true,
      rawInputData: data,
    }
  } catch {
    return null
  }
}

/**
 * Check if input data has valid 8021 attribution.
 * 
 * @param inputData - The transaction input data (hex string)
 * @returns true if the data has valid 8021 attribution
 */
export function hasValidAttribution(inputData: string): boolean {
  return parseAttribution(inputData) !== null
}

/**
 * Get a human-readable description of the attribution.
 * 
 * @param attribution - The parsed attribution object
 * @returns A human-readable string describing the attribution
 */
export function getAttributionDescription(attribution: ParsedAttribution): string {
  const codesStr = attribution.codes.join(', ')
  
  if (attribution.schemaId === 0) {
    return `Attributed to: ${codesStr} (canonical registry)`
  } else {
    const registry = attribution.codeRegistry
    return `Attributed to: ${codesStr} (custom registry on chain ${registry?.chainId})`
  }
}

/**
 * Format builder codes for display.
 * 
 * @param codes - Array of builder codes
 * @returns Formatted string of codes
 */
export function formatBuilderCodes(codes: string[]): string {
  if (codes.length === 0) return 'None'
  if (codes.length === 1) return codes[0]
  return codes.join(', ')
}
