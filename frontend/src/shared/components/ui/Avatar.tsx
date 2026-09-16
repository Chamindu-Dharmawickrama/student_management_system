import { useState } from 'react';
import { cn } from '@/shared/utils/cn';
import { initials } from '@/shared/utils/formatUtils';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'active' | 'inactive';
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const STATUS_CLASSES: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-success',
  active: 'bg-success',
  offline: 'bg-text-muted',
  inactive: 'bg-danger',
};

export function Avatar({ photoUrl, firstName, lastName, size = 'md', status, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = photoUrl && !imgError;
  const label = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'User';

  return (
    <span className={cn('relative inline-flex shrink-0', SIZE_CLASSES[size], className)}>
      {showImage ? (
        <img
          src={photoUrl}
          alt={label}
          onError={() => setImgError(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          role="img"
          aria-label={label}
          className="flex h-full w-full items-center justify-center rounded-full bg-primary-subtle font-semibold text-primary-700"
        >
          {initials(firstName, lastName) || '?'}
        </span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg-card',
            STATUS_CLASSES[status],
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
