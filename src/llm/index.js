import { AzureOpenAIClient } from './azureOpenAi.js';
import { OpenAIClient } from './openAi.js';
import { MockLLM } from './mockLlm.js';

/**
 * Selects the chat model from the environment, in priority order:
 *   1. Azure OpenAI (your Foundry project)  2. OpenAI  3. deterministic MockLLM.
 */
export function createLLM(env = process.env) {
  if (env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY) {
    return new AzureOpenAIClient({
      endpoint: env.AZURE_OPENAI_ENDPOINT,
      apiKey: env.AZURE_OPENAI_API_KEY,
      deployment: env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: env.AZURE_OPENAI_API_VERSION
    });
  }
  if (env.OPENAI_API_KEY) {
    return new OpenAIClient({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL });
  }
  return new MockLLM();
}

export { AzureOpenAIClient, OpenAIClient, MockLLM };
