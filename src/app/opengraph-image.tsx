import { ImageResponse } from 'next/og';
import { BRAND, BrandMark } from '@/lib/brand';

export const alt = 'Fish Paradise – fresh seafood, cleaned to order and delivered';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: BRAND.ink,
        color: BRAND.cream,
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <BrandMark size={96} />
        <span style={{ fontSize: 56 }}>Fish Paradise</span>
      </div>
      <div style={{ marginTop: 48, fontSize: 30, letterSpacing: 6, color: BRAND.gold }}>
        FRESH FROM THE COAST
      </div>
      <div style={{ marginTop: 16, fontSize: 76, lineHeight: 1.05 }}>
        Fresh seafood, delivered to your door.
      </div>
    </div>,
    size,
  );
}
