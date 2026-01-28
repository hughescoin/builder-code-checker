import {
  validate8021Attribution,
  is8021Attributed,
  isValidTransactionHash,
  PATTERN_8021,
} from '@/lib/validator'

describe('8021 Validator', () => {
  describe('validate8021Attribution', () => {
    it('should return true for input data ending with 8021 pattern', () => {
      const inputData = '0x1234567890abcdef80218021802180218021802180218021'
      const result = validate8021Attribution(inputData)
      
      expect(result.isAttributed).toBe(true)
      expect(result.last16Bytes).toBe(PATTERN_8021.toLowerCase())
    })

    it('should return false for input data not ending with 8021 pattern', () => {
      const inputData = '0x1234567890abcdef1234567890abcdef1234567890abcdef'
      const result = validate8021Attribution(inputData)
      
      expect(result.isAttributed).toBe(false)
      expect(result.last16Bytes).not.toBe(PATTERN_8021.toLowerCase())
    })

    it('should handle input data without 0x prefix', () => {
      const inputData = '1234567890abcdef80218021802180218021802180218021'
      const result = validate8021Attribution(inputData)
      
      expect(result.isAttributed).toBe(true)
    })

    it('should be case-insensitive', () => {
      const inputDataUpper = '0x1234567890ABCDEF80218021802180218021802180218021'
      const inputDataLower = '0x1234567890abcdef80218021802180218021802180218021'
      
      const resultUpper = validate8021Attribution(inputDataUpper)
      const resultLower = validate8021Attribution(inputDataLower)
      
      expect(resultUpper.isAttributed).toBe(true)
      expect(resultLower.isAttributed).toBe(true)
    })

    it('should return correct inputDataLength in bytes', () => {
      // 10 hex chars = 5 bytes (without 0x prefix)
      const inputData = '0x1234567890'
      const result = validate8021Attribution(inputData)
      
      expect(result.inputDataLength).toBe(5)
    })
  })

  describe('is8021Attributed', () => {
    it('should return true for attributed input data', () => {
      const inputData = '0x80218021802180218021802180218021'
      expect(is8021Attributed(inputData)).toBe(true)
    })

    it('should return false for non-attributed input data', () => {
      const inputData = '0x1234567890abcdef1234567890abcdef'
      expect(is8021Attributed(inputData)).toBe(false)
    })
  })

  describe('isValidTransactionHash', () => {
    it('should return true for valid transaction hash', () => {
      const hash = '0x6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87ce'
      expect(isValidTransactionHash(hash)).toBe(true)
    })

    it('should return false for hash without 0x prefix', () => {
      const hash = '6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87ce'
      expect(isValidTransactionHash(hash)).toBe(false)
    })

    it('should return false for hash with wrong length', () => {
      const shortHash = '0x6e864ef690b0a96b'
      const longHash = '0x6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87ce1234'
      
      expect(isValidTransactionHash(shortHash)).toBe(false)
      expect(isValidTransactionHash(longHash)).toBe(false)
    })

    it('should return false for hash with invalid characters', () => {
      const hash = '0x6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87zz'
      expect(isValidTransactionHash(hash)).toBe(false)
    })
  })
})
