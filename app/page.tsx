'use client'

import { useState } from 'react'
import type { CheckResponse } from './api/check/route'
import { encodeAttribution, decodeAttribution, type EncodeResult, type DecodeResult, type SchemaType } from '@/lib/encode-decode'

type TransactionType = 'transaction' | 'userOperation'
type CodecMode = 'encode' | 'decode'

export default function Home() {
  const [hash, setHash] = useState('')
  const [txType, setTxType] = useState<TransactionType>('transaction')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResponse | null>(null)
  const [showFullData, setShowFullData] = useState(false)

  const [codecMode, setCodecMode] = useState<CodecMode>('decode')
  const [selectedSchema, setSelectedSchema] = useState<SchemaType>(0)
  const [builderCodes, setBuilderCodes] = useState('')
  const [appCode, setAppCode] = useState('')
  const [walletCode, setWalletCode] = useState('')
  const [hexInput, setHexInput] = useState('')
  const [registryAddress, setRegistryAddress] = useState('')
  const [registryChainId, setRegistryChainId] = useState('')
  const [encodeResult, setEncodeResult] = useState<EncodeResult | null>(null)
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null)

  const [useAppRegistry, setUseAppRegistry] = useState(false)
  const [appRegistryChainId, setAppRegistryChainId] = useState('')
  const [appRegistryAddress, setAppRegistryAddress] = useState('')
  const [useWalletRegistry, setUseWalletRegistry] = useState(false)
  const [walletRegistryChainId, setWalletRegistryChainId] = useState('')
  const [walletRegistryAddress, setWalletRegistryAddress] = useState('')
  const [metadataFields, setMetadataFields] = useState<Array<{ key: string; value: string }>>([])

  const addMetadataField = () => {
    setMetadataFields([...metadataFields, { key: '', value: '' }])
  }

  const removeMetadataField = (index: number) => {
    setMetadataFields(metadataFields.filter((_, i) => i !== index))
  }

  const updateMetadataField = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...metadataFields]
    updated[index][field] = newValue
    setMetadataFields(updated)
  }

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

  const handleEncode = () => {
    if (selectedSchema === 2) {
      const registries: { app?: { chainId: string; address: string }; wallet?: { chainId: string; address: string } } = {}
      if (useAppRegistry && appRegistryChainId && appRegistryAddress) {
        registries.app = { chainId: appRegistryChainId, address: appRegistryAddress }
      }
      if (useWalletRegistry && walletRegistryChainId && walletRegistryAddress) {
        registries.wallet = { chainId: walletRegistryChainId, address: walletRegistryAddress }
      }


      const metadata: Record<string, string> = {}
      for (const field of metadataFields) {
        if (field.key.trim() && field.value.trim()) {
          metadata[field.key.trim()] = field.value.trim()
        }
      }

      const result = encodeAttribution({
        schemaId: 2,
        appCode: appCode.trim() || undefined,
        walletCode: walletCode.trim() || undefined,
        registries: Object.keys(registries).length > 0 ? registries : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
      setEncodeResult(result)
      setDecodeResult(null)
      return
    }

    const codes = builderCodes
      .split(',')
      .map((code: string) => code.trim())
      .filter((code: string) => code.length > 0)

    const result = encodeAttribution({
      schemaId: selectedSchema as 0 | 1,
      codes,
      codeRegistry: selectedSchema === 1 && registryAddress && registryChainId
        ? {
            address: registryAddress,
            chainId: parseInt(registryChainId, 10),
          }
        : undefined,
    })
    setEncodeResult(result)
    setDecodeResult(null)
  }

  const handleDecode = () => {
    const result = decodeAttribution(hexInput)
    setDecodeResult(result)
    setEncodeResult(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const isSchema2DecodeResult = (r: DecodeResult): r is {
    success: true;
    schemaId: 2;
    appCode?: string;
    walletCode?: string;
    serviceCodes?: string[];
    registries?: { app?: { chainId: string; address: string }; wallet?: { chainId: string; address: string }; service?: { chainId: string; address: string } };
    metadata?: Record<string, unknown>;
  } => {
    return r.success && r.schemaId === 2
  }

  const isSchema01DecodeResult = (r: DecodeResult): r is { success: true; schemaId: 0 | 1; codes?: string[]; codeRegistry?: { address: string; chainId: number } } => {
    return r.success && (r.schemaId === 0 || r.schemaId === 1)
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

                {/* Attribution Details */}
                {result.attribution && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Attribution Details
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Schema ID
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded">
                            {result.attribution.schemaId}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {result.attribution.schemaId === 0 ? '(Canonical Registry)' : '(Custom Registry)'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Builder Codes
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {result.attribution.codes.map((code, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-sm font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {result.attribution.codeRegistry && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Custom Code Registry
                        </h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Chain ID:</span>
                            <span className="text-sm font-mono">{result.attribution.codeRegistry.chainId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Address:</span>
                            <span className="text-xs font-mono break-all">{result.attribution.codeRegistry.address}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Details */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Technical Details
                  </h3>
                  
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last 16 Bytes (32 hex chars)
                    </h4>
                    <div className="code-block text-sm">
                      <code>{result.last16Bytes}</code>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Expected Pattern
                    </h4>
                    <div className="code-block text-sm">
                      <code>{result.expectedPattern}</code>
                    </div>
                  </div>

                  {result.inputData && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Input Data
                        </h4>
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

        {/* Encode/Decode Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Encode / Decode Attribution
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create or decode ERC-8021 attribution suffixes for your transactions.
            </p>
            <ol className="mt-2 ml-4 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-0.5">
              <li>On BaseScan, open the transaction</li>
              <li>Click <span className="font-medium">More Details</span></li>
              <li>Copy the hex code from <span className="font-medium">Input Data</span></li>
            </ol>
          </div>

          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCodecMode('decode')
                  setEncodeResult(null)
                  setDecodeResult(null)
                }}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  codecMode === 'decode'
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Decode
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodecMode('encode')
                  setEncodeResult(null)
                  setDecodeResult(null)
                }}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  codecMode === 'encode'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Encode
              </button>
            </div>
          </div>

          {codecMode === 'encode' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schema
                </label>
                <select
                  value={selectedSchema}
                  onChange={(e) => {
                    setSelectedSchema(parseInt(e.target.value) as SchemaType)
                    setEncodeResult(null)
                  }}
                  className="hash-input"
                >
                  <option value={0}>Schema 0: Canonical Registry</option>
                  <option value={1}>Schema 1: Custom Registry</option>
                  <option value={2}>Schema 2: CBOR Data</option>
                </select>
              </div>

              {selectedSchema !== 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Builder Codes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={builderCodes}
                    onChange={(e) => setBuilderCodes(e.target.value)}
                    placeholder="baseapp, morpho"
                    className="hash-input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter one or more builder codes separated by commas
                  </p>
                </div>
              )}

              {selectedSchema === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <label className="block text-sm font-semibold text-blue-800 dark:text-blue-200">
                      Application (optional)
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Application Code
                      </label>
                      <input
                        type="text"
                        value={appCode}
                        onChange={(e) => setAppCode(e.target.value)}
                        placeholder="baseapp"
                        className="hash-input"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAppRegistry}
                        onChange={(e) => setUseAppRegistry(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Use custom registry for app
                      </span>
                    </label>
                    {useAppRegistry && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Chain ID (hex)
                          </label>
                          <input
                            type="text"
                            value={appRegistryChainId}
                            onChange={(e) => setAppRegistryChainId(e.target.value)}
                            placeholder="0x2105"
                            className="hash-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Registry Address
                          </label>
                          <input
                            type="text"
                            value={appRegistryAddress}
                            onChange={(e) => setAppRegistryAddress(e.target.value)}
                            placeholder="0x..."
                            className="hash-input text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <label className="block text-sm font-semibold text-purple-800 dark:text-purple-200">
                      Wallet (optional)
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Wallet Code
                      </label>
                      <input
                        type="text"
                        value={walletCode}
                        onChange={(e) => setWalletCode(e.target.value)}
                        placeholder="privy"
                        className="hash-input"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWalletRegistry}
                        onChange={(e) => setUseWalletRegistry(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Use custom registry for wallet
                      </span>
                    </label>
                    {useWalletRegistry && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Chain ID (hex)
                          </label>
                          <input
                            type="text"
                            value={walletRegistryChainId}
                            onChange={(e) => setWalletRegistryChainId(e.target.value)}
                            placeholder="0x2105"
                            className="hash-input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Registry Address
                          </label>
                          <input
                            type="text"
                            value={walletRegistryAddress}
                            onChange={(e) => setWalletRegistryAddress(e.target.value)}
                            placeholder="0x..."
                            className="hash-input text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Metadata (optional)
                      </label>
                      <button
                        type="button"
                        onClick={addMetadataField}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        + Add Field
                      </button>
                    </div>
                    {metadataFields.length === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Add custom key-value pairs like utm_campaign, source, etc.
                      </p>
                    )}
                    {metadataFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateMetadataField(index, 'key', e.target.value)}
                          placeholder="key"
                          className="hash-input text-sm flex-1"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateMetadataField(index, 'value', e.target.value)}
                          placeholder="value"
                          className="hash-input text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeMetadataField(index)}
                          className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSchema === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Registry Address
                    </label>
                    <input
                      type="text"
                      value={registryAddress}
                      onChange={(e) => setRegistryAddress(e.target.value)}
                      placeholder="0x..."
                      className="hash-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chain ID
                    </label>
                    <input
                      type="number"
                      value={registryChainId}
                      onChange={(e) => setRegistryChainId(e.target.value)}
                      placeholder="8453"
                      className="hash-input"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleEncode}
                disabled={selectedSchema === 2 ? !appCode.trim() && !walletCode.trim() : !builderCodes.trim()}
                className="btn-primary"
              >
                Encode Attribution
              </button>

              {encodeResult && (
                <div className={`p-4 rounded-lg ${encodeResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  {encodeResult.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Encoded Successfully (Schema {encodeResult.schemaId})
                        </span>
                        <button
                          onClick={() => copyToClipboard(encodeResult.suffix!)}
                          className="text-xs text-green-600 hover:text-green-800 dark:text-green-400"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="code-block text-xs break-all">
                        <code>{encodeResult.suffix}</code>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-800 dark:text-red-200">{encodeResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Decode Mode */}
          {codecMode === 'decode' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hex Data to Decode
                </label>
                <textarea
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  placeholder="0x62617365617070070080218021802180218021802180218021"
                  className="hash-input min-h-[80px] resize-y"
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the hex suffix (with or without 0x prefix)
                </p>
              </div>

              <button
                onClick={handleDecode}
                disabled={!hexInput.trim()}
                className="btn-primary"
              >
                Decode Attribution
              </button>

              {decodeResult && (
                <div className={`p-4 rounded-lg ${decodeResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                  {decodeResult.success ? (
                    <div className="space-y-3">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Decoded Successfully
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Schema ID</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded">
                              {decodeResult.schemaId}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {decodeResult.schemaId === 0 ? '(Canonical)' : decodeResult.schemaId === 1 ? '(Custom Registry)' : '(CBOR Data)'}
                            </span>
                          </div>
                        </div>
                        {isSchema01DecodeResult(decodeResult) && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Builder Codes</span>
                            <div className="flex flex-wrap gap-1">
                              {decodeResult.codes?.map((code: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-sm font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {isSchema2DecodeResult(decodeResult) && (
                          <>
                            {decodeResult.appCode && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Application Code</span>
                                <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-1 text-sm font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                    {decodeResult.appCode}
                                  </span>
                                </div>
                              </div>
                            )}
                            {decodeResult.walletCode && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Wallet Code</span>
                                <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-1 text-sm font-mono bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                                    {decodeResult.walletCode}
                                  </span>
                                </div>
                              </div>
                            )}
                            {decodeResult.serviceCodes && decodeResult.serviceCodes.length > 0 && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Service Code{decodeResult.serviceCodes.length > 1 ? 's' : ''}</span>
                                <div className="flex flex-wrap gap-1">
                                  {decodeResult.serviceCodes.map((code, i) => (
                                    <span key={i} className="px-2 py-1 text-sm font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                      {code}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {isSchema01DecodeResult(decodeResult) && decodeResult.codeRegistry && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Custom Registry</span>
                          <div className="mt-1 space-y-1 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Chain ID: </span>
                              <span className="font-mono">{decodeResult.codeRegistry.chainId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Address: </span>
                              <span className="font-mono text-xs break-all">{decodeResult.codeRegistry.address}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {isSchema2DecodeResult(decodeResult) && decodeResult.registries && (
                        <div className="space-y-2">
                          {decodeResult.registries.app && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">App Custom Registry</span>
                              <div className="mt-1 space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Chain ID: </span>
                                  <span className="font-mono">{decodeResult.registries.app.chainId}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Address: </span>
                                  <span className="font-mono text-xs break-all">{decodeResult.registries.app.address}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {decodeResult.registries.wallet && (
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Wallet Custom Registry</span>
                              <div className="mt-1 space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Chain ID: </span>
                                  <span className="font-mono">{decodeResult.registries.wallet.chainId}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Address: </span>
                                  <span className="font-mono text-xs break-all">{decodeResult.registries.wallet.address}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {decodeResult.registries.service && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <span className="text-xs font-medium text-green-800 dark:text-green-200">Service Custom Registry</span>
                              <div className="mt-1 space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Chain ID: </span>
                                  <span className="font-mono">{decodeResult.registries.service.chainId}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Address: </span>
                                  <span className="font-mono text-xs break-all">{decodeResult.registries.service.address}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {isSchema2DecodeResult(decodeResult) && decodeResult.metadata && Object.keys(decodeResult.metadata).length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Metadata</span>
                          <div className="mt-2 space-y-1">
                            {Object.entries(decodeResult.metadata).map(([key, value]) => (
                              <div key={key} className="flex gap-2 text-sm">
                                <span className="font-mono text-gray-600 dark:text-gray-400">{key}:</span>
                                <span className="font-mono text-gray-800 dark:text-gray-200">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-red-800 dark:text-red-200">{decodeResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
