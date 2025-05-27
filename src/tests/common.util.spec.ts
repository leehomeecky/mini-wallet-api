import * as bcrypt from 'bcrypt';
import {
  hashValue,
  generateToken,
  generateRandomString,
  generateTransactionRef,
} from '../utils';

jest.mock('bcrypt');

describe('Common Utils', () => {
  describe('hashValue', () => {
    it('should hash the value with default salt round', async () => {
      const mockHash = 'hashed_value';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await hashValue({ value: 'password123' });
      expect(result).toBe(mockHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'password123',
        expect.any(Number)
      );
    });

    it('should hash with provided saltRounds', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('custom_hashed');
      await hashValue({ value: 'secure', saltRounds: 5 });
      expect(bcrypt.hash).toHaveBeenCalledWith('secure', 5);
    });
  });

  describe('generateToken', () => {
    it('should generate a numeric token of given length', () => {
      const token = generateToken(5);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('generateRandomString', () => {
    it('should generate alphanumeric string of given size', () => {
      const str = generateRandomString({ size: 10 });
      expect(typeof str).toBe('string');
      expect(str.length).toBe(10);
    });

    it('should include special characters if enabled', () => {
      const str = generateRandomString({ size: 20, withSpecials: true });
      expect(str.length).toBe(20);
      expect(/[*^%$&#@)(<>\/?:-]/.test(str)).toBe(true);
    });
  });

  describe('generateTransactionRef', () => {
    it('should generate transaction reference with timestamp and random suffix', () => {
      const ref = generateTransactionRef();
      expect(ref).toMatch(/^TRX_\d+_[A-Za-z0-9]{6}$/);
    });
  });
});
