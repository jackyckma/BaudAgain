import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  userId: string;
  handle: string;
  accessLevel: number;
}

/**
 * JWT Configuration
 */
export interface JWTConfig {
  secret: string;
  expiresIn?: StringValue | number;
}

/**
 * JWT Utility Class
 * 
 * Handles JWT token generation and verification for API authentication.
 */
export class JWTUtil {
  private secret: string;
  private expiresIn: StringValue | number;

  constructor(config: JWTConfig) {
    if (!config.secret || config.secret === 'your_jwt_secret_here_change_in_production') {
      throw new Error('JWT_SECRET must be set in environment variables');
    }
    
    this.secret = config.secret;
    this.expiresIn = config.expiresIn || '24h';
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'baudagain-bbs',
      audience: 'baudagain-api',
    });
  }

  /**
   * Verify and decode a JWT token
   * 
   * @throws Error if token is invalid or expired
   */
  verifyToken(token: string): JWTPayload {
    try {
      const options: jwt.VerifyOptions = {
        issuer: 'baudagain-bbs',
        audience: 'baudagain-api',
      };
      
      const decoded = jwt.verify(token, this.secret, options) as JWTPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode a token without verifying (useful for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}
