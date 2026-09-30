/**
 * Cloudinary delivery transforms: automatic format (WebP/AVIF), automatic quality and the exact
 * width the layout needs. Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryUrl(src: string, width: number, quality?: number): string {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src)) return src;
  return src.replace('/image/upload/', `/image/upload/f_auto,q_${quality ?? 'auto'},c_fill,w_${width}/`);
}

export function isCloudinary(src: string): boolean {
  return src.startsWith('https://res.cloudinary.com/');
}
