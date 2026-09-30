import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/brand';

const SIZES = {
  '192': { size: 192, pad: 0 },
  '512': { size: 512, pad: 0 },
  maskable: { size: 512, pad: 96 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

/** PNG app icons for the web manifest (regular 192/512 and a maskable 512). */
export async function GET(_req: Request, ctx: RouteContext<'/pwa-icon/[size]'>) {
  const { size } = await ctx.params;
  const spec = SIZES[size as keyof typeof SIZES];
  if (!spec) return new Response('Not found', { status: 404 });
  return new ImageResponse(<BrandMark size={spec.size} pad={spec.pad} />, {
    width: spec.size,
    height: spec.size,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
