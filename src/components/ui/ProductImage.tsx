'use client';

import Image from 'next/image';
import { cn } from '@/lib/cn';
import { cloudinaryUrl, isCloudinary } from '@/lib/image';
import { GLYPHS, productArt } from '@/lib/productArt';

interface ProductImageProps {
  slug: string;
  categorySlug?: string;
  /** Real photo (Cloudinary). Without it the illustrated tile is shown. */
  imageUrl?: string | null;
  /** `sizes` hint for responsive photos, e.g. `76px` or `(max-width: 480px) 100vw, 480px`. */
  sizes?: string;
  /** Load eagerly (hero / first row). */
  priority?: boolean;
  /** Tailwind size + radius classes, e.g. `size-[76px] rounded-[18px]`. */
  className?: string;
  glyphClassName?: string;
  eyeColor?: string;
}

/** Rounded product tile: a Cloudinary photo when available, otherwise the illustrated glyph. */
export function ProductImage({
  slug,
  categorySlug,
  imageUrl,
  sizes = '160px',
  priority = false,
  className,
  glyphClassName = 'w-[70%]',
  eyeColor = '#F7F2E8',
}: ProductImageProps) {
  const art = productArt(slug, categorySlug);

  if (imageUrl) {
    return (
      <span
        aria-hidden="true"
        className={cn('relative flex flex-none overflow-hidden', className)}
        style={{ background: art.bg }}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          loader={
            isCloudinary(imageUrl)
              ? ({ src, width, quality }) => cloudinaryUrl(src, width, quality)
              : undefined
          }
          unoptimized={!isCloudinary(imageUrl)}
          className="object-cover"
        />
      </span>
    );
  }

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
