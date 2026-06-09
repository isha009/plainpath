import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalKnowledgeSource } from '../src/grounding/localKnowledgeSource.js';
import { createKnowledgeSource } from '../src/grounding/index.js';

test('LocalKnowledgeSource retrieves relevant deposit passages', async () => {
  const ks = new LocalKnowledgeSource();
  const hits = await ks.retrieve('Can my landlord keep my security deposit for normal wear and tear?');
  assert.ok(hits.length > 0, 'should return hits');
  assert.equal(hits[0].score, 1, 'top hit normalized to 1');
  assert.match(hits[0].sourceTitle, /Security Deposit/i);
});

test('LocalKnowledgeSource returns nothing for clearly off-topic queries', async () => {
  const ks = new LocalKnowledgeSource();
  const hits = await ks.retrieve('zzzzz qqqq xkcd nonsense token');
  assert.equal(hits.length, 0);
});

test('factory falls back to local source when Foundry IQ env is absent', () => {
  const ks = createKnowledgeSource({});
  assert.match(ks.describe(), /Local/);
});

test('factory selects Foundry IQ when env is present', () => {
  const ks = createKnowledgeSource({
    FOUNDRY_IQ_ENDPOINT: 'https://example.search.windows.net',
    FOUNDRY_IQ_API_KEY: 'k'
  });
  assert.match(ks.describe(), /FoundryIQ/);
});
