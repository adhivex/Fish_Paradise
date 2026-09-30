import { describe, expect, it } from 'vitest';
import { cloudinaryUrl, isCloudinary } from './image';

describe('cloudinaryUrl', () => {
  it('adds format, quality and width transforms', () => {
    expect(cloudinaryUrl('https://res.cloudinary.com/demo/image/upload/v1/fish/rohu.jpg', 384)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,w_384/v1/fish/rohu.jpg',
    );
    expect(cloudinaryUrl('https://res.cloudinary.com/demo/image/upload/x.jpg', 64, 60)).toContain(
      'q_60,c_fill,w_64',
    );
  });

  it('leaves other URLs alone', () => {
    expect(cloudinaryUrl('https://example.com/a.jpg', 100)).toBe('https://example.com/a.jpg');
    expect(isCloudinary('https://example.com/a.jpg')).toBe(false);
  });
});
