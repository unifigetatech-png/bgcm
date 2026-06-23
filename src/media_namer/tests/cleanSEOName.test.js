import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanSEOName, GEO_ANCHOR } from '../cleanSEOName.js';
import { hasBannedTerm, BANNED_TERMS } from '../bannedTerms.js';

describe('cleanSEOName', () => {
  it('lowercases, hyphenates, and strips invalid characters', () => {
    assert.equal(
      cleanSEOName('Couple Cycling Burleigh Headland!', GEO_ANCHOR),
      'couple-cycling-burleigh-headland',
    );
  });

  it('appends the geo anchor when burleigh and motel are absent', () => {
    assert.equal(
      cleanSEOName('Pacific Fair Shopping Centre', GEO_ANCHOR),
      `pacific-fair-shopping-centre-${GEO_ANCHOR}`,
    );
  });

  it('does not append the geo anchor when motel is already present', () => {
    assert.equal(
      cleanSEOName('motel-pool-aerial-view', GEO_ANCHOR),
      'motel-pool-aerial-view',
    );
  });
});

describe('hasBannedTerm', () => {
  it('detects banned marketing terms in filenames', () => {
    assert.equal(hasBannedTerm('room-with-kitchenette.jpg', BANNED_TERMS), true);
    assert.equal(hasBannedTerm('family-room-smart-tv.jpg', BANNED_TERMS), true);
    assert.equal(hasBannedTerm('pool-area-bbq-zone.jpg', BANNED_TERMS), true);
    assert.equal(hasBannedTerm('burleigh-beach-sunset.jpg', BANNED_TERMS), false);
  });
});
