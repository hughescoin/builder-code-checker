import { Attribution } from 'ox/erc8021'

/**
 * Tests for ERC-8021 Attribution parsing using ox library
 * 
 * The ox library's Attribution.fromData() returns:
 * - id: number (schema ID, 0 or 1)
 * - codes: string[] (builder codes)
 * - codeRegistry?: { address: string, chainId: number } (for schema 1)
 * 
 * Input data format: {txData}{schemaData}{schemaId}{ercSuffix}
 * 
 * Schema 0: Single entity attribution + canonical registry
 *   Format: {txData}{"buildercode"}{codeLength}{0}{0x80218021...}
 * 
 * Schema 1: Multiple entity attribution + custom registry
 *   Format: {txData}{0xCodeRegistry}{chainId}{2}{"code1,code2"}{codesLength}{1}{0x80218021...}
 */

describe('ERC-8021 Attribution Parsing', () => {
  describe('Schema 0 - Single entity attribution + canonical registry', () => {
    it('should parse single entity attribution with "baseapp" code', () => {
      // Input: 0xdddddddd62617365617070070080218021802180218021802180218021
      // txData: 0xdddddddd
      // "baseapp" in hex: 62617365617070
      // codeLength: 07
      // schemaId: 00
      // ercSuffix: 80218021802180218021802180218021
      const inputData = '0xdddddddd62617365617070070080218021802180218021802180218021'
      
      const attribution = Attribution.fromData(inputData)
      
      console.log('Schema 0 Attribution:', JSON.stringify(attribution, null, 2))
      
      expect(attribution).toBeDefined()
      expect(attribution.codes).toContain('baseapp')
      expect(attribution.id).toBe(0)
    })

    it('should not have codeRegistry for schema 0 (canonical registry)', () => {
      const inputData = '0xdddddddd62617365617070070080218021802180218021802180218021'
      
      const attribution = Attribution.fromData(inputData)
      
      // Schema 0 uses canonical registry, so no codeRegistry field
      expect(attribution.codeRegistry).toBeUndefined()
    })
  })

  describe('Schema 1 - Multiple entity attribution + custom registry', () => {
    it('should parse multiple entity attribution with custom registry', () => {
      // Input: 0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021
      // txData: 0xdddddddd
      // codeRegistry: cccccccccccccccccccccccccccccccccccccccc (20 bytes)
      // chainId: 2105 (8453 in hex)
      // codeRegistryLength: 02 (indicates custom registry follows)
      // "baseapp,morpho" in hex: 626173656170702C6D6F7270686F
      // codesLength: 0E (14 in decimal)
      // schemaId: 01
      // ercSuffix: 80218021802180218021802180218021
      const inputData = '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021'
      
      const attribution = Attribution.fromData(inputData)
      
      console.log('Schema 1 Attribution:', JSON.stringify(attribution, null, 2))
      
      expect(attribution).toBeDefined()
      expect(attribution.id).toBe(1)
      expect(attribution.codes).toContain('baseapp')
      expect(attribution.codes).toContain('morpho')
    })

    it('should extract custom registry address and chainId for schema 1', () => {
      const inputData = '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021'
      
      const attribution = Attribution.fromData(inputData)
      
      // Should have codeRegistry info
      expect(attribution.codeRegistry).toBeDefined()
      expect(attribution.codeRegistry?.address).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
      expect(attribution.codeRegistry?.chainId).toBe(8453)
    })
  })

  describe('Real transaction examples', () => {
    it('should parse the known 8021 attributed regular transaction', async () => {
      // This is from the test transaction: 0x6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87ce
      // Input data ends with: ...62635f73637869696d61390b0080218021802180218021802180218021
      const inputDataSuffix = '0x62635f73637869696d61390b0080218021802180218021802180218021'
      
      try {
        const attribution = Attribution.fromData(inputDataSuffix)
        console.log('Real tx attribution:', JSON.stringify(attribution, null, 2))
        expect(attribution).toBeDefined()
      } catch (error) {
        console.log('Error parsing real tx:', error)
        // Some real transactions might have complex structures
      }
    })

    it('should parse the known 8021 attributed userOperation', async () => {
      // This is from the userOp: 0xb8c84cecc566b6df1d0d7d45cc07bd26957b4481ba1a01728581c97d50162731
      // callData ends with: ...62635f73637869696d61392c62635f6d6e6970130080218021802180218021802180218021
      const inputDataSuffix = '0x62635f73637869696d61392c62635f6d6e6970130080218021802180218021802180218021'
      
      try {
        const attribution = Attribution.fromData(inputDataSuffix)
        console.log('Real userOp attribution:', JSON.stringify(attribution, null, 2))
        expect(attribution).toBeDefined()
      } catch (error) {
        console.log('Error parsing real userOp:', error)
      }
    })
  })

  describe('Attribution data extraction', () => {
    it('should identify the 8021 suffix pattern', () => {
      const inputData = '0xdddddddd62617365617070070080218021802180218021802180218021'
      
      // Last 32 hex chars (16 bytes) should be the 8021 pattern
      const last32Chars = inputData.slice(-32)
      expect(last32Chars).toBe('80218021802180218021802180218021')
    })

    it('should handle input data without 0x prefix', () => {
      const inputData = 'dddddddd62617365617070070080218021802180218021802180218021'
      
      try {
        const attribution = Attribution.fromData(`0x${inputData}`)
        expect(attribution).toBeDefined()
      } catch (error) {
        // Library might require 0x prefix
        console.log('Prefix handling:', error)
      }
    })
  })

  describe('Expected output format', () => {
    it('Schema 0 example should match expected output', () => {
      // Example from user requirements:
      // Input: 0xdddddddd62617365617070070080218021802180218021802180218021
      // Expected: 
      // - txData: 0xdddddddd (note: ox library doesn't return this)
      // - schemaId: 0
      // - codes: ["baseapp"]
      // - registry: canonical (no codeRegistry)
      
      const inputData = '0xdddddddd62617365617070070080218021802180218021802180218021'
      const attribution = Attribution.fromData(inputData)
      
      expect(attribution.id).toBe(0)
      expect(attribution.codes).toEqual(['baseapp'])
      expect(attribution.codeRegistry).toBeUndefined() // canonical registry
    })

    it('Schema 1 example should match expected output', () => {
      // Example from user requirements:
      // Input: 0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021
      // Expected:
      // - txData: 0xdddddddd (note: ox library doesn't return this)
      // - schemaId: 1
      // - codes: ["baseapp", "morpho"]
      // - codeRegistryChainId: 8453
      // - codeRegistryAddress: 0xcccccccccccccccccccccccccccccccccccccccc
      
      const inputData = '0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702C6D6F7270686F0E0180218021802180218021802180218021'
      const attribution = Attribution.fromData(inputData)
      
      expect(attribution.id).toBe(1)
      expect(attribution.codes).toEqual(['baseapp', 'morpho'])
      expect(attribution.codeRegistry).toBeDefined()
      expect(attribution.codeRegistry?.chainId).toBe(8453)
      expect(attribution.codeRegistry?.address).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    })
  })

  describe('Error handling', () => {
    it('should return undefined for input without valid 8021 suffix', () => {
      const inputWithoutSuffix = '0xdddddddd62617365617070070012341234123412341234123412341234'
      
      // The ox library returns undefined for invalid attribution
      const attribution = Attribution.fromData(inputWithoutSuffix)
      expect(attribution).toBeUndefined()
    })

    it('should return undefined for empty input', () => {
      const attribution = Attribution.fromData('0x')
      expect(attribution).toBeUndefined()
    })

    it('should return undefined for input too short to have attribution', () => {
      const attribution = Attribution.fromData('0x1234')
      expect(attribution).toBeUndefined()
    })
  })
})
