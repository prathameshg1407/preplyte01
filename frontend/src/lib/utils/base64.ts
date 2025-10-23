/**
 * Encode string to base64
 * Works in both browser and Node.js environments
 */
export function toBase64(str: string): string {
  if (!str) return '';
  
  try {
    if (typeof window === 'undefined') {
      // Node.js environment
      return Buffer.from(str, 'utf8').toString('base64');
    } else {
      // Browser environment
      // Use TextEncoder for proper UTF-8 encoding
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const binary = Array.from(data, byte => String.fromCharCode(byte)).join('');
      return btoa(binary);
    }
  } catch (error) {
    console.error('[toBase64] Encoding error:', error);
    throw new Error('Failed to encode string to base64');
  }
}

/**
 * Decode base64 to string
 * Works in both browser and Node.js environments
 */
export function fromBase64(base64: string): string {
  if (!base64) return '';
  
  try {
    if (typeof window === 'undefined') {
      // Node.js environment
      return Buffer.from(base64, 'base64').toString('utf8');
    } else {
      // Browser environment
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    }
  } catch (error) {
    console.error('[fromBase64] Decoding error:', error);
    throw new Error('Failed to decode base64 string');
  }
}

/**
 * Check if string is valid base64
 */
export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  try {
    // Base64 regex pattern
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    if (!base64Regex.test(str)) {
      return false;
    }
    
    // Try to decode
    fromBase64(str);
    return true;
  } catch {
    return false;
  }
}