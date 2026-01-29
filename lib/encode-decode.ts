import { Attribution } from 'ox/erc8021'

/**
 * Input for encoding attribution data
 */
export interface EncodeInput {
  /** Builder codes (e.g., ["baseapp", "morpho"]) */
  codes: string[]
  /** Optional custom code registry (for schema 1) */
  codeRegistry?: {
    address: string
    chainId: number
  }
}

/**
 * Result of encoding attribution data
 */
export interface EncodeResult {
  success: boolean
  /** The encoded hex suffix (with 0x prefix) */
  suffix?: string
  /** Schema ID that was used (0 or 1) */
  schemaId?: number
  error?: string
}

/**
 * Result of decoding attribution data
 */
export interface DecodeResult {
  success: boolean
  /** Schema ID (0 = canonical registry, 1 = custom registry) */
  schemaId?: number
  /** Builder codes extracted */
  codes?: string[]
  /** Custom code registry (only for schema 1) */
  codeRegistry?: {
    address: string
    chainId: number
  }
  error?: string
}

/**
 * Normalize hex input by ensuring 0x prefix and trimming whitespace.
 * 
 * @param input - User input hex string
 * @returns Normalized hex string with 0x prefix
 */
export function normalizeHexInput(input: string): `0x${string}` {
  const trimmed = input.trim()
  if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
    return ('0x' + trimmed.slice(2)) as `0x${string}`
  }
  return ('0x' + trimmed) as `0x${string}`
}

/**
 * Encode attribution data into a hex suffix.
 * 
 * @param input - Attribution data to encode
 * @returns EncodeResult with the hex suffix
 */
export function encodeAttribution(input: EncodeInput): EncodeResult {
  try {
    // Validate codes
    if (!input.codes || input.codes.length === 0) {
      return {
        success: false,
        error: 'At least one builder code is required',
      }
    }

    // Filter out empty codes
    const codes = input.codes.filter(code => code.trim().length > 0)
    if (codes.length === 0) {
      return {
        success: false,
        error: 'At least one non-empty builder code is required',
      }
    }

    // Build attribution object
    const attribution: {
      codes: string[]
      codeRegistry?: { address: `0x${string}`; chainId: number }
    } = { codes }

    // Add custom registry if provided
    if (input.codeRegistry?.address && input.codeRegistry?.chainId) {
      const address = normalizeHexInput(input.codeRegistry.address)
      attribution.codeRegistry = {
        address,
        chainId: input.codeRegistry.chainId,
      }
    }

    // Encode to suffix
    const suffix = Attribution.toDataSuffix(attribution)

    // Determine schema ID
    const schemaId = attribution.codeRegistry ? 1 : 0

    return {
      success: true,
      suffix,
      schemaId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to encode attribution',
    }
  }
}

/**
 * Decode attribution data from a hex string.
 * 
 * @param hexInput - Hex string to decode (with or without 0x prefix)
 * @returns DecodeResult with the parsed attribution
 */
export function decodeAttribution(hexInput: string): DecodeResult {
  try {
    // Normalize input
    const normalized = normalizeHexInput(hexInput)

    // Validate minimum length
    if (normalized.length < 34) { // 0x + 32 chars for 8021 suffix
      return {
        success: false,
        error: 'Input too short to contain valid attribution',
      }
    }

    // Check for 8021 suffix
    if (!normalized.toLowerCase().endsWith('80218021802180218021802180218021')) {
      return {
        success: false,
        error: 'Input does not end with valid 8021 suffix',
      }
    }

    // Decode using ox library
    const attribution = Attribution.fromData(normalized)

    if (!attribution || attribution.id === undefined) {
      return {
        success: false,
        error: 'Failed to parse attribution data',
      }
    }

    return {
      success: true,
      schemaId: attribution.id,
      codes: [...attribution.codes],
      codeRegistry: attribution.codeRegistry ? {
        address: attribution.codeRegistry.address,
        chainId: attribution.codeRegistry.chainId,
      } : undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode attribution',
    }
  }
}

/**
 * Validate if a string is valid hex.
 * 
 * @param input - String to validate
 * @returns true if valid hex
 */
export function isValidHex(input: string): boolean {
  const trimmed = input.trim()
  const withoutPrefix = trimmed.startsWith('0x') || trimmed.startsWith('0X') 
    ? trimmed.slice(2) 
    : trimmed
  return /^[0-9a-fA-F]*$/.test(withoutPrefix)
}
