import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateBoilerplate,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
} from '../boilerplate.js';

describe('generateBoilerplate', () => {
  it('builds a complete HTML document with shared head markup and body content', () => {
    const title = 'Contact Us | Burleigh Gold Coast Motel';
    const description = 'Contact Burleigh Gold Coast Motel on the Gold Coast Highway in Miami QLD.';
    const canonical = 'https://new.burleighmotel.com.au/contact/';
    const ogUrl = 'https://www.burleighmotel.com.au/contact/';
    const bodyContent = '<main id="main"><h1>Contact</h1></main>';
    const extraStylesheets = ['/css/posts.css'];
    const inlineStyles = '.page-hero{padding:64px;}';
    const schemaJson = '{"@context":"https://schema.org","@type":"ContactPage","name":"Contact"}';

    const html = generateBoilerplate(
      title,
      description,
      canonical,
      ogUrl,
      bodyContent,
      extraStylesheets,
      inlineStyles,
      schemaJson,
      DEFAULT_OG_IMAGE,
      DEFAULT_OG_IMAGE_ALT,
    );

    assert.match(html, /^<!DOCTYPE html>\n<html lang="en-AU">/);
    assert.match(html, /<title>Contact Us \| Burleigh Gold Coast Motel<\/title>/);
    assert.match(html, /<meta name="description" content="Contact Burleigh Gold Coast Motel on the Gold Coast Highway in Miami QLD\.">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/new\.burleighmotel\.com\.au\/contact\/">/);
    assert.match(html, /<meta property="og:url" content="https:\/\/www\.burleighmotel\.com\.au\/contact\/">/);
    assert.match(html, /<meta property="og:image" content="https:\/\/www\.burleighmotel\.com\.au\/images\/motel\/exterior\/burleigh-motel-mural-full-facade-gold-coast-highway-miami\.webp">/);
    assert.match(html, /<link rel="stylesheet" href="\/css\/chrome\.css\?v=1\.0\.2">/);
    assert.match(html, /<link rel="stylesheet" href="\/css\/posts\.css\?v=1\.0\.2">/);
    assert.match(html, /<style>\n\.page-hero\{padding:64px;\}\n<\/style>/);
    assert.match(html, /<script type="application\/ld\+json">\n\{"@context":"https:\/\/schema\.org","@type":"ContactPage","name":"Contact"\}\n<\/script>/);
    assert.match(html, /<a href="#main" class="skip-link">Skip to main content<\/a>/);
    assert.match(html, /<main id="main"><h1>Contact<\/h1><\/main>/);
    assert.match(html, /<\/body>\n<\/html>\n$/);
  });

  it('escapes HTML-sensitive characters in metadata fields', () => {
    const html = generateBoilerplate(
      'Rooms & Rates <test>',
      'Book direct & save "today"',
      'https://example.com/rooms/?q=a&b=c',
      'https://example.com/rooms/',
      '<main id="main"></main>',
      [],
      '',
      '',
      DEFAULT_OG_IMAGE,
      DEFAULT_OG_IMAGE_ALT,
    );

    assert.match(html, /<title>Rooms &amp; Rates &lt;test&gt;<\/title>/);
    assert.match(html, /content="Book direct &amp; save &quot;today&quot;"/);
    assert.match(html, /href="https:\/\/example\.com\/rooms\/\?q=a&amp;b=c"/);
  });
});
