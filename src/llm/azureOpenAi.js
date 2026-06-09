/**
 * Azure OpenAI chat client — the model deployed inside your Azure AI Foundry
 * project. Activated by the factory when AZURE_OPENAI_ENDPOINT +
 * AZURE_OPENAI_API_KEY are set. Returns parsed JSON when `json: true`.
 */
export class AzureOpenAIClient {
  constructor({ endpoint, apiKey, deployment, apiVersion }) {
    if (!endpoint || !apiKey) throw new Error('AzureOpenAIClient requires endpoint and apiKey');
    this.endpoint = endpoint.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.deployment = deployment || 'gpt-4o';
    this.apiVersion = apiVersion || '2024-08-01-preview';
  }

  async complete({ system, user, json = true }) {
    const url = `${this.endpoint}/openai/deployments/${encodeURIComponent(this.deployment)}/chat/completions?api-version=${this.apiVersion}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.1,
        ...(json ? { response_format: { type: 'json_object' } } : {})
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Azure OpenAI failed (${res.status}): ${detail}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return json ? JSON.parse(content) : { text: content };
  }

  describe() {
    return `AzureOpenAIClient (deployment="${this.deployment}")`;
  }
}
