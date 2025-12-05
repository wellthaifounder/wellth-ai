/**
 * One-time script to generate PLAID_ENCRYPTION_KEY
 *
 * USAGE:
 *   deno run generate-encryption-key.ts
 *
 * OUTPUT:
 *   Base64-encoded 256-bit encryption key for use in environment variables
 *
 * SECURITY:
 *   - Run this once and store the key securely (1Password, AWS Secrets Manager, etc.)
 *   - Never commit the generated key to version control
 *   - Back up the key - if lost, encrypted tokens cannot be recovered
 */

// Generate a random 256-bit (32 byte) key
const key = crypto.getRandomValues(new Uint8Array(32));

// Encode as base64
const base64Key = btoa(String.fromCharCode(...key));

console.log('='.repeat(80));
console.log('PLAID ACCESS TOKEN ENCRYPTION KEY');
console.log('='.repeat(80));
console.log('');
console.log('Add this to your environment variables:');
console.log('');
console.log(`PLAID_ENCRYPTION_KEY=${base64Key}`);
console.log('');
console.log('IMPORTANT SECURITY NOTES:');
console.log('- Store this key in a secure secrets manager (1Password, AWS Secrets Manager, etc.)');
console.log('- Back up this key - if lost, all encrypted tokens become unusable');
console.log('- Never commit this key to version control');
console.log('- Use the same key across all environments that share the same database');
console.log('');
console.log('='.repeat(80));
