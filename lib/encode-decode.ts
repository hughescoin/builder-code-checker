import { Attribution } from 'ox/erc8021'
import { encode as cborEncode, decode as cborDecode } from 'cbor-x'

/** Schema type for encoding/decoding */
export type SchemaType = 0 | 1 | 2

/**
 * Input for encoding attribution data (Schema 0 or 1)
 */
export interface EncodeInputSchema01 {
  /** Schema ID (0 = canonical, 1 = custom registry) */
  schemaId: 0 | 1
  /** Builder codes (e.g., ["baseapp", "morpho"]) */
  codes: string[]
  /** Optional custom code registry (for schema 1) */
  codeRegistry?: {
    address: string
    chainId: number
  }
}

export interface Schema2Registry {
  chainId: string
  address: string
}

export interface EncodeInputSchema2 {
  schemaId: 2
  appCode?: string
  walletCode?: string
  serviceCode?: string
  registries?: {
    app?: Schema2Registry
    wallet?: Schema2Registry
    service?: Schema2Registry
  }
  metadata?: Record<string, string>
}

/**
 * Union type for encode input supporting all schemas
 */
export type EncodeInput = EncodeInputSchema01 | EncodeInputSchema2 | {
  /** Legacy format without schemaId - defaults to schema 0 or 1 based on codeRegistry presence */
  codes: string[]
  codeRegistry?: {
    address: string
    chainId: number
  }
}

export interface EncodeResult {
  success: boolean
  suffix?: string
  schemaId?: SchemaType
  error?: string
}

export interface DecodeResultBase {
  success: boolean
  schemaId?: SchemaType
  error?: string
}

export interface DecodeResultSchema01 extends DecodeResultBase {
  schemaId?: 0 | 1
  codes?: string[]
  codeRegistry?: {
    address: string
    chainId: number
  }
}

export interface DecodeResultSchema2 extends DecodeResultBase {
  schemaId?: 2
  appCode?: string
  walletCode?: string
  serviceCodes?: string[]
  registries?: {
    app?: Schema2Registry
    wallet?: Schema2Registry
    service?: Schema2Registry
  }
  metadata?: Record<string, unknown>
}

export type DecodeResult = DecodeResultSchema01 | DecodeResultSchema2 | { success: false; error: string }

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

const ERC_SUFFIX = '80218021802180218021802180218021'
const SCHEMA_2_ID = 0x02

function isSchema2Input(input: EncodeInput): input is EncodeInputSchema2 {
  return 'schemaId' in input && input.schemaId === 2
}

function hasCodesProperty(input: EncodeInput): input is EncodeInputSchema01 | { codes: string[]; codeRegistry?: { address: string; chainId: number } } {
  return 'codes' in input
}

interface Schema2CborMap {
  a?: string
  w?: string
  s?: string[]
  r?: {
    a?: { c: string; a: string }
    w?: { c: string; a: string }
    s?: { c: string; a: string }
  }
  m?: Record<string, string>
}

function encodeSchema2(input: EncodeInputSchema2): string {
  const cborMap: Schema2CborMap = {}
  
  if (input.appCode?.trim()) {
    cborMap.a = input.appCode.trim()
  }
  if (input.walletCode?.trim()) {
    cborMap.w = input.walletCode.trim()
  }
  if (input.serviceCode?.trim()) {
    cborMap.s = [input.serviceCode.trim()]
  }

  if (!cborMap.a && !cborMap.w && !cborMap.s?.length) {
    throw new Error('At least one code (app, wallet, or service) is required')
  }
  
  if (input.registries?.app || input.registries?.wallet) {
    cborMap.r = {}
    if (input.registries.app?.chainId && input.registries.app?.address) {
      cborMap.r.a = {
        c: input.registries.app.chainId,
        a: input.registries.app.address,
      }
    }
    if (input.registries.wallet?.chainId && input.registries.wallet?.address) {
      cborMap.r.w = {
        c: input.registries.wallet.chainId,
        a: input.registries.wallet.address,
      }
    }
    if (input.registries.service?.chainId && input.registries.service?.address) {
      cborMap.r.s = {
        c: input.registries.service.chainId,
        a: input.registries.service.address,
      }
    }
  }
  
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    const filteredMetadata: Record<string, string> = {}
    for (const [key, value] of Object.entries(input.metadata)) {
      if (key.trim() && value.trim()) {
        filteredMetadata[key.trim()] = value.trim()
      }
    }
    if (Object.keys(filteredMetadata).length > 0) {
      cborMap.m = filteredMetadata
    }
  }
  
  const cborData = cborEncode(cborMap)
  const cborLength = cborData.length
  
  const lengthHex = cborLength.toString(16).padStart(4, '0')
  const schemaIdHex = SCHEMA_2_ID.toString(16).padStart(2, '0')
  const cborHex = Buffer.from(cborData).toString('hex')
  
  return '0x' + cborHex + lengthHex + schemaIdHex + ERC_SUFFIX
}

