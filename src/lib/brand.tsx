/** Brand mark shared by generated icons and social images (ImageResponse-compatible JSX). */
export const BRAND = { ink: '#0A2A2F', gold: '#C9A45C', cream: '#F7F2E8' } as const;

const FISH_PATH = 'M2 20C12 6 30 4 46 16l16-10v28L46 24C30 36 12 34 2 20z';

/** Gold disc with the ink fish; `pad` shrinks the mark for maskable icons (safe zone). */
export function BrandMark({ size, pad = 0 }: { size: number; pad?: number }) {
  const inner = size - pad * 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: pad ? BRAND.gold : 'transparent',
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: inner,
          background: BRAND.gold,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={inner * 0.62} height={inner * 0.39} viewBox="0 0 64 40">
          <path d={FISH_PATH} fill={BRAND.ink} />
        </svg>
      </div>
    </div>
  );
}
