/**
 * Authentication Error Handler
 * Provides comprehensive error handling for Firebase Auth operations
 */

export interface AuthError {
  code: string;
  message: string;
  userFriendlyMessage: string;
  actionable: boolean;
  retryable: boolean;
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export const AUTH_ERROR_MESSAGES: Record<string, AuthError> = {
  // Google Sign-In specific errors
  'auth/popup-closed-by-user': {
    code: 'auth/popup-closed-by-user',
    message: 'The popup was closed before completing the sign-in.',
    userFriendlyMessage: 'Sign-in was cancelled. Please try again.',
    actionable: true,
    retryable: true
  },
  'auth/popup-blocked': {
    code: 'auth/popup-blocked',
    message: 'The popup was blocked by the browser.',
    userFriendlyMessage: 'Popup was blocked by your browser. Please allow popups for this site and try again.',
    actionable: true,
    retryable: true
  },
  'auth/cancelled-popup-request': {
    code: 'auth/cancelled-popup-request',
    message: 'Multiple popup requests were triggered.',
    userFriendlyMessage: 'Multiple sign-in attempts detected. Please wait a moment and try again.',
    actionable: true,
    retryable: true
  },
  'auth/operation-not-allowed': {
    code: 'auth/operation-not-allowed',
    message: 'The authentication provider is not enabled.',
    userFriendlyMessage: 'Google sign-in is not enabled. Please contact support or use email/password sign-in.',
    actionable: false,
    retryable: false
  },
  'auth/invalid-api-key': {
    code: 'auth/invalid-api-key',
    message: 'The API key is invalid.',
    userFriendlyMessage: 'There\'s a configuration issue. Please contact support.',
    actionable: false,
    retryable: false
  },
  'auth/network-request-failed': {
    code: 'auth/network-request-failed',
    message: 'A network error occurred.',
    userFriendlyMessage: 'Network error. Please check your internet connection and try again.',
    actionable: true,
    retryable: true
  },
  'auth/too-many-requests': {
    code: 'auth/too-many-requests',
    message: 'Too many requests were made.',
    userFriendlyMessage: 'Too many attempts. Please wait a few minutes before trying again.',
    actionable: true,
    retryable: true
  },
  'auth/user-disabled': {
    code: 'auth/user-disabled',
    message: 'The user account has been disabled.',
    userFriendlyMessage: 'Your account has been disabled. Please contact support.',
    actionable: false,
    retryable: false
  },
  'auth/account-exists-with-different-credential': {
    code: 'auth/account-exists-with-different-credential',
    message: 'An account already exists with the same email but different sign-in credentials.',
    userFriendlyMessage: 'An account with this email already exists. Please sign in using your original method.',
    actionable: true,
    retryable: false
  },

  // Email/Password specific errors
  'auth/email-already-in-use': {
    code: 'auth/email-already-in-use',
    message: 'The email address is already in use.',
    userFriendlyMessage: 'An account with this email already exists. Please use a different email or sign in.',
    actionable: true,
    retryable: false
  },
  'auth/invalid-email': {
    code: 'auth/invalid-email',
    message: 'The email address is invalid.',
    userFriendlyMessage: 'Please enter a valid email address.',
    actionable: true,
    retryable: true
  },
  'auth/weak-password': {
    code: 'auth/weak-password',
    message: 'The password is too weak.',
    userFriendlyMessage: 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
    actionable: true,
    retryable: true
  },
  'auth/user-not-found': {
    code: 'auth/user-not-found',
    message: 'No user found with this email.',
    userFriendlyMessage: 'No account found with this email. Please check your email or create a new account.',
    actionable: true,
    retryable: false
  },
  'auth/wrong-password': {
    code: 'auth/wrong-password',
    message: 'The password is incorrect.',
    userFriendlyMessage: 'Incorrect password. Please try again or reset your password.',
    actionable: true,
    retryable: true
  },
  'auth/invalid-credential': {
    code: 'auth/invalid-credential',
    message: 'The credentials are invalid.',
    userFriendlyMessage: 'Invalid email or password. Please check your credentials and try again.',
    actionable: true,
    retryable: true
  }
};

/**
 * Handles authentication errors and returns user-friendly messages
 */
export function handleAuthError(error: any): AuthError {
  // If it's already a handled error with a code
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code];
  }

  // Check for error messages that might contain error codes
  const errorMessage = error.message || '';
  
  // Try to extract error code from message
  for (const [code, errorInfo] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (errorMessage.includes(code) || errorMessage.includes(code.replace('auth/', ''))) {
      return errorInfo;
    }
  }

  // Check for common error patterns in messages
  if (errorMessage.toLowerCase().includes('popup') && errorMessage.toLowerCase().includes('closed')) {
    return AUTH_ERROR_MESSAGES['auth/popup-closed-by-user'];
  }
  
  if (errorMessage.toLowerCase().includes('popup') && errorMessage.toLowerCase().includes('blocked')) {
    return AUTH_ERROR_MESSAGES['auth/popup-blocked'];
  }
  
  if (errorMessage.toLowerCase().includes('network')) {
    return AUTH_ERROR_MESSAGES['auth/network-request-failed'];
  }

  // Default error for unknown cases
  return {
    code: 'auth/unknown-error',
    message: errorMessage || 'An unknown error occurred',
    userFriendlyMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    actionable: true,
    retryable: true
  };
}

/**
 * Gets actionable suggestions for resolving auth errors
 */
export function getErrorSuggestions(error: AuthError): string[] {
  const suggestions: string[] = [];

  switch (error.code) {
    case 'auth/popup-blocked':
      suggestions.push('Allow popups for this website in your browser settings');
      suggestions.push('Try using a different browser');
      suggestions.push('Disable popup blockers temporarily');
      break;
    
    case 'auth/network-request-failed':
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Disable VPN if you\'re using one');
      break;
    
    case 'auth/too-many-requests':
      suggestions.push('Wait 5-10 minutes before trying again');
      suggestions.push('Clear your browser cache and cookies');
      break;
    
    case 'auth/operation-not-allowed':
      suggestions.push('Contact support for assistance');
      suggestions.push('Try using email/password sign-in instead');
      break;
    
    case 'auth/account-exists-with-different-credential':
      suggestions.push('Try signing in with your original method (email/password or different provider)');
      suggestions.push('Use the "Forgot Password" option if you used email/password originally');
      break;
    
    default:
      if (error.retryable) {
        suggestions.push('Try again in a few moments');
        suggestions.push('Refresh the page and try again');
      }
      if (!error.actionable) {
        suggestions.push('Contact support if the problem persists');
      }
      break;
  }

  return suggestions;
}

/**
 * Determines if an error should trigger a retry mechanism
 */
export function shouldRetry(error: AuthError): boolean {
  return error.retryable && !['auth/too-many-requests', 'auth/user-disabled'].includes(error.code);
}

/**
 * Gets the appropriate delay before retrying (in milliseconds)
 */
export function getRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
}
