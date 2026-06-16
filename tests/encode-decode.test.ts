import { Attribution } from 'ox/erc8021'
import { 
  encodeAttribution, 
  decodeAttribution, 
  normalizeHexInput, 
  isValidHex 
} from '@/lib/encode-decode'

/**
 * Tests for ERC-8021 Attribution Encoding and Decoding
 * 
 * Encode: Convert attribution object to hex suffix
 * Decode: Convert hex suffix back to attribution object
 */

describe('ERC-8021 Attribution Encode/Decode', () => {
  describe('Encoding - toDataSuffix', () => {
    it('should encode a single builder code with schema 0 (canonical registry)', () => {
      const attribution = {
        codes: ['baseapp'],
      }
      
      const suffix = Attribution.toDataSuffix(attribution)
      
      console.log('Encoded single code:', suffix)
      
      expect(suffix).toBeDefined()
      expect(suffix.startsWith('0x')).toBe(true)
      // Should end with the 8021 pattern
      expect(suffix.endsWith('80218021802180218021802180218021')).toBe(true)
    })

    it('should encode multiple builder codes with schema 0', () => {
      const attribution = {
        codes: ['baseapp', 'morpho'],
      }
      
      const suffix = Attribution.toDataSuffix(attribution)
      
      console.log('Encoded multiple codes:', suffix)
      
      expect(suffix).toBeDefined()
      expect(suffix.startsWith('0x')).toBe(true)
      expect(suffix.endsWith('80218021802180218021802180218021')).toBe(true)
    })

    it('should encode with custom registry (schema 1)', () => {
      const attribution = {
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xcccccccccccccccccccccccccccccccccccccccc' as `0x${string}`,
          chainId: 8453,
        },
      }
      
      const suffix = Attribution.toDataSuffix(attribution)
      
      console.log('Encoded with custom registry:', suffix)
      
      expect(suffix).toBeDefined()
      expect(suffix.startsWith('0x')).toBe(true)
      expect(suffix.endsWith('80218021802180218021802180218021')).toBe(true)
    })
  })

  describe('Decoding - fromData', () => {
    it('should decode a single builder code from hex data', () => {
      // First encode, then decode
      const original = { codes: ['baseapp'] }
      const suffix = Attribution.toDataSuffix(original)
      
      const decoded = Attribution.fromData(suffix)
      
      console.log('Decoded single code:', decoded)
      
      expect(decoded).toBeDefined()
      expect(decoded?.codes).toContain('baseapp')
      expect(decoded?.id).toBe(0)
    })

    it('should decode multiple builder codes from hex data', () => {
      const original = { codes: ['baseapp', 'morpho'] }
      const suffix = Attribution.toDataSuffix(original)
      
      const decoded = Attribution.fromData(suffix)
      
      console.log('Decoded multiple codes:', decoded)
      
      expect(decoded).toBeDefined()
      expect(decoded?.codes).toContain('baseapp')
      expect(decoded?.codes).toContain('morpho')
    })

    it('should decode custom registry attribution', () => {
      const original = {
        codes: ['baseapp', 'morpho'],
        codeRegistry: {
          address: '0xcccccccccccccccccccccccccccccccccccccccc' as `0x${string}`,
          chainId: 8453,
        },
      }
      const suffix = Attribution.toDataSuffix(original)
      
      const decoded = Attribution.fromData(suffix)
      
      console.log('Decoded custom registry:', decoded)
      
      expect(decoded).toBeDefined()
      expect(decoded?.id).toBe(1)
      expect(decoded?.codes).toContain('baseapp')
      expect(decoded?.codes).toContain('morpho')
      expect(decoded?.codeRegistry?.chainId).toBe(8453)
    })
  })

  describe('Round-trip encoding/decoding', () => {
    it('should round-trip single code attribution', () => {
      const original = { codes: ['myapp'] }
      const suffix = Attribution.toDataSuffix(original)
      const decoded = Attribution.fromData(suffix)
      
      expect(decoded?.codes).toEqual(['myapp'])
    })

    it('should round-trip multiple codes attribution', () => {
      const original = { codes: ['app1', 'app2', 'app3'] }
      const suffix = Attribution.toDataSuffix(original)
      const decoded = Attribution.fromData(suffix)
      
      expect(decoded?.codes).toEqual(['app1', 'app2', 'app3'])
    })

    it('should round-trip with custom registry', () => {
      const original = {
        codes: ['myapp'],
        codeRegistry: {
          address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          chainId: 1,
        },
      }
      const suffix = Attribution.toDataSuffix(original)
      const decoded = Attribution.fromData(suffix)
      
      expect(decoded?.codes).toEqual(['myapp'])
      expect(decoded?.codeRegistry?.chainId).toBe(1)
      expect(decoded?.codeRegistry?.address).toBe('0x1234567890123456789012345678901234567890')
    })
  })

  describe('Input handling - without 0x prefix', () => {
    it('should handle encoded suffix without 0x prefix when decoding', () => {
      const original = { codes: ['baseapp'] }
      const suffixWith0x = Attribution.toDataSuffix(original)
      const suffixWithout0x = suffixWith0x.slice(2) // Remove 0x
      
      // Add 0x back before decoding
      const decoded = Attribution.fromData(`0x${suffixWithout0x}` as `0x${string}`)
      
      expect(decoded).toBeDefined()
      expect(decoded?.codes).toContain('baseapp')
    })

    it('should handle user input with extra spaces', () => {
      const original = { codes: ['baseapp'] }
      const suffix = Attribution.toDataSuffix(original)
      const trimmedSuffix = suffix.trim()
      
      const decoded = Attribution.fromData(trimmedSuffix as `0x${string}`)
      
      expect(decoded).toBeDefined()
      expect(decoded?.codes).toContain('baseapp')
    })

    it('should handle lowercase hex input', () => {
      const original = { codes: ['baseapp'] }
      const suffix = Attribution.toDataSuffix(original)
      const lowercaseSuffix = suffix.toLowerCase() as `0x${string}`
      
      const decoded = Attribution.fromData(lowercaseSuffix)
      
      expect(decoded).toBeDefined()
      expect(decoded?.codes).toContain('baseapp')
    })

    it('should handle uppercase hex input', () => {
      const original = { codes: ['baseapp'] }
      const suffix = Attribution.toDataSuffix(original)
      const uppercaseSuffix = suffix.toUpperCase() as `0x${string}`
      // Fix the 0x prefix case
      const fixedSuffix = ('0x' + uppercaseSuffix.slice(2)) as `0x${string}`
      
      const decoded = Attribution.fromData(fixedSuffix)
      
      expect(decoded).toBeDefined()
      expect(decoded?.codes).toContain('baseapp')
    })
  })

  describe('Error handling', () => {
    it('should return undefined for invalid hex data', () => {
      const decoded = Attribution.fromData('0xinvalidhex' as `0x${string}`)
      expect(decoded).toBeUndefined()
    })

    it('should return undefined for data without 8021 suffix', () => {
      const decoded = Attribution.fromData('0x1234567890abcdef' as `0x${string}`)
      expect(decoded).toBeUndefined()
    })

    it('should return undefined for empty data', () => {
      const decoded = Attribution.fromData('0x' as `0x${string}`)
      expect(decoded).toBeUndefined()
    })
  })

  describe('Builder code validation', () => {
    it('should encode codes with underscores', () => {
      const attribution = { codes: ['my_app_code'] }
      const suffix = Attribution.toDataSuffix(attribution)
      const decoded = Attribution.fromData(suffix)
      
      expect(decoded?.codes).toContain('my_app_code')
    })

    it('should encode codes with numbers', () => {
      const attribution = { codes: ['app123'] }
      const suffix = Attribution.toDataSuffix(attribution)
      const decoded = Attribution.fromData(suffix)
      
      expect(decoded?.codes).toContain('app123')
    })

    it('should encode alphanumeric codes', () => {
      const attribution = { codes: ['bc_scxiima9'] }
      const suffix = Attribution.toDataSuffix(attribution)
      const decoded = Attribution.fromData(suffix)
      
      expect(decoded?.codes).toContain('bc_scxiima9')
    })
  })
})

