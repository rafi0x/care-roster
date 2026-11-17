import { Badge } from '@/components/ui/badge';
import { conditionMeta } from '@/lib/conditions';
import type { Condition } from '@/lib/types';

/** Colour dot plus text label, so condition never depends on colour alone. */
export function ConditionBadge({ condition }: { condition: Condition }) {
  const { label, color } = conditionMeta(condition);
  return (
    <Badge variant="outline" className="gap-1.5 bg-card font-normal">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </Badge>
  );
}
