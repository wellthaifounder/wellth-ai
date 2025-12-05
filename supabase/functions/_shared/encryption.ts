// AES-256-GCM encryption utilities for Plaid tokens
// HIPAA-compliant encryption at rest (45 CFR 164.312(a)(2)(iv))

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Get the encryption key from environment variables
 * @throws Error if PLAID_ENCRYPTION_KEY is not set or invalid
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get("PLAID_ENCRYPTION_KEY");

  if (!keyString) {
    throw new Error("PLAID_ENCRYPTION_KEY environment variable not set");
  }

  // Decode base64 key
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));

  if (keyData.length !== 32) {
    throw new Error("PLAID_ENCRYPTION_KEY must be 32 bytes (256 bits)");
  }

  // Import key for AES-GCM operations
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a Plaid access token using AES-256-GCM
 * @param plaintext - The plaintext token to encrypt
 * @returns Base64-encoded encrypted data in format: iv:ciphertext
 */
export async function encryptPlaidToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Format: base64(iv):base64(ciphertext)
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

  return `${ivB64}:${ciphertextB64}`;
}

/**
 * Decrypt a Plaid access token using AES-256-GCM
 * @param encrypted - The encrypted token in format: iv:ciphertext
 * @returns The decrypted plaintext token
 * @throws Error if format is invalid or decryption fails
 */
export async function decryptPlaidToken(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();

  // Parse encrypted format
  const parts = encrypted.split(":");

  if (parts.length !== 2) {
    throw new Error("Invalid encrypted token format (expected iv:ciphertext)");
  }

  const [ivB64, ciphertextB64] = parts;

  if (!ivB64 || !ciphertextB64) {
    throw new Error("Invalid encrypted token format (missing iv or ciphertext)");
  }

  // Decode base64
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  // Decode bytes to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