/**
 * Tests for the helper module (lib/encode-decode.ts)
 */
describe('Helper Module - encodeAttribution & decodeAttribution', () => {
  describe('encodeAttribution', () => {
    it('should encode single builder code', () => {
      const result = encodeAttribution({ codes: ['baseapp'] })
      
      expect(result.success).toBe(true)
      expect(result.suffix).toBeDefined()
      expect(result.suffix?.startsWith('0x')).toBe(true)
      expect(result.suffix?.endsWith('80218021802180218021802180218021')).toBe(true)
      expect(result.schemaId).toBe(0)
    })

    it('should encode multiple builder codes', () => {
      const result = encodeAttribution({ codes: ['app1', 'app2'] })
      
      expect(result.success).toBe(true)
      expect(result.schemaId).toBe(0)
    })

    it('should encode with custom registry (schema 1)', () => {
      const result = encodeAttribution({
        codes: ['myapp'],
        codeRegistry: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: 8453,
        },
      })
      
      expect(result.success).toBe(true)
      expect(result.schemaId).toBe(1)
    })

    it('should fail with empty codes array', () => {
      const result = encodeAttribution({ codes: [] })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail with only whitespace codes', () => {
      const result = encodeAttribution({ codes: ['   ', ''] })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('decodeAttribution', () => {
    it('should decode valid attribution hex', () => {
      const encoded = encodeAttribution({ codes: ['baseapp'] })
      const result = decodeAttribution(encoded.suffix!)
      
      expect(result.success).toBe(true)
      if (result.success && (result.schemaId === 0 || result.schemaId === 1)) {
        expect(result.codes).toContain('baseapp')
        expect(result.schemaId).toBe(0)
      }
    })

    it('should decode hex without 0x prefix', () => {
      const encoded = encodeAttribution({ codes: ['baseapp'] })
      const hexWithout0x = encoded.suffix!.slice(2)
      const result = decodeAttribution(hexWithout0x)
      
      expect(result.success).toBe(true)
      if (result.success && (result.schemaId === 0 || result.schemaId === 1)) {
        expect(result.codes).toContain('baseapp')
      }
    })

    it('should decode hex with extra whitespace', () => {
      const encoded = encodeAttribution({ codes: ['baseapp'] })
      const result = decodeAttribution('  ' + encoded.suffix! + '  ')
      
      expect(result.success).toBe(true)
      if (result.success && (result.schemaId === 0 || result.schemaId === 1)) {
        expect(result.codes).toContain('baseapp')
      }
    })

    it('should fail for data without 8021 suffix', () => {
      const result = decodeAttribution('0x1234567890abcdef1234567890abcdef1234567890abcdef')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('8021 suffix')
    })

    it('should fail for input too short', () => {
      const result = decodeAttribution('0x1234')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('too short')
    })
  })

  describe('normalizeHexInput', () => {
    it('should add 0x prefix if missing', () => {
      expect(normalizeHexInput('1234')).toBe('0x1234')
    })

    it('should keep existing 0x prefix', () => {
      expect(normalizeHexInput('0x1234')).toBe('0x1234')
    })

    it('should handle 0X prefix (uppercase)', () => {
      expect(normalizeHexInput('0X1234')).toBe('0x1234')
    })

    it('should trim whitespace', () => {
      expect(normalizeHexInput('  0x1234  ')).toBe('0x1234')
    })
  })

  describe('isValidHex', () => {
    it('should return true for valid hex with 0x prefix', () => {
      expect(isValidHex('0x1234abcdef')).toBe(true)
    })

    it('should return true for valid hex without 0x prefix', () => {
      expect(isValidHex('1234abcdef')).toBe(true)
    })

    it('should return false for invalid characters', () => {
      expect(isValidHex('0x1234ghij')).toBe(false)
    })

    it('should return true for empty string (edge case)', () => {
      expect(isValidHex('')).toBe(true)
      expect(isValidHex('0x')).toBe(true)
    })
  })

  describe('Round-trip with helper functions', () => {
    it('should encode and decode single code', () => {
      const encoded = encodeAttribution({ codes: ['testapp'] })
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && (decoded.schemaId === 0 || decoded.schemaId === 1)) {
        expect(decoded.codes).toEqual(['testapp'])
      }
    })

    it('should encode and decode multiple codes', () => {
      const encoded = encodeAttribution({ codes: ['app1', 'app2', 'app3'] })
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && (decoded.schemaId === 0 || decoded.schemaId === 1)) {
        expect(decoded.codes).toEqual(['app1', 'app2', 'app3'])
      }
    })

    it('should encode and decode with custom registry', () => {
      const encoded = encodeAttribution({
        codes: ['myapp'],
        codeRegistry: {
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          chainId: 42161,
        },
      })
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 1) {
        expect(decoded.codes).toEqual(['myapp'])
        expect(decoded.codeRegistry?.chainId).toBe(42161)
      }
    })
  })
})

