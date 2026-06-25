import crypto from 'crypto';

// Ensure we have a 32-byte key. If environment variable is missing, we use a hashed fallback.
const ENCRYPTION_KEY_STRING = process.env.MESSAGE_ENCRYPTION_KEY || 'nigerian-navy-mentorship-secret-key-2026-fallback';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_STRING).digest();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // AES-GCM standard IV length is 12 bytes

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encrypted_content: encrypted,
    iv: iv.toString('hex'),
    auth_tag: authTag,
  };
}

export function decrypt(encryptedContent: string, ivHex: string, authTagHex: string): string {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Failed: Secure Message Encrypted]';
  }
}
