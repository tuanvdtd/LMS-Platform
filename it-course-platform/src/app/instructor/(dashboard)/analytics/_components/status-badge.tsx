import { Activity, AlertTriangle, CheckCircle2, Hourglass, OctagonAlert, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RISK_META, STATUS_META } from '@/lib/analytics';
import type { ItemStatus, RiskLevel } from '@/types/analytics';

const STATUS_ICON = { good: CheckCircle2, review: AlertTriangle, fix: OctagonAlert, insufficient: Hourglass } as const;
const RISK_ICON = { high: OctagonAlert, watch: AlertTriangle, ok: Activity, new: UserPlus, done: CheckCircle2 } as const;

// Trạng thái luôn có icon + chữ (Paired-Signal Rule).
export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge variant={STATUS_META[status].tone}>
      <Icon aria-hidden />
      {STATUS_META[status].label}
    </Badge>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const Icon = RISK_ICON[level];
  return (
    <Badge variant={RISK_META[level].tone}>
      <Icon aria-hidden />
      {RISK_META[level].label}
    </Badge>
  );
}
