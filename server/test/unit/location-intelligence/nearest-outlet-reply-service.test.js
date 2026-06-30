import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

import { outletLocationsRepository } from '../../../src/db/repositories/index.js';
import {
  buildNearestOutletReplyFromCoordinates,
  buildNearestOutletReplyFromText,
  formatNearestOutletReply,
  looksLikeCustomerLocationText,
} from '../../../src/services/location-intelligence/nearest-outlet-reply.service.js';

describe('nearest-outlet-reply.service', () => {
  it('builds nearest outlet reply from verified outlet locations', async () => {
    const listMock = mock.method(outletLocationsRepository, 'listVerifiedEligible', async () => ([
      {
        outletId: 'dirgahayu',
        displayName: 'Selalu Teh Dirgahayu',
        formattedAddress: 'Jl. Dirgahayu, Samarinda',
        latitude: -0.502106,
        longitude: 117.153709,
        status: 'VERIFIED',
      },
      {
        outletId: 'mangkurawang',
        displayName: 'Selalu Teh Mangkurawang',
        formattedAddress: 'Tenggarong',
        latitude: -0.4388,
        longitude: 116.9826,
        status: 'VERIFIED',
      },
    ]));

    const reply = await buildNearestOutletReplyFromCoordinates({
      workspaceId: 'workspace-1',
      latitude: -0.503,
      longitude: 117.154,
    });

    assert.equal(listMock.mock.callCount(), 1);
    assert.match(reply, /Selalu Teh Dirgahayu/);
    assert.match(reply, /Perkiraan jarak:/);
    assert.match(reply, /Share lokasi Google Maps: https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=-0\.502106,117\.153709/);
    assert.match(reply, /Mau saya pilih outlet ini/);
    assert.match(reply, /listkan seluruh outlet yang ada di sekitarmu/);
  });

  it('returns safe no-data message when no verified outlet exists', () => {
    const reply = formatNearestOutletReply({ recommendation: null, alternatives: [] });
    assert.match(reply, /belum ada outlet.*terverifikasi/i);
  });

  it('resolves text location like jelawat samarinda then recommends nearest outlet', async () => {
    mock.method(outletLocationsRepository, 'listVerifiedEligible', async () => ([
      {
        outletId: 'dirgahayu',
        displayName: 'Selalu Teh Dirgahayu',
        formattedAddress: 'Jl. Dirgahayu, Samarinda',
        latitude: -0.502106,
        longitude: 117.153709,
        status: 'VERIFIED',
      },
      {
        outletId: 'mangkurawang',
        displayName: 'Selalu Teh Mangkurawang',
        formattedAddress: 'Tenggarong',
        latitude: -0.4388,
        longitude: 116.9826,
        status: 'VERIFIED',
      },
    ]));

    const fakeProvider = {
      async geocodeText(input) {
        assert.match(input.query, /jelawat samarinda/i);
        return {
          status: 'RESOLVED',
          candidates: [{
            candidateId: 'fake-jelawat',
            provider: 'fake',
            label: 'Jalan Jelawat',
            formattedAddress: 'Jalan Jelawat, Samarinda, Indonesia',
            city: 'Samarinda',
            latitude: -0.506,
            longitude: 117.152,
            confidence: 'high',
            precision: 'street',
          }],
        };
      },
      async searchPlaces() { throw new Error('searchPlaces should not be called'); },
    };

    const reply = await buildNearestOutletReplyFromText({
      workspaceId: 'workspace-1',
      text: 'jelawat samarinda',
      provider: fakeProvider,
    });

    assert.match(reply, /Selalu Teh Dirgahayu/);
    assert.match(reply, /Mau saya pilih outlet ini/);
    assert.match(reply, /Share lokasi Google Maps:/);
  });

  it('falls back to outlet metadata when geocoder cannot resolve exact outlet address', async () => {
    mock.method(outletLocationsRepository, 'listVerifiedEligible', async () => ([
      {
        outletId: 'selkop-tenggarong',
        displayName: 'SELKOP Tenggarong',
        formattedAddress: 'Jl. K.H. Ahmad Muksin, Timbau, Tenggarong',
        latitude: -0.4290537805,
        longitude: 116.9944307,
        status: 'VERIFIED',
        googleMapsUri: 'https://maps.app.goo.gl/NoPBo7ezXJDe3FUd6',
      },
    ]));

    const fakeProvider = {
      async geocodeText() {
        return { status: 'NOT_FOUND', candidates: [] };
      },
      async searchPlaces() { throw new Error('searchPlaces should not be called'); },
    };

    const reply = await buildNearestOutletReplyFromText({
      workspaceId: 'workspace-kopi',
      text: 'jalan ahmad muksin tenggarong',
      provider: fakeProvider,
    });

    assert.match(reply, /SELKOP Tenggarong/);
    assert.match(reply, /https:\/\/maps\.app\.goo\.gl\/NoPBo7ezXJDe3FUd6/);
  });

  it('strips conversational prefix from customer address before resolving nearest outlet', async () => {
    mock.method(outletLocationsRepository, 'listVerifiedEligible', async () => ([
      {
        outletId: 'pramuka',
        displayName: 'Selalu Teh Pramuka',
        formattedAddress: 'Jl. Pramuka, Samarinda',
        latitude: -0.485,
        longitude: 117.145,
        status: 'VERIFIED',
      },
      {
        outletId: 'dirgahayu',
        displayName: 'Selalu Teh Dirgahayu',
        formattedAddress: 'Jl. Dirgahayu, Samarinda',
        latitude: -0.502106,
        longitude: 117.153709,
        status: 'VERIFIED',
      },
    ]));

    const fakeProvider = {
      async geocodeText(input) {
        assert.match(input.query, /^jalan pramuka samarinda/i);
        assert.doesNotMatch(input.query, /lokasi ku/i);
        return {
          status: 'RESOLVED',
          candidates: [{
            candidateId: 'fake-pramuka',
            provider: 'fake',
            label: 'Jalan Pramuka',
            formattedAddress: 'Jalan Pramuka, Samarinda, Indonesia',
            city: 'Samarinda',
            latitude: -0.4852,
            longitude: 117.1451,
            confidence: 'high',
            precision: 'street',
          }],
        };
      },
      async searchPlaces() { throw new Error('searchPlaces should not be called'); },
    };

    const reply = await buildNearestOutletReplyFromText({
      workspaceId: 'workspace-1',
      text: 'lokasi ku di jalan pramuka samarinda',
      provider: fakeProvider,
    });

    assert.match(reply, /Selalu Teh Pramuka/);
    assert.match(reply, /Mau saya pilih outlet ini/);
    assert.match(reply, /listkan seluruh outlet yang ada di sekitarmu/);
  });

  it('strips kalau/kalo aku di prefix and recommends Biawan for Jalan Jelawat Samarinda', async () => {
    mock.method(outletLocationsRepository, 'listVerifiedEligible', async () => ([
      {
        outletId: 'biawan',
        displayName: 'Selalu Teh - 30 Biawan',
        formattedAddress: 'Jl. Biawan No.8, Samarinda',
        latitude: -0.4967346872,
        longitude: 117.1617592,
        status: 'VERIFIED',
        googleMapsUri: 'https://maps.app.goo.gl/yk6XhgsENd7gdp3m6',
      },
      {
        outletId: 'lambung-mangkurat',
        displayName: 'Selalu Teh - 65 Lambung Mangkurat',
        formattedAddress: 'Jl. Lambung Mangkurat II, Samarinda',
        latitude: -0.4893954371,
        longitude: 117.1594414,
        status: 'VERIFIED',
        googleMapsUri: 'https://maps.app.goo.gl/rQ1iSh78fNDze6XF6',
      },
    ]));

    const fakeProvider = {
      async geocodeText(input) {
        assert.match(input.query, /^jalan jelawat samarinda/i);
        assert.doesNotMatch(input.query, /kalo aku/i);
        return {
          status: 'RESOLVED',
          candidates: [{
            candidateId: 'fake-jelawat',
            provider: 'fake',
            label: 'Jalan Jelawat',
            formattedAddress: 'Jalan Jelawat, Sidodamai, Samarinda Ilir, Samarinda, Indonesia',
            city: 'Samarinda',
            latitude: -0.5001511,
            longitude: 117.1598484,
            confidence: 'high',
            precision: 'street',
          }],
        };
      },
      async searchPlaces() { throw new Error('searchPlaces should not be called'); },
    };

    const reply = await buildNearestOutletReplyFromText({
      workspaceId: 'workspace-1',
      text: 'kalo aku di jalan jelawat samarinda',
      provider: fakeProvider,
    });

    assert.match(reply, /Selalu Teh - 30 Biawan/);
    assert.doesNotMatch(reply.split('\n').slice(0, 3).join('\n'), /Lambung Mangkurat/);
    assert.match(reply, /Share lokasi Google Maps: https:\/\/maps\.app\.goo\.gl\/yk6XhgsENd7gdp3m6/);
  });

  it('does not treat promo samarinda as a customer address', () => {
    assert.equal(looksLikeCustomerLocationText('promo samarinda'), false);
    assert.equal(looksLikeCustomerLocationText('jelawat samarinda'), true);
    assert.equal(looksLikeCustomerLocationText('Jl Jelawat Samarinda'), true);
    assert.equal(looksLikeCustomerLocationText('lokasi ku di jalan pramuka samarinda'), true);
  });
});
