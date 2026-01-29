import { NextRequest, NextResponse } from 'next/server'
import { getRegularTransaction, getUserOperation } from '@/lib/blockchain'
import { validate8021Attribution, isValidTransactionHash } from '@/lib/validator'
import { parseAttribution } from '@/lib/attribution'

export interface AttributionDetails {
  schemaId: number
  codes: string[]
  codeRegistry?: {
    address: string
    chainId: number
  }
}

export interface CheckResponse {
  success: boolean
  isAttributed?: boolean
  inputData?: string
  last16Bytes?: string
  expectedPattern?: string
  transactionHash?: string
  isUserOperation?: boolean
  attribution?: AttributionDetails
  error?: string
}

type TransactionType = 'transaction' | 'userOperation'

export async function POST(request: NextRequest): Promise<NextResponse<CheckResponse>> {
  try {
    const body = await request.json()
    const { hash, type = 'transaction' } = body as { hash: string; type?: TransactionType }

    if (!hash) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash is required' },
        { status: 400 }
      )
    }

    // Validate hash format
    if (!isValidTransactionHash(hash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hash format. Expected 0x followed by 64 hex characters.' },
        { status: 400 }
      )
    }

    // Fetch based on selected type
    const txResult = type === 'userOperation' 
      ? await getUserOperation(hash)
      : await getRegularTransaction(hash)

    if (!txResult.success || !txResult.inputData) {
      const typeLabel = type === 'userOperation' ? 'UserOperation' : 'Transaction'
      return NextResponse.json(
        { success: false, error: txResult.error || `${typeLabel} not found` },
        { status: 404 }
      )
    }

    // Validate 8021 attribution
    const validation = validate8021Attribution(txResult.inputData)

    // Parse attribution details if valid
    let attribution: AttributionDetails | undefined
    if (validation.isAttributed) {
      const parsed = parseAttribution(txResult.inputData)
      if (parsed) {
        attribution = {
          schemaId: parsed.schemaId,
          codes: parsed.codes,
          codeRegistry: parsed.codeRegistry,
        }
      }
    }

    return NextResponse.json({
      success: true,
      isAttributed: validation.isAttributed,
      inputData: txResult.inputData,
      last16Bytes: validation.last16Bytes,
      expectedPattern: validation.expectedPattern,
      transactionHash: hash,
      isUserOperation: type === 'userOperation',
      attribution,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
