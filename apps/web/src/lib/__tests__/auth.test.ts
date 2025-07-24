import { validatePassword, hashPassword, verifyPassword } from '../auth'

describe('Auth Utilities', () => {
  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true)
      expect(validatePassword('MySecure@Pass1')).toBe(true)
    })

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false)
      expect(validatePassword('12345678')).toBe(false)
      expect(validatePassword('password')).toBe(false)
      expect(validatePassword('PASSWORD')).toBe(false)
      expect(validatePassword('Password')).toBe(false)
      expect(validatePassword('Pass123')).toBe(false) // too short
    })

    it('requires minimum length', () => {
      expect(validatePassword('Aa1!')).toBe(false) // 4 chars
      expect(validatePassword('Aa1!5678')).toBe(true) // 8 chars
    })

    it('requires uppercase letter', () => {
      expect(validatePassword('lowercase123!')).toBe(false)
      expect(validatePassword('Lowercase123!')).toBe(true)
    })

    it('requires lowercase letter', () => {
      expect(validatePassword('UPPERCASE123!')).toBe(false)
      expect(validatePassword('UPPERCASe123!')).toBe(true)
    })

    it('requires number', () => {
      expect(validatePassword('NoNumbers!')).toBe(false)
      expect(validatePassword('WithNumber1!')).toBe(true)
    })

    it('requires special character', () => {
      expect(validatePassword('NoSpecialChar1')).toBe(false)
      expect(validatePassword('WithSpecial1!')).toBe(true)
    })
  })

  describe('hashPassword', () => {
    it('hashes password correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
      expect(hash.startsWith('$2a$')).toBe(true)
    })

    it('generates different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('verifies correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('rejects incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('handles empty password', async () => {
      const hash = await hashPassword('TestPassword123!')
      
      const isValid = await verifyPassword('', hash)
      expect(isValid).toBe(false)
    })

    it('handles invalid hash', async () => {
      const password = 'TestPassword123!'
      const invalidHash = 'invalid-hash'
      
      await expect(verifyPassword(password, invalidHash)).rejects.toThrow()
    })
  })
})