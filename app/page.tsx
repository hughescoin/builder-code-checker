'use client'

import { useState } from 'react'
import type { CheckResponse } from './api/check/route'

type TransactionType = 'transaction' | 'userOperation'

export default function Home() {
  const [hash, setHash] = useState('')
  const [txType, setTxType] = useState<TransactionType>('transaction')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResponse | null>(null)
  const [showFullData, setShowFullData] = useState(false)

  const checkTransaction = async () => {
    if (!hash.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hash.trim(), type: txType }),
      })

      const data: CheckResponse = await response.json()
      setResult(data)
    } catch {
      setResult({ success: false, error: 'Failed to check transaction' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      checkTransaction()
    }
  }

  const truncateData = (data: string, maxLength: number = 100) => {
    if (data.length <= maxLength) return data
    return `${data.slice(0, 50)}...${data.slice(-50)}`
  }

  const highlightLast32Chars = (data: string) => {
    if (data.length < 32) return data
    const prefix = data.slice(0, -32)
    const suffix = data.slice(-32)
    return (
      <>
        {prefix}
        <span className="highlight-8021">{suffix}</span>
      </>
    )
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            8021 Attribution Checker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verify if a Base transaction is 8021 attributed
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          {/* Transaction Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTxType('transaction')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  txType === 'transaction'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Transaction
              </button>
              <button
                type="button"
                onClick={() => setTxType('userOperation')}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  txType === 'userOperation'
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                UserOperation (AA)
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="hash"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {txType === 'transaction' ? 'Transaction Hash' : 'UserOperation Hash'}
            </label>
            <input
              id="hash"
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0x..."
              className="hash-input"
              disabled={loading}
            />
          </div>

          <button
            onClick={checkTransaction}
            disabled={loading || !hash.trim()}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Checking...
              </span>
            ) : (
              'Check Attribution'
            )}
          </button>
        </div>

        {/* Result Section */}
        {result && (
          <div
            className={`result-card ${
              result.success && result.isAttributed
                ? 'result-success'
                : 'result-fail'
            }`}
          >
            {result.success ? (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className="flex items-center gap-3">
                  {result.isAttributed ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                            8021 Attributed
                          </h2>
                          {result.isUserOperation && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                              UserOp
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          This {result.isUserOperation ? 'userOperation' : 'transaction'} is correctly 8021 attributed
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                            Not 8021 Attributed
                          </h2>
                          {result.isUserOperation && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                              UserOp
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          This {result.isUserOperation ? 'userOperation' : 'transaction'} does not have valid 8021 attribution
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last 16 Bytes (32 hex chars)
                    </h3>
                    <div className="code-block text-sm">
                      <code>{result.last16Bytes}</code>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected Pattern
                    </h3>
                    <div className="code-block text-sm">
                      <code>{result.expectedPattern}</code>
                    </div>
                  </div>

                  {result.inputData && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Input Data
                        </h3>
                        <button
                          onClick={() => setShowFullData(!showFullData)}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {showFullData ? 'Show Less' : 'Show Full'}
                        </button>
                      </div>
                      <div className="code-block text-xs">
                        <code>
                          {showFullData
                            ? highlightLast32Chars(result.inputData)
                            : truncateData(result.inputData)}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                      Error
                    </h2>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {result.error}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Tip:</strong> Make sure you selected the correct transaction type above.
                    Use &quot;Transaction&quot; for regular blockchain transactions, or &quot;UserOperation (AA)&quot; 
                    for Account Abstraction / Smart Wallet transactions.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            What is 8021 Attribution?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A transaction is considered &quot;8021 attributed&quot; when the last 16 bytes
            (32 hex characters) of its input data match the pattern{' '}
            <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded font-mono">
              8021
            </code>{' '}
            repeated 8 times.
          </p>
          <div className="code-block text-sm">
            80218021802180218021802180218021
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This checker validates Base blockchain transactions against this
            pattern.{' '}
            <a
              href="https://eip.tools/eip/8021"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Learn more about ERC-8021
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