describe('Schema 2 - CBOR Encoding/Decoding', () => {
  describe('encodeAttribution with Schema 2', () => {
    it('should encode app code only', () => {
      const result = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
      })
      
      expect(result.success).toBe(true)
      expect(result.schemaId).toBe(2)
      expect(result.suffix).toBeDefined()
      expect(result.suffix?.endsWith('80218021802180218021802180218021')).toBe(true)
    })

    it('should encode wallet code only', () => {
      const result = encodeAttribution({
        schemaId: 2,
        walletCode: 'privy',
      })
      
      expect(result.success).toBe(true)
      expect(result.schemaId).toBe(2)
      expect(result.suffix).toBeDefined()
    })

    it('should encode both app and wallet codes', () => {
      const result = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        walletCode: 'privy',
      })
      
      expect(result.success).toBe(true)
      expect(result.schemaId).toBe(2)
      expect(result.suffix).toBeDefined()
    })

    it('should fail with no codes provided', () => {
      const result = encodeAttribution({
        schemaId: 2,
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail with empty strings for both codes', () => {
      const result = encodeAttribution({
        schemaId: 2,
        appCode: '   ',
        walletCode: '',
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('decodeAttribution with Schema 2', () => {
    it('should decode app code only', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
      })
      
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('baseapp')
        expect(decoded.walletCode).toBeUndefined()
      } else {
        fail('Expected schema 2 result')
      }
    })

    it('should decode wallet code only', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        walletCode: 'privy',
      })
      
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBeUndefined()
        expect(decoded.walletCode).toBe('privy')
      } else {
        fail('Expected schema 2 result')
      }
    })

    it('should decode both app and wallet codes', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        walletCode: 'privy',
      })
      
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('baseapp')
        expect(decoded.walletCode).toBe('privy')
      } else {
        fail('Expected schema 2 result')
      }
    })
  })

  describe('Round-trip Schema 2', () => {
    it('should round-trip app code', () => {
      const original = { schemaId: 2 as const, appCode: 'myapp' }
      const encoded = encodeAttribution(original)
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('myapp')
      }
    })

    it('should round-trip both codes', () => {
      const original = { schemaId: 2 as const, appCode: 'myapp', walletCode: 'mywallet' }
      const encoded = encodeAttribution(original)
      const decoded = decodeAttribution(encoded.suffix!)
      
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('myapp')
        expect(decoded.walletCode).toBe('mywallet')
      }
    })

    it('should handle special characters in codes', () => {
      const original = { schemaId: 2 as const, appCode: 'app_with_underscore' }
      const encoded = encodeAttribution(original)
      const decoded = decodeAttribution(encoded.suffix!)

      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('app_with_underscore')
      }
    })

    it('should round-trip service code', () => {
      const original = { schemaId: 2 as const, serviceCode: 'my-service' }
      const encoded = encodeAttribution(original)
      const decoded = decodeAttribution(encoded.suffix!)

      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.serviceCode).toBe('my-service')
      }
    })

    it('should round-trip all three codes', () => {
      const original = { schemaId: 2 as const, appCode: 'myapp', walletCode: 'mywallet', serviceCode: 'myservice' }
      const encoded = encodeAttribution(original)
      const decoded = decodeAttribution(encoded.suffix!)

      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('myapp')
        expect(decoded.walletCode).toBe('mywallet')
        expect(decoded.serviceCode).toBe('myservice')
      }
    })
  })

  describe('Schema 2 with custom registries', () => {
    it('should encode and decode app custom registry', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        registries: {
          app: {
            chainId: '0x2105',
            address: '0xBcf2B9598Ec0781eE49230CaACF0FB3C881B5195',
          },
        },
      })
      
      expect(encoded.success).toBe(true)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('baseapp')
        expect(decoded.registries?.app?.chainId).toBe('0x2105')
        expect(decoded.registries?.app?.address).toBe('0xBcf2B9598Ec0781eE49230CaACF0FB3C881B5195')
      }
    })

    it('should encode and decode wallet custom registry', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        walletCode: 'privy',
        registries: {
          wallet: {
            chainId: '0x1',
            address: '0x1234567890123456789012345678901234567890',
          },
        },
      })
      
      expect(encoded.success).toBe(true)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.walletCode).toBe('privy')
        expect(decoded.registries?.wallet?.chainId).toBe('0x1')
        expect(decoded.registries?.wallet?.address).toBe('0x1234567890123456789012345678901234567890')
      }
    })

    it('should encode and decode both custom registries', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        walletCode: 'privy',
        registries: {
          app: { chainId: '0x2105', address: '0xAppRegistry000000000000000000000000000000' },
          wallet: { chainId: '0x1', address: '0xWalletRegistry0000000000000000000000000' },
        },
      })
      
      expect(encoded.success).toBe(true)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.registries?.app?.chainId).toBe('0x2105')
        expect(decoded.registries?.wallet?.chainId).toBe('0x1')
      }
    })
  })

  describe('Schema 2 with metadata', () => {
    it('should encode and decode single metadata field', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        metadata: {
          utm_campaign: 'winter-promo',
        },
      })
      
      expect(encoded.success).toBe(true)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('baseapp')
        expect(decoded.metadata?.utm_campaign).toBe('winter-promo')
      }
    })

    it('should encode and decode multiple metadata fields', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        metadata: {
          utm_campaign: 'winter-promo',
          source: 'webapp',
          referrer: 'twitter',
        },
      })
      
      expect(encoded.success).toBe(true)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.metadata?.utm_campaign).toBe('winter-promo')
        expect(decoded.metadata?.source).toBe('webapp')
        expect(decoded.metadata?.referrer).toBe('twitter')
      }
    })

    it('should ignore empty metadata keys and values', () => {
      const encoded = encodeAttribution({
        schemaId: 2,
        appCode: 'baseapp',
        metadata: {
          '': 'empty-key',
          'empty-value': '',
          'valid': 'valid-value',
        },
      })
      
      expect(encoded.success).toBe(true)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.metadata?.valid).toBe('valid-value')
        expect(decoded.metadata?.['']).toBeUndefined()
        expect(decoded.metadata?.['empty-value']).toBeUndefined()
      }
    })
  })

  describe('Schema 2 full example from ERC spec', () => {
    it('should round-trip full example with app, wallet, registry, and metadata', () => {
      const input = {
        schemaId: 2 as const,
        appCode: 'baseapp',
        walletCode: 'privy',
        registries: {
          app: {
            chainId: '0x2105',
            address: '0xBcf2B9598Ec0781eE49230CaACF0FB3C881B5195',
          },
        },
        metadata: {
          utm_campaign: 'winter-promo',
          source: 'webapp',
        },
      }
      
      const encoded = encodeAttribution(input)
      expect(encoded.success).toBe(true)
      expect(encoded.schemaId).toBe(2)
      
      const decoded = decodeAttribution(encoded.suffix!)
      expect(decoded.success).toBe(true)
      if (decoded.success && decoded.schemaId === 2) {
        expect(decoded.appCode).toBe('baseapp')
        expect(decoded.walletCode).toBe('privy')
        expect(decoded.registries?.app?.chainId).toBe('0x2105')
        expect(decoded.registries?.app?.address).toBe('0xBcf2B9598Ec0781eE49230CaACF0FB3C881B5195')
        expect(decoded.metadata?.utm_campaign).toBe('winter-promo')
        expect(decoded.metadata?.source).toBe('webapp')
      }
    })
  })
})
