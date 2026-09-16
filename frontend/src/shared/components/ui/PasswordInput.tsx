import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from './Input';
import { getPasswordStrength } from '@/features/auth/validation/auth.schemas';
import { cn } from '@/shared/utils/cn';

export interface PasswordInputProps extends InputProps {
  showStrengthMeter?: boolean;
}

const STRENGTH_LABEL: Record<string, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrengthMeter = false, value, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const strength =
      showStrengthMeter && typeof value === 'string' && value.length > 0
        ? getPasswordStrength(value)
        : null;

    return (
      <div className="flex flex-col gap-1.5">
        <Input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          rightIcon={
            <button
              type="button"
              aria-pressed={visible}
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((v) => !v)}
              className="pointer-events-auto rounded-sm p-0.5 text-text-muted hover:text-text-primary focus-visible:outline-none"
            >
              {visible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
          {...props}
        />
        {strength && (
          <div aria-live="polite" className="flex flex-col gap-1">
            <div className="flex gap-1" role="presentation">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-(--transition-fast)',
                    i < strength.score ? '' : 'bg-bg-subtle',
                  )}
                  style={i < strength.score ? { backgroundColor: strength.color } : undefined}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted">
              Password strength: {STRENGTH_LABEL[strength.level]}
            </span>
          </div>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
