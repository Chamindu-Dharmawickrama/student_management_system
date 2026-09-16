import {
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  Clock,
  FileEdit,
  KeyRound,
  Lock,
  Send,
  ShieldCheck,
  ShieldOff,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeVariant } from './Badge';

export type MarkSheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';
export type AccountState = 'active' | 'inactive';
export type ExamPeriodStatus = 'not-configured' | 'upcoming' | 'in-progress' | 'entry-open';

interface StatusMeta {
  variant: BadgeVariant;
  label: string;
  icon: LucideIcon;
}

const MARK_SHEET_STATUS: Record<MarkSheetStatus, StatusMeta> = {
  DRAFT: { variant: 'neutral', label: 'Draft', icon: FileEdit },
  SUBMITTED: { variant: 'info', label: 'Submitted', icon: Send },
  APPROVED: { variant: 'success', label: 'Approved', icon: CheckCircle2 },
  REJECTED: { variant: 'danger', label: 'Rejected', icon: XCircle },
  LOCKED: { variant: 'neutral', label: 'Locked', icon: Lock },
};

const ACCOUNT_STATE: Record<AccountState, StatusMeta> = {
  active: { variant: 'success', label: 'Active', icon: ShieldCheck },
  inactive: { variant: 'danger', label: 'Inactive', icon: ShieldOff },
};

const EXAM_PERIOD_STATUS: Record<ExamPeriodStatus, StatusMeta> = {
  'not-configured': { variant: 'neutral', label: 'Not configured', icon: CalendarOff },
  upcoming: { variant: 'info', label: 'Upcoming', icon: CalendarClock },
  'in-progress': { variant: 'warning', label: 'In progress', icon: Clock },
  'entry-open': { variant: 'success', label: 'Entry open', icon: CheckCircle2 },
};

const PASSWORD_PENDING: StatusMeta = {
  variant: 'warning',
  label: 'Pending first login',
  icon: KeyRound,
};

export type StatusBadgeProps =
  | { kind: 'markSheet'; status: MarkSheetStatus }
  | { kind: 'account'; status: AccountState }
  | { kind: 'examPeriod'; status: ExamPeriodStatus }
  | { kind: 'passwordPending' };

export function StatusBadge(props: StatusBadgeProps) {
  const meta: StatusMeta =
    props.kind === 'markSheet'
      ? MARK_SHEET_STATUS[props.status]
      : props.kind === 'account'
        ? ACCOUNT_STATE[props.status]
        : props.kind === 'examPeriod'
          ? EXAM_PERIOD_STATUS[props.status]
          : PASSWORD_PENDING;

  const Icon = meta.icon;

  return (
    <Badge variant={meta.variant} icon={<Icon className="h-3.5 w-3.5" aria-hidden="true" />}>
      {meta.label}
    </Badge>
  );
}
