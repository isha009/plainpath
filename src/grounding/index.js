import { LocalKnowledgeSource } from './localKnowledgeSource.js';
import { FoundryIQKnowledgeSource } from './foundryIqKnowledgeSource.js';

/**
 * Selects the knowledge source from the environment.
 * - If FOUNDRY_IQ_ENDPOINT + FOUNDRY_IQ_API_KEY are set -> live Foundry IQ.
 * - Otherwise -> offline LocalKnowledgeSource (same interface).
 *
 * This is the seam that lets us build and demo before Azure is provisioned,
 * then light up the real IQ layer by filling in two env vars.
 */
export function createKnowledgeSource(env = process.env) {
  if (env.FOUNDRY_IQ_ENDPOINT && env.FOUNDRY_IQ_API_KEY) {
    return new FoundryIQKnowledgeSource({
      endpoint: env.FOUNDRY_IQ_ENDPOINT,
      apiKey: env.FOUNDRY_IQ_API_KEY,
      index: env.FOUNDRY_IQ_INDEX,
      semantic: String(env.FOUNDRY_IQ_SEMANTIC).toLowerCase() === 'true'
    });
  }
  return new LocalKnowledgeSource();
}

export { LocalKnowledgeSource, FoundryIQKnowledgeSource };
