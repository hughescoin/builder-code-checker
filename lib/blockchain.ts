import { createPublicClient, http, type Hash } from 'viem'
import { base } from 'viem/chains'

/**
 * Public client for Base mainnet using the default public RPC.
 */
export const baseClient = createPublicClient({
  chain: base,
  transport: http(),
})

export interface TransactionResult {
  success: boolean
  inputData?: string
  from?: string
  to?: string | null
  hash?: string
  error?: string
}

/**
 * Fetch a transaction from the Base blockchain by its hash.
 * 
 * @param hash - The transaction hash (0x-prefixed)
 * @returns TransactionResult with the transaction data or error
 */
export async function getTransaction(hash: string): Promise<TransactionResult> {
  try {
    const transaction = await baseClient.getTransaction({
      hash: hash as Hash,
    })

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found',
      }
    }

    return {
      success: true,
      inputData: transaction.input,
      from: transaction.from,
      to: transaction.to,
      hash: transaction.hash,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching transaction'
    return {
      success: false,
      error: errorMessage,
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