export function encodeAttribution(input: EncodeInput): EncodeResult {
  try {
    if (isSchema2Input(input)) {
      const suffix = encodeSchema2(input)
      return { success: true, suffix, schemaId: 2 }
    }

    if (!hasCodesProperty(input)) {
      return { success: false, error: 'Invalid input format' }
    }

    if (!input.codes || input.codes.length === 0) {
      return { success: false, error: 'At least one builder code is required' }
    }

    const codes = input.codes.filter((code: string) => code.trim().length > 0)
    if (codes.length === 0) {
      return { success: false, error: 'At least one non-empty builder code is required' }
    }

    const attribution: {
      codes: string[]
      codeRegistry?: { address: `0x${string}`; chainId: number }
    } = { codes }

    if (input.codeRegistry?.address && input.codeRegistry?.chainId) {
      const address = normalizeHexInput(input.codeRegistry.address)
      attribution.codeRegistry = { address, chainId: input.codeRegistry.chainId }
    }

    const suffix = Attribution.toDataSuffix(attribution)
    const schemaId: SchemaType = attribution.codeRegistry ? 1 : 0

    return { success: true, suffix, schemaId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to encode attribution',
    }
  }
}

interface DecodedSchema2Cbor {
  a?: string
  w?: string
  s?: string[]
  r?: {
    a?: { c: string; a: string }
    w?: { c: string; a: string }
    s?: { c: string; a: string }
  }
  m?: Record<string, unknown>
}

function decodeSchema2(hexData: string): DecodeResultSchema2 {
  const ERC_SUFFIX_LENGTH = 32
  const SCHEMA_ID_LENGTH = 2
  const CBOR_LENGTH_FIELD_SIZE = 4
  
  const rawHex = hexData.startsWith('0x') ? hexData.slice(2) : hexData
  const dataBeforeSuffix = rawHex.slice(0, -ERC_SUFFIX_LENGTH)
  const schemaIdByte = dataBeforeSuffix.slice(-SCHEMA_ID_LENGTH)
  
  if (parseInt(schemaIdByte, 16) !== SCHEMA_2_ID) {
    throw new Error('Not a Schema 2 encoding')
  }
  
  const dataBeforeSchemaId = dataBeforeSuffix.slice(0, -SCHEMA_ID_LENGTH)
  const cborLengthHex = dataBeforeSchemaId.slice(-CBOR_LENGTH_FIELD_SIZE)
  const cborByteLength = parseInt(cborLengthHex, 16)
  const cborHexLength = cborByteLength * 2
  const cborHex = dataBeforeSchemaId.slice(-CBOR_LENGTH_FIELD_SIZE - cborHexLength, -CBOR_LENGTH_FIELD_SIZE)
  
  const cborBytes = Buffer.from(cborHex, 'hex')
  const decoded = cborDecode(cborBytes) as DecodedSchema2Cbor
  
  const result: DecodeResultSchema2 = {
    success: true,
    schemaId: 2,
    appCode: typeof decoded.a === 'string' ? decoded.a : undefined,
    walletCode: typeof decoded.w === 'string' ? decoded.w : undefined,
    serviceCodes: Array.isArray(decoded.s) && decoded.s.length > 0 ? decoded.s : undefined,
  }
  
  if (decoded.r) {
    result.registries = {}
    if (decoded.r.a?.c && decoded.r.a?.a) {
      result.registries.app = {
        chainId: decoded.r.a.c,
        address: decoded.r.a.a,
      }
    }
    if (decoded.r.w?.c && decoded.r.w?.a) {
      result.registries.wallet = {
        chainId: decoded.r.w.c,
        address: decoded.r.w.a,
      }
    }
    if (decoded.r.s?.c && decoded.r.s?.a) {
      result.registries.service = {
        chainId: decoded.r.s.c,
        address: decoded.r.s.a,
      }
    }
  }
  
  if (decoded.m && typeof decoded.m === 'object') {
    result.metadata = decoded.m
  }
  
  return result
}

function getSchemaIdFromHex(hexData: string): number {
  const withoutPrefix = hexData.startsWith('0x') ? hexData.slice(2) : hexData
  const withoutSuffix = withoutPrefix.slice(0, -32)
  const schemaIdHex = withoutSuffix.slice(-2)
  return parseInt(schemaIdHex, 16)
}

const MIN_ATTRIBUTION_LENGTH = 36

export function decodeAttribution(hexInput: string): DecodeResult {
  try {
    const normalized = normalizeHexInput(hexInput)

    if (normalized.length < MIN_ATTRIBUTION_LENGTH) {
      return { success: false, error: 'Input too short to contain valid attribution' }
    }

    if (!normalized.toLowerCase().endsWith(ERC_SUFFIX.toLowerCase())) {
      return { success: false, error: 'Input does not end with valid 8021 suffix' }
    }

    const schemaId = getSchemaIdFromHex(normalized)
    
    if (schemaId === 2) {
      return decodeSchema2(normalized)
    }

    const attribution = Attribution.fromData(normalized)

    if (!attribution || attribution.id === undefined) {
      return { success: false, error: 'Failed to parse attribution data' }
    }

    return {
      success: true,
      schemaId: attribution.id as 0 | 1,
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
