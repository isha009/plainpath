import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseSource } from './chunk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = path.resolve(__dirname, '../../data/sources');

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'are', 'for', 'on',
  'with', 'as', 'at', 'by', 'be', 'can', 'my', 'i', 'it', 'this', 'that',
  'what', 'how', 'do', 'does', 'if', 'when', 'should', 'would', 'will', 'me',
  'you', 'your', 'they', 'their', 'has', 'have', 'from', 'about', 'not'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Offline stand-in for Foundry IQ. Loads the source documents, splits them into
 * cited passages, and scores them against a query with TF-IDF-weighted term
 * overlap. Implements the same `retrieve` contract as FoundryIQKnowledgeSource,
 * so the agent cannot tell which one it is talking to.
 */
export class LocalKnowledgeSource {
  constructor() {
    this.passages = [];
    this.df = new Map(); // document frequency per term
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    const files = (await readdir(SOURCES_DIR)).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const raw = await readFile(path.join(SOURCES_DIR, file), 'utf8');
      this.#ingest(raw, file);
    }
    // Build document frequency over passages for TF-IDF weighting.
    for (const p of this.passages) {
      for (const term of new Set(p.terms)) {
        this.df.set(term, (this.df.get(term) || 0) + 1);
      }
    }
    this.ready = true;
  }

  #ingest(raw, file) {
    const { sourceTitle, sourceUrl, passages } = parseSource(raw, file);
    for (const p of passages) {
      this.passages.push({
        id: p.id,
        sourceTitle,
        section: p.section,
        sourceUrl,
        text: p.text,
        terms: tokenize(p.text)
      });
    }
  }

  #score(queryTerms, passage) {
    const total = this.passages.length;
    const tf = new Map();
    for (const t of passage.terms) tf.set(t, (tf.get(t) || 0) + 1);
    let score = 0;
    for (const q of queryTerms) {
      const termFreq = tf.get(q);
      if (!termFreq) continue;
      const idf = Math.log((total + 1) / ((this.df.get(q) || 0) + 1)) + 1;
      score += (termFreq / passage.terms.length) * idf;
    }
    return score;
  }

  /**
   * @param {string} query
   * @param {{ topK?: number }} [opts]
   * @returns {Promise<Array<{id,sourceTitle,section,sourceUrl,text,score}>>}
   */
  async retrieve(query, { topK = 4 } = {}) {
    await this.init();
    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];
    const scored = this.passages
      .map((p) => ({ ...p, score: this.#score(queryTerms, p) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    // Normalize scores to 0..1 against the best hit so thresholds are stable.
    const max = scored.length ? scored[0].score : 1;
    return scored.slice(0, topK).map((p) => ({
      id: p.id,
      sourceTitle: p.sourceTitle,
      section: p.section,
      sourceUrl: p.sourceUrl,
      text: p.text,
      score: Number((p.score / max).toFixed(3))
    }));
  }

  describe() {
    return 'LocalKnowledgeSource (offline mock of Foundry IQ)';
  }
}
