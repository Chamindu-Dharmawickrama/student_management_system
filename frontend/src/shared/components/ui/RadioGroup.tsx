import { useId } from 'react';
import { Radio } from './Radio';
import { cn } from '@/shared/utils/cn';

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name?: string;
  label?: string;
  options: RadioGroupOption[];
  value: string | null;
  onChange: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  error?: string;
  required?: boolean;
}

export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  orientation = 'vertical',
  error,
  required,
}: RadioGroupProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const groupId = useId();

  return (
    <fieldset className="flex flex-col gap-2" aria-required={required}>
      {label && (
        <legend className="text-sm font-medium text-text-primary">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </legend>
      )}
      <div
        role="radiogroup"
        aria-describedby={error ? `${groupId}-error` : undefined}
        className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={groupName}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
        ))}
      </div>
      {error && (
        <p id={`${groupId}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
