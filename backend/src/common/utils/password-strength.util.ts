// src/common/utils/password-strength.util.ts
export interface PasswordStrengthResult {
  score: number; // 0-4
  strength: 'very_weak' | 'weak' | 'medium' | 'strong' | 'very_strong';
  feedback: string[];
  isValid: boolean;
}

export class PasswordStrengthUtil {
  static check(password: string): PasswordStrengthResult {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    }

    // Character variety
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score++;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z\d]/.test(password)) score++;
    else feedback.push('Include special characters');

    // Common patterns check
    const commonPatterns = [
      /^123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score = Math.max(0, score - 2);
        feedback.push('Avoid common passwords and patterns');
        break;
      }
    }

    // Sequential characters
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid repeating characters');
    }

    const strengthMap = {
      0: 'very_weak',
      1: 'weak',
      2: 'medium',
      3: 'strong',
      4: 'very_strong',
    } as const;

    return {
      score: Math.min(score, 4),
      strength: strengthMap[Math.min(score, 4) as keyof typeof strengthMap],
      feedback,
      isValid: score >= 3,
    };
  }
}

