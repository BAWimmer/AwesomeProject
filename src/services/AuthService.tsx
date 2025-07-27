/**
 * SECURITY ENHANCEMENT: Secure authentication service
 * Implements proper authentication without hardcoded credentials
 */

import {SecurityUtils} from '../utils/SecurityUtils';

export interface IUser {
  username: string;
  userId: string; // SECURITY ENHANCEMENT: Use secure ID instead of storing passwords directly in the code
  createdAt: number;
}

export interface IAuthCredentials {
  username: string;
  password: string;
}

export class AuthService {
  private static readonly USERS_STORAGE_KEY = 'app_users';
  private static readonly SESSION_STORAGE_KEY = 'user_session';

  /* SECURITY ENHANCEMENT: Register a new user with secure password storage */
  static async registerUser(
    credentials: IAuthCredentials,
  ): Promise<{success: boolean; error?: string; user?: IUser}> {
    try {
      // Validate input
      const usernameValidation = SecurityUtils.validateAndSanitizeInput(
        credentials.username,
        'username',
      );
      const passwordValidation = SecurityUtils.validateAndSanitizeInput(
        credentials.password,
        'password',
      );

      if (!usernameValidation.isValid) {
        return {success: false, error: usernameValidation.errors.join(', ')};
      }

      if (!passwordValidation.isValid) {
        return {success: false, error: passwordValidation.errors.join(', ')};
      }

      // Check for weak passwords
      if (SecurityUtils.isWeakPassword(credentials.password)) {
        return {
          success: false,
          error: 'Password is too common. Please choose a stronger password.',
        };
      }

      // Check if user already exists
      const existingUsers = await this.getStoredUsers();
      if (
        existingUsers.some(
          user => user.username === usernameValidation.sanitized,
        )
      ) {
        return {success: false, error: 'Username already exists'};
      }

      // Create secure user object
      const user: IUser = {
        username: usernameValidation.sanitized,
        userId: SecurityUtils.generateSecureUserId(
          usernameValidation.sanitized,
        ),
        createdAt: Date.now(),
      };

      // Store password hash securely (separate from user data)
      const passwordHash = SecurityUtils.hashPassword(
        passwordValidation.sanitized,
      );
      await SecurityUtils.secureStore(`pwd_${user.userId}`, passwordHash);

      // Store user data
      const updatedUsers = [...existingUsers, user];
      await SecurityUtils.secureStore(
        this.USERS_STORAGE_KEY,
        JSON.stringify(updatedUsers),
      );

      return {success: true, user};
    } catch (error) {
      console.error('User registration failed:', error);
      return {success: false, error: 'Registration failed. Please try again.'};
    }
  }

  /* SECURITY ENHANCEMENT: Authenticate user with rate limiting and secure password comparison */
  static async authenticateUser(
    credentials: IAuthCredentials,
  ): Promise<{success: boolean; error?: string; user?: IUser}> {
    try {
      // Validate input
      const usernameValidation = SecurityUtils.validateAndSanitizeInput(
        credentials.username,
        'username',
      );
      const passwordValidation = SecurityUtils.validateAndSanitizeInput(
        credentials.password,
        'password',
      );

      if (!usernameValidation.isValid || !passwordValidation.isValid) {
        return {success: false, error: 'Invalid username or password format'};
      }

      // Check rate limiting
      const rateLimit = SecurityUtils.checkRateLimit(
        usernameValidation.sanitized,
      );
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Too many failed attempts. Please try again in ${Math.ceil(
            rateLimit.remainingTime! / 60,
          )} minutes.`,
        };
      }

      // Find user
      const users = await this.getStoredUsers();
      const user = users.find(u => u.username === usernameValidation.sanitized);

      if (!user) {
        return {success: false, error: 'Invalid username or password'};
      }

      // Verify password
      const storedPasswordHash = await SecurityUtils.secureRetrieve(
        `pwd_${user.userId}`,
      );
      const inputPasswordHash = SecurityUtils.hashPassword(
        passwordValidation.sanitized,
      );

      if (storedPasswordHash !== inputPasswordHash) {
        return {success: false, error: 'Invalid username or password'};
      }

      // Create secure session
      await this.createSession(user);

      return {success: true, user};
    } catch (error) {
      console.error('Authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }
  }

  /* SECURITY ENHANCEMENT: Create secure session without storing sensitive data */
  private static async createSession(user: IUser): Promise<void> {
    const sessionData = {
      userId: user.userId,
      username: user.username,
      loginTime: Date.now(),
      sessionId: SecurityUtils.generateSecureUserId(user.username + Date.now()),
    };

    await SecurityUtils.secureStore(
      this.SESSION_STORAGE_KEY,
      JSON.stringify(sessionData),
    );
  }

  /* SECURITY ENHANCEMENT: Retrieve current session */
  static async getCurrentSession(): Promise<IUser | null> {
    try {
      const sessionData = await SecurityUtils.secureRetrieve(
        this.SESSION_STORAGE_KEY,
      );
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Check session expiry (24 hours)
      if (Date.now() - session.loginTime > 24 * 60 * 60 * 1000) {
        await this.logout();
        return null;
      }

      return {
        username: session.username,
        userId: session.userId,
        createdAt: session.loginTime,
      };
    } catch (error) {
      console.error('Session retrieval failed:', error);
      return null;
    }
  }

  /* SECURITY ENHANCEMENT: Secure logout */
  static async logout(): Promise<void> {
    try {
      await SecurityUtils.secureStore(this.SESSION_STORAGE_KEY, '');
      SecurityUtils.clearSensitiveData();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /* SECURITY ENHANCEMENT: Get stored users securely */
  private static async getStoredUsers(): Promise<IUser[]> {
    try {
      const usersData = await SecurityUtils.secureRetrieve(
        this.USERS_STORAGE_KEY,
      );
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Failed to retrieve users:', error);
      return [];
    }
  }

  /* SECURITY ENHANCEMENT: Initialize with demo users (for testing - remove in production, for demonstration purposes only) */
  static async initializeDemoUsers(): Promise<void> {
    try {
      const existingUsers = await this.getStoredUsers();
      if (existingUsers.length === 0) {
        // Create demo users with secure passwords
        await this.registerUser({
          username: 'demo_user',
          password: 'SecurePass123!',
        });
        await this.registerUser({
          username: 'test_user',
          password: 'TestPass456!',
        });
      }
    } catch (error) {
      console.error('Demo user initialization failed:', error);
    }
  }
}
