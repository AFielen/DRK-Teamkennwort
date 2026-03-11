/**
 * Zero-Knowledge Crypto Module
 * All encryption/decryption happens client-side only.
 * Uses Web Crypto API exclusively — no external crypto libraries.
 */

// ── Key Derivation ──

export async function deriveKeys(
  masterPassword: string,
  saltBase64: string
): Promise<{ encryptionKey: CryptoKey; verificationKey: string }> {
  const encoder = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);

  // Import master password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // PBKDF2: 600,000 iterations, SHA-256, 512-bit output
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 600000,
      hash: 'SHA-256',
    },
    keyMaterial,
    512 // 64 bytes = 256 bit encryption + 256 bit verification
  );

  // Split: first 256 bits → encryption key, last 256 bits → verification
  const encryptionKeyBytes = derivedBits.slice(0, 32);
  const verificationBytes = derivedBits.slice(32, 64);

  const encryptionKey = await crypto.subtle.importKey(
    'raw',
    encryptionKeyBytes,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable!
    ['encrypt', 'decrypt']
  );

  const verificationKey = bufferToBase64(new Uint8Array(verificationBytes));

  return { encryptionKey, verificationKey };
}

// ── Encryption / Decryption ──

export async function encrypt(
  data: Record<string, unknown>,
  encryptionKey: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Random 96-bit IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    encryptionKey,
    plaintext as BufferSource
  );

  return {
    encryptedData: bufferToBase64(new Uint8Array(ciphertext)),
    iv: bufferToBase64(iv),
  };
}

export async function decrypt(
  encryptedData: string,
  iv: string,
  encryptionKey: CryptoKey
): Promise<Record<string, unknown>> {
  const ciphertext = base64ToBuffer(encryptedData);
  const ivBytes = base64ToBuffer(iv);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    encryptionKey,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
}

// ── Salt & Recovery Key Generation ──

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16)); // 128-bit
  return bufferToBase64(salt);
}

// Characters without confusable pairs (no 0/O, 1/I, 8/B)
const RECOVERY_CHARS = 'ACDEFGHJKLMNPQRSTUVWXYZ234567';

export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32)); // 256-bit
  const chars: string[] = [];

  for (const byte of bytes) {
    chars.push(RECOVERY_CHARS[byte % RECOVERY_CHARS.length]);
  }

  // Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const groups: string[] = [];
  for (let i = 0; i < 32; i += 4) {
    groups.push(chars.slice(i, i + 4).join(''));
  }

  return groups.join('-');
}

// ── Password Generator ──

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generatePassword(options: PasswordOptions): string {
  const { length, uppercase, lowercase, numbers, symbols } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }

  return result;
}

// ── Password Strength ──

interface StrengthResult {
  score: number;
  label: 'schwach' | 'mittel' | 'stark' | 'sehr stark';
  color: string;
}

export function calculateStrength(password: string): StrengthResult {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 15;
  if (password.length >= 20) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  // Unique characters ratio
  const uniqueRatio = new Set(password).size / password.length;
  score += Math.round(uniqueRatio * 15);

  // Penalty for common patterns
  if (/^[a-z]+$/.test(password)) score -= 10;
  if (/^[0-9]+$/.test(password)) score -= 15;
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/^(12345|password|qwerty|abc)/i.test(password)) score -= 20;

  score = Math.max(0, Math.min(100, score));

  if (score < 30) return { score, label: 'schwach', color: '#dc2626' };
  if (score < 55) return { score, label: 'mittel', color: '#f59e0b' };
  if (score < 80) return { score, label: 'stark', color: '#22c55e' };
  return { score, label: 'sehr stark', color: '#16a34a' };
}

// ── Base64 Helpers ──

function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
