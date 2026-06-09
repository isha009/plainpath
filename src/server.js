import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createKnowledgeSource } from './grounding/index.js';
import { createLLM } from './llm/index.js';
import { PlainPathAgent } from './agent/agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const knowledge = createKnowledgeSource();
const llm = createLLM();
const agent = new PlainPathAgent({
  knowledge,
  llm,
  topK: Number(process.env.RETRIEVAL_TOP_K) || 4,
  minScore: Number(process.env.GROUNDING_MIN_SCORE) || 0.12
});

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../public')));

// Tells the UI which backends are live (Foundry IQ vs mock, real model vs mock).
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    knowledge: knowledge.describe?.() ?? 'unknown',
    llm: llm.describe?.() ?? 'unknown'
  });
});

// Streams the agent's reasoning steps to the browser as Server-Sent Events.
app.get('/api/ask', async (req, res) => {
  const question = (req.query.q || '').toString().trim();
  if (!question) {
    res.status(400).json({ error: 'Missing question (?q=)' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const result = await agent.ask(question, {
      onStep: (step) => send('step', step)
    });
    send('result', result);
  } catch (err) {
    send('error', { message: err.message });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`PlainPath running on http://localhost:${PORT}`);
  console.log(`  knowledge: ${knowledge.describe?.()}`);
  console.log(`  model:     ${llm.describe?.()}`);
});
