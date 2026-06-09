/**
 * Creates the Azure AI Search index that backs Foundry IQ and uploads the
 * tenant-rights documents into it — the same passages the offline mock uses.
 *
 * Run after filling .env:
 *   npm run index
 * (equivalently: node --env-file=.env scripts/index-foundry.mjs)
 *
 * Requires in .env:
 *   FOUNDRY_IQ_ENDPOINT   https://<your-search>.search.windows.net
 *   FOUNDRY_IQ_API_KEY    an ADMIN key (needed to create the index + upload)
 *   FOUNDRY_IQ_INDEX      defaults to "tenant-rights"
 *   FOUNDRY_IQ_SEMANTIC   "true" only if your Search tier is Basic+ (Free = leave unset)
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseSource } from '../src/grounding/chunk.js';

const API = '2024-07-01';
const endpoint = (process.env.FOUNDRY_IQ_ENDPOINT || '').replace(/\/$/, '');
const apiKey = process.env.FOUNDRY_IQ_API_KEY;
const indexName = process.env.FOUNDRY_IQ_INDEX || 'tenant-rights';
const semantic = String(process.env.FOUNDRY_IQ_SEMANTIC).toLowerCase() === 'true';

if (!endpoint || !apiKey) {
  console.error('✗ Set FOUNDRY_IQ_ENDPOINT and FOUNDRY_IQ_API_KEY (admin key) in .env first.');
  process.exit(1);
}

const headers = { 'Content-Type': 'application/json', 'api-key': apiKey };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = path.resolve(__dirname, '../data/sources');

// Azure Search keys allow only letters, digits, _ - =
const toKey = (s) => s.replace(/[^A-Za-z0-9_\-=]/g, '_');

const indexDefinition = {
  name: indexName,
  fields: [
    { name: 'id', type: 'Edm.String', key: true, filterable: true, searchable: false },
    { name: 'chunkId', type: 'Edm.String', searchable: false },
    { name: 'sourceTitle', type: 'Edm.String', searchable: true },
    { name: 'section', type: 'Edm.String', searchable: true },
    { name: 'sourceUrl', type: 'Edm.String', searchable: false },
    { name: 'text', type: 'Edm.String', searchable: true, analyzer: 'en.lucene' }
  ],
  ...(semantic && {
    semantic: {
      configurations: [
        {
          name: 'default',
          prioritizedFields: {
            titleField: { fieldName: 'sourceTitle' },
            prioritizedContentFields: [{ fieldName: 'text' }],
            prioritizedKeywordsFields: [{ fieldName: 'section' }]
          }
        }
      ]
    }
  })
};

async function createIndex() {
  const res = await fetch(`${endpoint}/indexes/${encodeURIComponent(indexName)}?api-version=${API}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(indexDefinition)
  });
  if (!res.ok) throw new Error(`Create index failed (${res.status}): ${await res.text()}`);
  console.log(`✓ Index "${indexName}" created/updated${semantic ? ' (semantic on)' : ''}.`);
}

async function buildDocs() {
  const files = (await readdir(SOURCES_DIR)).filter((f) => f.endsWith('.md'));
  const docs = [];
  for (const file of files) {
    const raw = await readFile(path.join(SOURCES_DIR, file), 'utf8');
    const { sourceTitle, sourceUrl, passages } = parseSource(raw, file);
    for (const p of passages) {
      docs.push({
        '@search.action': 'mergeOrUpload',
        id: toKey(p.id),
        chunkId: p.id,
        sourceTitle,
        section: p.section,
        sourceUrl,
        text: p.text
      });
    }
  }
  return docs;
}

async function upload(docs) {
  const res = await fetch(`${endpoint}/indexes/${encodeURIComponent(indexName)}/docs/index?api-version=${API}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ value: docs })
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  console.log(`✓ Uploaded ${docs.length} passages into "${indexName}".`);
}

try {
  await createIndex();
  const docs = await buildDocs();
  await upload(docs);
  console.log('\nDone. Set the same FOUNDRY_IQ_* vars for the app and run `npm start`.');
  console.log('The status bar should now read "live".');
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exit(1);
}
