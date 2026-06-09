/**
 * Non-Azure OpenAI fallback chat client. Activated by the factory when
 * OPENAI_API_KEY is set (and Azure is not). Returns parsed JSON when json:true.
 */
export class OpenAIClient {
  constructor({ apiKey, model }) {
    if (!apiKey) throw new Error('OpenAIClient requires apiKey');
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
  }

  async complete({ system, user, json = true }) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
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
      throw new Error(`OpenAI failed (${res.status}): ${detail}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return json ? JSON.parse(content) : { text: content };
  }

  describe() {
    return `OpenAIClient (model="${this.model}")`;
  }
}
