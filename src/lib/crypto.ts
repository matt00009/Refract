/**
 * Zero-Knowledge Architecture Crypto Utility
 * Uses Web Crypto API (AES-GCM) to securely encrypt and decrypt API keys locally.
 */

// Generate a random initialization vector
const generateIV = () => crypto.getRandomValues(new Uint8Array(12));

/**
 * Derives a cryptographic key from a user-provided vault password using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using the provided vault password.
 * Returns a base64 encoded string containing the salt, IV, and ciphertext.
 */
export async function encryptVault(plaintext: string, password: string): Promise<string> {
  if (!plaintext) return '';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = generateIV();
  const key = await deriveKey(password, salt);
  
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  // Combine salt, iv, and ciphertext into a single buffer
  const payload = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...payload));
}

/**
 * Decrypts a vault string using the provided vault password.
 */
export async function decryptVault(encryptedBase64: string, password: string): Promise<string> {
  if (!encryptedBase64) return '';
  
  try {
    const payloadStr = atob(encryptedBase64);
    const payload = new Uint8Array(payloadStr.length);
    for (let i = 0; i < payloadStr.length; i++) {
      payload[i] = payloadStr.charCodeAt(i);
    }

    const salt = payload.slice(0, 16);
    const iv = payload.slice(16, 28);
    const ciphertext = payload.slice(28);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch {
    throw new Error('Invalid vault password or corrupted data');
  }
}
