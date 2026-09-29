import { cn } from '@/lib/cn';
import { GLYPHS, productArt } from '@/lib/productArt';

interface ProductImageProps {
  slug: string;
  categorySlug?: string;
  /** Tailwind size + radius classes, e.g. `size-[76px] rounded-[18px]`. */
  className?: string;
  glyphClassName?: string;
  eyeColor?: string;
}

/**
 * Rounded product tile. Shows the illustrated glyph for now; real photos (Cloudinary + next/image)
 * slot in here later on the same tile.
 */
export function ProductImage({
  slug,
  categorySlug,
  className,
  glyphClassName = 'w-[70%]',
  eyeColor = '#F7F2E8',
}: ProductImageProps) {
  const art = productArt(slug, categorySlug);
  const g = GLYPHS[art.glyph];
  const [ex, ey, er] = g.eye;
  return (
    <span
      aria-hidden="true"
      className={cn('flex flex-none items-center justify-center', className)}
      style={{ background: art.bg }}
    >
      <svg viewBox="0 0 64 40" className={cn('h-auto', glyphClassName)}>
        <path
          d={g.d}
          fill={art.fg}
          stroke="#E4CE9A"
          strokeWidth={1.1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {er > 0 && <circle cx={ex} cy={ey} r={er} fill={eyeColor} />}
      </svg>
    </span>
  );
}
