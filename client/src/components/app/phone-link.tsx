import { formatPhone } from '@/lib/format';

/** Tap-to-call link. Stops the click so it does not also trigger a clickable row. */
export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      className="whitespace-nowrap tabular-nums hover:text-primary"
    >
      {formatPhone(phone)}
    </a>
  );
}
