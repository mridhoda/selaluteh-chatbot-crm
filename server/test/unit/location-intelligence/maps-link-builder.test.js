import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPlaceLink, buildDirectionsLink } from '../../../src/services/location-intelligence/maps-link-builder.js';

describe('MapsLinkBuilder — Section 15', () => {
  it('builds place link from canonical URI', () => {
    const link = buildPlaceLink({ googleMapsUri: 'https://maps.google.com/?q=-0.5,117' });
    assert.equal(link, 'https://maps.google.com/?q=-0.5,117');
  });

  it('builds fallback from coordinates', () => {
    const link = buildPlaceLink({ latitude: -0.502106, longitude: 117.153709 });
    assert.ok(link.includes('-0.502106'));
    assert.ok(link.includes('117.153709'));
    assert.ok(!link.includes('key='));
  });

  it('directions link contains origin and destination', () => {
    const link = buildDirectionsLink({ latitude: -0.5, longitude: 117 }, { latitude: -0.51, longitude: 117.15 });
    assert.ok(link.includes('origin=-0.5'));
    assert.ok(link.includes('destination=-0.51'));
  });

  it('directions link includes travel mode', () => {
    const link = buildDirectionsLink({ latitude: -0.5, longitude: 117 }, { latitude: -0.51, longitude: 117.15 }, 'walking');
    assert.ok(link.includes('travelmode=walking'));
  });

  it('no API key in links', () => {
    const link = buildPlaceLink({ latitude: -0.5, longitude: 117 });
    assert.ok(!link.includes('key='));
  });
});
