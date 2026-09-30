import { describe, expect, it } from 'vitest';
import { fixtureCatalogue } from '@/test/fixtures';
import { jsonLdScript, localBusinessJsonLd } from './structured-data';

describe('localBusinessJsonLd', () => {
  const shop = fixtureCatalogue().shop;

  it('omits facts the owner has not entered', () => {
    const d = localBusinessJsonLd(shop, 'https://fish.example');
    expect(d).toMatchObject({ name: 'Fish Paradise', url: 'https://fish.example' });
    expect(d).not.toHaveProperty('telephone');
  });

  it('includes the phone once set', () => {
    expect(localBusinessJsonLd({ ...shop, phone: '+919876543210' }, 'https://x')).toHaveProperty(
      'telephone',
      '+919876543210',
    );
  });

  it('escapes script-breaking characters', () => {
    expect(jsonLdScript({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}');
  });
});
