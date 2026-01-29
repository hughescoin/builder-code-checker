import { NextRequest, NextResponse } from 'next/server'
import { getRegularTransaction, getUserOperation } from '@/lib/blockchain'
import { validate8021Attribution, isValidTransactionHash } from '@/lib/validator'
import { parseAttribution } from '@/lib/attribution'

/**
 * Attribution verification response for external API consumers
 */
export interface VerifyResponse {
  /** Whether the request was successful */
  success: boolean
  /** Whether the transaction is 8021 attributed */
  attributed: boolean
  /** Attribution details (only present if attributed is true) */
  data?: {
    /** The transaction or userOperation hash */
    hash: string
    /** Whether this is a userOperation (Account Abstraction) */
    isUserOperation: boolean
    /** Schema ID (0 = canonical registry, 1 = custom registry) */
    schemaId: number
    /** Builder codes extracted from the attribution */
    codes: string[]
    /** Custom code registry details (only for schema 1) */
    codeRegistry?: {
      address: string
      chainId: number
    }
    /** The last 16 bytes (8021 suffix) */
    suffix: string
    /** Full input/callData from the transaction */
    inputData: string
  }
  /** Error message (only present if success is false) */
  error?: string
}

/**
 * CORS headers for external API access
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/v1/verify
 * 
 * Verify if a transaction is 8021 attributed.
 * 
 * Request body:
 * {
 *   "hash": "0x...",           // Transaction or userOperation hash (required)
 *   "isUserOperation": false   // Whether this is a userOp (default: false)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "attributed": true,
 *   "data": {
 *     "hash": "0x...",
 *     "isUserOperation": false,
 *     "schemaId": 0,
 *     "codes": ["baseapp"],
 *     "suffix": "80218021802180218021802180218021",
 *     "inputData": "0x..."
 *   }
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  try {
    const body = await request.json()
    const { hash, isUserOperation = false } = body as { 
      hash: string
      isUserOperation?: boolean 
    }

    // Validate required fields
    if (!hash) {
      return NextResponse.json(
        { success: false, attributed: false, error: 'Missing required field: hash' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate hash format
    if (!isValidTransactionHash(hash)) {
      return NextResponse.json(
        { success: false, attributed: false, error: 'Invalid hash format. Expected 0x followed by 64 hex characters.' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch transaction based on type
    const txResult = isUserOperation 
      ? await getUserOperation(hash)
      : await getRegularTransaction(hash)

    if (!txResult.success || !txResult.inputData) {
      const typeLabel = isUserOperation ? 'UserOperation' : 'Transaction'
      return NextResponse.json(
        { success: false, attributed: false, error: txResult.error || `${typeLabel} not found` },
        { status: 404, headers: corsHeaders }
      )
    }

    // Validate 8021 attribution
    const validation = validate8021Attribution(txResult.inputData)

    if (!validation.isAttributed) {
      return NextResponse.json({
        success: true,
        attributed: false,
        error: 'Transaction does not have valid 8021 attribution',
      }, { headers: corsHeaders })
    }

    // Parse attribution details
    const attribution = parseAttribution(txResult.inputData)

    if (!attribution) {
      return NextResponse.json({
        success: true,
        attributed: false,
        error: 'Failed to parse attribution details',
      }, { headers: corsHeaders })
    }

    // Return successful response with all details
    return NextResponse.json({
      success: true,
      attributed: true,
      data: {
        hash,
        isUserOperation,
        schemaId: attribution.schemaId,
        codes: attribution.codes,
        codeRegistry: attribution.codeRegistry,
        suffix: validation.last16Bytes,
        inputData: txResult.inputData,
      },
    }, { headers: corsHeaders })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, attributed: false, error: errorMessage },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * GET /api/v1/verify?hash=0x...&isUserOperation=false
 * 
 * Alternative GET endpoint for simple verification requests.
 */
export async function GET(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  const { searchParams } = new URL(request.url)
  const hash = searchParams.get('hash')
  const isUserOperation = searchParams.get('isUserOperation') === 'true'

  // Validate required fields
  if (!hash) {
    return NextResponse.json(
      { success: false, attributed: false, error: 'Missing required query parameter: hash' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Validate hash format
  if (!isValidTransactionHash(hash)) {
    return NextResponse.json(
      { success: false, attributed: false, error: 'Invalid hash format. Expected 0x followed by 64 hex characters.' },
      { status: 400, headers: corsHeaders }
    )
  }

  // Fetch transaction based on type
  const txResult = isUserOperation 
    ? await getUserOperation(hash)
    : await getRegularTransaction(hash)

  if (!txResult.success || !txResult.inputData) {
    const typeLabel = isUserOperation ? 'UserOperation' : 'Transaction'
    return NextResponse.json(
      { success: false, attributed: false, error: txResult.error || `${typeLabel} not found` },
      { status: 404, headers: corsHeaders }
    )
  }

  // Validate 8021 attribution
  const validation = validate8021Attribution(txResult.inputData)

  if (!validation.isAttributed) {
    return NextResponse.json({
      success: true,
      attributed: false,
      error: 'Transaction does not have valid 8021 attribution',
    }, { headers: corsHeaders })
  }

  // Parse attribution details
  const attribution = parseAttribution(txResult.inputData)

  if (!attribution) {
    return NextResponse.json({
      success: true,
      attributed: false,
      error: 'Failed to parse attribution details',
    }, { headers: corsHeaders })
  }

  // Return successful response with all details
  return NextResponse.json({
    success: true,
    attributed: true,
    data: {
      hash,
      isUserOperation,
      schemaId: attribution.schemaId,
      codes: attribution.codes,
      codeRegistry: attribution.codeRegistry,
      suffix: validation.last16Bytes,
      inputData: txResult.inputData,
    },
  }, { headers: corsHeaders })
}
