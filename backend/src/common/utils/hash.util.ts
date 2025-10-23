// src/common/utils/hash.util.ts
import * as crypto from 'crypto';

export class HashUtil {
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateNumericCode(length = 6): string {
    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }
}