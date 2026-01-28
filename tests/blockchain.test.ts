import { getRegularTransaction, getUserOperation } from '@/lib/blockchain'
import { validate8021Attribution } from '@/lib/validator'

// Known test transactions on Base mainnet
const TEST_CASES = {
  // Regular EOA transaction that IS 8021 attributed
  regularAttributed: {
    hash: '0x6e864ef690b0a96b476ae2510e4f607ac7b867d8d73435367c32cd501adf87ce',
    expectedAttributed: true,
    description: 'Regular EOA transaction with 8021 attribution',
  },
  
  // UserOperation (Account Abstraction) that IS 8021 attributed
  userOpAttributed: {
    hash: '0xb8c84cecc566b6df1d0d7d45cc07bd26957b4481ba1a01728581c97d50162731',
    expectedAttributed: true,
    description: 'UserOperation with 8021 attribution',
  },
}

describe('Blockchain Integration', () => {
  describe('getRegularTransaction', () => {
    it('should fetch a regular EOA transaction successfully', async () => {
      const { hash } = TEST_CASES.regularAttributed
      const result = await getRegularTransaction(hash)
      
      expect(result.success).toBe(true)
      expect(result.inputData).toBeDefined()
      expect(result.isUserOperation).toBe(false)
      expect(result.from).toBeDefined()
      expect(result.hash).toBe(hash)
    })

    it('should return 8021 attributed for known attributed transaction', async () => {
      const { hash, expectedAttributed } = TEST_CASES.regularAttributed
      const result = await getRegularTransaction(hash)
      
      expect(result.success).toBe(true)
      expect(result.inputData).toBeDefined()
      
      const validation = validate8021Attribution(result.inputData!)
      expect(validation.isAttributed).toBe(expectedAttributed)
    })

    it('should fail gracefully for userOperation hash when queried as regular transaction', async () => {
      const { hash } = TEST_CASES.userOpAttributed
      const result = await getRegularTransaction(hash)
      
      // UserOperation hashes won't be found as regular transactions
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail gracefully for non-existent transaction', async () => {
      const fakeHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
      const result = await getRegularTransaction(fakeHash)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getUserOperation', () => {
    it('should fetch a userOperation successfully', async () => {
      const { hash } = TEST_CASES.userOpAttributed
      const result = await getUserOperation(hash)
      
      expect(result.success).toBe(true)
      expect(result.inputData).toBeDefined()
      expect(result.isUserOperation).toBe(true)
      expect(result.from).toBeDefined() // sender address
    })

    it('should return 8021 attributed for known attributed userOperation', async () => {
      const { hash, expectedAttributed } = TEST_CASES.userOpAttributed
      const result = await getUserOperation(hash)
      
      expect(result.success).toBe(true)
      expect(result.inputData).toBeDefined()
      
      const validation = validate8021Attribution(result.inputData!)
      expect(validation.isAttributed).toBe(expectedAttributed)
    })

    it('should fail gracefully for regular transaction hash when queried as userOperation', async () => {
      const { hash } = TEST_CASES.regularAttributed
      const result = await getUserOperation(hash)
      
      // Regular transaction hashes won't be found as userOperations
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail gracefully for non-existent userOperation', async () => {
      const fakeHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
      const result = await getUserOperation(fakeHash)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('8021 Attribution Validation', () => {
    it('should correctly validate regular transaction attribution', async () => {
      const { hash, expectedAttributed, description } = TEST_CASES.regularAttributed
      const result = await getRegularTransaction(hash)
      
      expect(result.success).toBe(true)
      
      const validation = validate8021Attribution(result.inputData!)
      expect(validation.isAttributed).toBe(expectedAttributed)
      
      // Log for debugging
      console.log(`\n${description}:`)
      console.log(`  Hash: ${hash}`)
      console.log(`  Last 16 bytes: ${validation.last16Bytes}`)
      console.log(`  Expected: ${validation.expectedPattern}`)
      console.log(`  Attributed: ${validation.isAttributed}`)
    })

    it('should correctly validate userOperation attribution', async () => {
      const { hash, expectedAttributed, description } = TEST_CASES.userOpAttributed
      const result = await getUserOperation(hash)
      
      expect(result.success).toBe(true)
      
      const validation = validate8021Attribution(result.inputData!)
      expect(validation.isAttributed).toBe(expectedAttributed)
      
      // Log for debugging
      console.log(`\n${description}:`)
      console.log(`  Hash: ${hash}`)
      console.log(`  Last 16 bytes: ${validation.last16Bytes}`)
      console.log(`  Expected: ${validation.expectedPattern}`)
      console.log(`  Attributed: ${validation.isAttributed}`)
    })
  })
})
