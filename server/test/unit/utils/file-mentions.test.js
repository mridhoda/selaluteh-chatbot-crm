import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { findDatabaseFileMention, findUrlFileMention } from '../../../src/utils/fileMentions.js';

describe('fileMentions', () => {
  const agent = {
    database: [
      {
        id: 'file-1',
        storedName: 'new-green-tea.jpg',
        originalName: 'new-green-tea.jpg',
      },
    ],
  };

  it('parses double-curly image format in database file mention', () => {
    const mention = findDatabaseFileMention(
      'Ini promonya ![{{format:image}}New Green Tea](new-green-tea.jpg)',
      agent,
    );

    assert.ok(mention);
    assert.equal(mention.format, 'image');
    assert.equal(mention.altText, 'New Green Tea');
    assert.equal(mention.file.storedName, 'new-green-tea.jpg');
  });

  it('parses double-curly image format in URL mention', () => {
    const mention = findUrlFileMention(
      'Ini promonya ![{{format:image}}New Green Tea](https://example.com/new-green-tea.jpg)',
    );

    assert.ok(mention);
    assert.equal(mention.format, 'image');
    assert.equal(mention.altText, 'New Green Tea');
    assert.equal(mention.url, 'https://example.com/new-green-tea.jpg');
  });
});