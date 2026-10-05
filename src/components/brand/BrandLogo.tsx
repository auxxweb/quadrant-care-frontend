import { COMPANY_NAME } from '../../constants';
import { cn } from '../../utils';

export const LOGO_SRC = '/logo.png';

export function BrandLogo({
  className,
  imgClassName,
  compact = false,
}: {
  className?: string;
  imgClassName?: string;
  compact?: boolean;
}) {
  return (
    <img
      src={LOGO_SRC}
      alt={COMPANY_NAME}
      className={cn(
        'rounded-xl bg-white object-contain',
        compact ? 'h-10 w-10' : 'h-14 w-auto',
        imgClassName,
        className,
      )}
    />
  );
}
