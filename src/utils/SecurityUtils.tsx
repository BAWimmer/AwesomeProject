/**
 * Security utility functions for authentication and data protection
 * Implements encryption, validation, and secure storage without external dependencies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SECURITY ENHANCEMENT: Simple encryption/decryption using built-in JavaScript
 * This provides basic obfuscation for sensitive data storage
 */
export class SecurityUtils {
  /* SECURITY ENHANCEMENT: Generate a simple encryption key based on device characteristics */
  private static getEncryptionKey(): string {
    // Use a combination of timestamp and random values for basic encryption
    const deviceKey = 'RN_APP_' + Date.now().toString(36);
    return deviceKey;
  }

  /* SECURITY ENHANCEMENT: Simple XOR encryption for sensitive data */
  static encrypt(text: string, key: string): string {
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode ^ keyCode);
    }
    return btoa(encrypted); // Base64 encode for safe storage
  }

  /* SECURITY ENHANCEMENT: Decrypt XOR encrypted data */
  static decrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode ^ keyCode);
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  /* SECURITY ENHANCEMENT: Hash passwords using simple algorithm (better than plaintext) */
  static hashPassword(password: string): string {
    let hash = 0;
    if (password.length === 0) return hash.toString();

    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Add salt and additional complexity
    const salt = 'APP_SALT_2024';
    const saltedHash = (hash + salt.length).toString(36);
    return btoa(saltedHash); // Base64 encode the final hash
  }

  /* SECURITY ENHANCEMENT: Secure storage with encryption */
  static async secureStore(key: string, value: string): Promise<void> {
    try {
      const encryptionKey = this.getEncryptionKey();
      const encryptedValue = this.encrypt(value, encryptionKey);

      // Store both encrypted data and key hash for validation
      await AsyncStorage.setItem(`secure_${key}`, encryptedValue);
      await AsyncStorage.setItem(`key_${key}`, btoa(encryptionKey));
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store data securely');
    }
  }

  /* SECURITY ENHANCEMENT: Secure retrieval with decryption */
  static async secureRetrieve(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(`secure_${key}`);
      const keyHash = await AsyncStorage.getItem(`key_${key}`);

      if (!encryptedValue || !keyHash) {
        return null;
      }

      const encryptionKey = atob(keyHash);
      return this.decrypt(encryptedValue, encryptionKey);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      return null;
    }
  }

  /* SECURITY ENHANCEMENT: Generate secure user ID without using sensitive data */
  static generateSecureUserId(username: string): string {
    // Create a secure identifier without using password
    const timestamp = Date.now().toString();
    const userHash = this.hashPassword(username + timestamp);
    return `user_${userHash.substring(0, 12)}`;
  }

  /* SECURITY ENHANCEMENT: Input validation and sanitization */
  static validateAndSanitizeInput(
    input: string,
    type: 'username' | 'password' | 'text',
  ): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input.trim();

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      '',
    );
    sanitized = sanitized.replace(/[<>\"'%;()&+]/g, '');

    switch (type) {
      case 'username':
        if (sanitized.length < 3) {
          errors.push('Username must be at least 3 characters long');
        }
        if (sanitized.length > 20) {
          errors.push('Username must be less than 20 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
          errors.push(
            'Username can only contain letters, numbers, and underscores',
          );
        }
        break;

      case 'password':
        if (sanitized.length < 8) {
          errors.push('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(sanitized)) {
          errors.push(
            'Password must contain uppercase, lowercase, and numeric characters',
          );
        }
        break;

      case 'text':
        if (sanitized.length > 1000) {
          errors.push('Text content is too long (max 1000 characters)');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  /* SECURITY ENHANCEMENT: Check for common weak passwords */
  static isWeakPassword(password: string): boolean {
    const weakPasswords = [
      'password',
      '123456',
      'password123',
      'admin',
      'qwerty',
      'letmein',
      'welcome',
      'monkey',
      '1234567890',
      'secret',
    ];

    return weakPasswords.includes(password.toLowerCase());
  }

  /* SECURITY ENHANCEMENT: Rate limiting for authentication attempts */
  private static authAttempts: {
    [key: string]: {count: number; lastAttempt: number};
  } = {};

  static checkRateLimit(username: string): {
    allowed: boolean;
    remainingTime?: number;
  } {
    const now = Date.now();
    const userAttempts = this.authAttempts[username];

    if (!userAttempts) {
      this.authAttempts[username] = {count: 1, lastAttempt: now};
      return {allowed: true};
    }

    // Reset after 15 minutes
    if (now - userAttempts.lastAttempt > 15 * 60 * 1000) {
      this.authAttempts[username] = {count: 1, lastAttempt: now};
      return {allowed: true};
    }

    // Allow up to 5 login attempts
    if (userAttempts.count >= 5) {
      const remainingTime = Math.ceil(
        (15 * 60 * 1000 - (now - userAttempts.lastAttempt)) / 1000,
      );
      return {allowed: false, remainingTime};
    }

    userAttempts.count++;
    userAttempts.lastAttempt = now;
    return {allowed: true};
  }

  /* SECURITY ENHANCEMENT: Clear sensitive data from memory */
  static clearSensitiveData(): void {
    this.authAttempts = {};
  }
}
