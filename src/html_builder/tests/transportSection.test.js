import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateTransportSectionHtml,
  generateTransportSectionStyles,
  GOOGLE_MAPS_DESTINATION_URL,
  APPLE_MAPS_DESTINATION_URL,
  resolveMapIframeEmbedUrl,
} from '../transportSection.js';

describe('transportSection', () => {
  it('renders en-AU proximity copy with Miami One at 300m and billing-free map embed', () => {
    const html = generateTransportSectionHtml();

    assert.match(html, /Miami One Shopping Centre/);
    assert.match(html, /aria-label="300 metres">300 M</);
    assert.match(html, /Guaranteed Secure Parking/);
    assert.match(html, /Burleigh Beach Coastline/);
    assert.match(html, /aria-label="200 metres">200 M</);
    assert.match(html, new RegExp(`src="${resolveMapIframeEmbedUrl().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /class="map-embed-frame"/);
    assert.match(html, /map-embed-canvas/);
    assert.doesNotMatch(html, /1 MIN/);
    assert.doesNotMatch(html, /820 M/);
    assert.doesNotMatch(html, /AIzaSy/);
    assert.doesNotMatch(html, /src="https:\/\/google\.com"/);
  });

  it('uses canonical Google and Apple Maps destination anchors', () => {
    const html = generateTransportSectionHtml();

    assert.match(html, new RegExp(`href="${GOOGLE_MAPS_DESTINATION_URL}"`));
    assert.match(html, new RegExp(`href="${APPLE_MAPS_DESTINATION_URL}"`));
    assert.equal(GOOGLE_MAPS_DESTINATION_URL, 'https://maps.app.goo.gl/QBPRoi6ZRKDiuNxK7');
    assert.equal(APPLE_MAPS_DESTINATION_URL, 'https://maps.apple/p/.zKfYe_ArySuDA');
    assert.doesNotMatch(html, /href="https:\/\/goo\.gl"/);
    assert.doesNotMatch(html, /href="https:\/\/maps\.apple"/);
  });

  it('accepts Google My Maps iframe embed URL format', () => {
    const myMapsUrl = 'https://www.google.com/maps/d/embed?mid=exampleMapId';
    assert.match(myMapsUrl, /^https:\/\/www\.google\.com\/maps\//);
    assert.doesNotMatch(myMapsUrl, /^https:\/\/google\.com$/);
  });

  it('exports responsive layout styles for the transport split', () => {
    const styles = generateTransportSectionStyles();

    assert.match(styles, /\.transport-section-wrapper/);
    assert.match(styles, /\.map-visual-container iframe/);
    assert.match(styles, /\.btn-map-nav-apple/);
    assert.match(styles, /background:#103463/);
    assert.match(styles, /min-height:520px/);
  });
});
