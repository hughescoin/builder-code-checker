import { createPublicClient, http, type Hash } from 'viem'
import { base } from 'viem/chains'

// Base mainnet RPC (uses env var or falls back to public RPC)
const BASE_RPC_URL = process.env.BASE_RPC_URL

// Bundler RPC for userOperation lookups
const BUNDLER_RPC_URL = process.env.BUNDLER_RPC_URL

/**
 * Public client for Base mainnet using the default public RPC.
 */
export const baseClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
})

export interface TransactionResult {
  success: boolean
  inputData?: string
  from?: string
  to?: string | null
  hash?: string
  isUserOperation?: boolean
  error?: string
}

interface UserOperationResult {
  userOperation?: {
    sender: string
    callData: string
    [key: string]: unknown
  }
  entryPoint?: string
  blockNumber?: string
  transactionHash?: string
}

/**
 * Fetch a regular transaction from the Base blockchain by its hash.
 * 
 * @param hash - The transaction hash (0x-prefixed)
 * @returns TransactionResult with the transaction data or error
 */
export async function getRegularTransaction(hash: string): Promise<TransactionResult> {
  try {
    const transaction = await baseClient.getTransaction({
      hash: hash as Hash,
    })

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found. Make sure this is a valid transaction hash (not a userOperation hash).',
      }
    }

    return {
      success: true,
      inputData: transaction.input,
      from: transaction.from,
      to: transaction.to,
      hash: transaction.hash,
      isUserOperation: false,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Check if it's a "not found" error
    if (errorMessage.includes('could not be found')) {
      return {
        success: false,
        error: 'Transaction not found. Make sure this is a valid transaction hash (not a userOperation hash).',
      }
    }
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Fetch a userOperation by its hash using the bundler RPC.
 * UserOperations are ERC-4337 account abstraction transactions.
 * 
 * @param hash - The userOperation hash (0x-prefixed)
 * @returns TransactionResult with the userOperation data or error
 */
export async function getUserOperation(hash: string): Promise<TransactionResult> {
  try {
    const response = await fetch(BUNDLER_RPC_URL as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationByHash',
        params: [hash],
      }),
    })

    const data = await response.json()
    
    if (data.error || !data.result) {
      return {
        success: false,
        error: 'UserOperation not found. Make sure this is a valid userOperation hash (not a regular transaction hash).',
      }
    }

    const result = data.result as UserOperationResult
    const userOp = result.userOperation

    if (!userOp || !userOp.callData) {
      return {
        success: false,
        error: 'UserOperation found but has no callData.',
      }
    }

    return {
      success: true,
      inputData: userOp.callData,
      from: userOp.sender,
      hash: result.transactionHash || hash,
      isUserOperation: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Failed to fetch userOperation: ${errorMessage}`,
    }
  }
}

/**
 * Fetch transaction receipt to get additional details.
 * Useful for getting the status of the transaction.
 * 
 * @param hash - The transaction hash (0x-prefixed)
 */
export async function getTransactionReceipt(hash: string) {
  try {
    const receipt = await baseClient.getTransactionReceipt({
      hash: hash as Hash,
    })
    return { success: true, receipt }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching receipt'
    return { success: false, error: errorMessage }
  }
}
