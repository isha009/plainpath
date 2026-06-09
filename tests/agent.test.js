import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalKnowledgeSource } from '../src/grounding/localKnowledgeSource.js';
import { MockLLM } from '../src/llm/mockLlm.js';
import { PlainPathAgent } from '../src/agent/agent.js';

function makeAgent() {
  return new PlainPathAgent({ knowledge: new LocalKnowledgeSource(), llm: new MockLLM() });
}

test('answers a grounded question with citations', async () => {
  const agent = makeAgent();
  const steps = [];
  const res = await agent.ask('Can my landlord evict me by changing the locks?', {
    onStep: (s) => steps.push(s)
  });
  assert.equal(res.decision, 'answered');
  assert.ok(res.citations.length > 0, 'should cite at least one source');
  assert.ok(res.groundingScore > 0.12, 'grounding above threshold');
  // The reasoning loop must be visible.
  const stages = new Set(steps.map((s) => s.stage));
  assert.ok(stages.has('decompose') && stages.has('retrieve') && stages.has('decide'));
});

test('refuses an out-of-scope question instead of guessing', async () => {
  const agent = makeAgent();
  const res = await agent.ask('Can I get a discount on my parking ticket?');
  assert.equal(res.decision, 'refused');
  assert.equal(res.citations.length, 0);
});

test('agent forces refusal when nothing clears the grounding threshold', async () => {
  // An LLM that always tries to answer with a bogus citation.
  const overconfident = {
    describe: () => 'overconfident',
    async complete({ task }) {
      if (task === 'decompose') return { queries: ['unrelated gibberish zzzz'] };
      return {
        decision: 'answered',
        steps: [],
        answer: 'You definitely win. [1]',
        citations: ['does-not-exist#0']
      };
    }
  };
  const agent = new PlainPathAgent({ knowledge: new LocalKnowledgeSource(), llm: overconfident });
  const res = await agent.ask('qwzx nonsense not in any source');
  assert.equal(res.decision, 'refused', 'grounded-or-refuse guard must override the model');
  assert.equal(res.citations.length, 0);
});
