/**
 * Illustrated placeholder tiles used until real product photos exist (see DESIGN_SYSTEM.md).
 * Deep teal tones for fish, warm browns for prawns and crab.
 */

type Glyph = 'fish' | 'prawn' | 'crab';

export interface ProductArt {
  bg: string;
  fg: string;
  glyph: Glyph;
}

export const GLYPHS: Record<Glyph, { d: string; eye: [number, number, number] }> = {
  fish: { d: 'M2 20C12 6 30 4 46 16l16-10v28L46 24C30 36 12 34 2 20z', eye: [14, 17, 2] },
  prawn: {
    d: 'M10 30C8 16 22 6 38 8c10 1 16 8 16 16l-8-2c0-6-4-9-10-9-10 0-16 6-16 14 0 3 1 5 2 8-6 0-11-1-12-5zM50 24l10-6-2 12z',
    eye: [44, 14, 1.8],
  },
  crab: {
    d: 'M15 24a17 11 0 1 0 34 0a17 11 0 1 0-34 0zM3 11a6 6 0 1 0 12 0a6 6 0 1 0-12 0zM49 11a6 6 0 1 0 12 0a6 6 0 1 0-12 0zM14 15L22 21M50 15L42 21M17 32L10 37M47 32L54 37M24 34L21 39M40 34L43 39',
    eye: [32, 20, 0],
  },
};

const BY_SLUG: Record<string, ProductArt> = {
  rohu: { bg: '#0F3238', fg: '#7FB0B5', glyph: 'fish' },
  pomfret: { bg: '#123A41', fg: '#A9C7CB', glyph: 'fish' },
  'seer-fish': { bg: '#10363A', fg: '#8FBFA9', glyph: 'fish' },
  tilapia: { bg: '#1B3A38', fg: '#C2C48A', glyph: 'fish' },
  hilsa: { bg: '#132F3D', fg: '#9DB5E0', glyph: 'fish' },
  mackerel: { bg: '#12353A', fg: '#94B7B0', glyph: 'fish' },
  'tiger-prawns': { bg: '#2E1E1A', fg: '#E8926A', glyph: 'prawn' },
  'white-prawns': { bg: '#2B211B', fg: '#EBB48C', glyph: 'prawn' },
  crab: { bg: '#2F1C1C', fg: '#E08A7A', glyph: 'crab' },
};

const BY_CATEGORY: Record<string, ProductArt> = {
  fish: { bg: '#0F3238', fg: '#7FB0B5', glyph: 'fish' },
  prawns: { bg: '#2E1E1A', fg: '#E8926A', glyph: 'prawn' },
  crab: { bg: '#2F1C1C', fg: '#E08A7A', glyph: 'crab' },
};

export function productArt(slug: string, categorySlug?: string): ProductArt {
  return BY_SLUG[slug] ?? (categorySlug ? BY_CATEGORY[categorySlug] : undefined) ?? BY_CATEGORY.fish!;
}
