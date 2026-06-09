const form = document.getElementById('ask-form');
const input = document.getElementById('question');
const askBtn = document.getElementById('ask-btn');
const statusEl = document.getElementById('status');
const reasoningSection = document.getElementById('reasoning-section');
const stepsEl = document.getElementById('steps');
const answerSection = document.getElementById('answer-section');
const decisionBadge = document.getElementById('decision-badge');
const meterFill = document.getElementById('meter-fill');
const groundingPct = document.getElementById('grounding-pct');
const answerText = document.getElementById('answer-text');
const citationsEl = document.getElementById('citations');
const disclaimerEl = document.getElementById('disclaimer');

const STAGE_LABEL = { decompose: 'Plan', retrieve: 'Search', reason: 'Reason', decide: 'Decide' };

// Show which backends are live so judges can see the Foundry IQ integration.
fetch('/api/health')
  .then((r) => r.json())
  .then((h) => {
    const live = !/mock/i.test(h.knowledge);
    statusEl.innerHTML =
      `knowledge: <span class="${live ? 'live' : 'mock'}">${h.knowledge}</span> · ` +
      `model: <span class="${/mock/i.test(h.llm) ? 'mock' : 'live'}">${h.llm}</span>`;
  })
  .catch(() => { statusEl.textContent = ''; });

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    input.value = chip.textContent;
    form.requestSubmit();
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (question) ask(question);
});

function ask(question) {
  askBtn.disabled = true;
  stepsEl.innerHTML = '';
  reasoningSection.hidden = false;
  answerSection.hidden = true;

  const es = new EventSource(`/api/ask?q=${encodeURIComponent(question)}`);

  es.addEventListener('step', (ev) => {
    const step = JSON.parse(ev.data);
    addStep(step);
  });

  es.addEventListener('result', (ev) => {
    renderResult(JSON.parse(ev.data));
    es.close();
    askBtn.disabled = false;
  });

  es.addEventListener('error', () => {
    addStep({ stage: 'decide', detail: 'Connection error — please try again.' });
    es.close();
    askBtn.disabled = false;
  });
}

function addStep({ stage, detail }) {
  const li = document.createElement('li');
  const tag = document.createElement('span');
  tag.className = 'stage';
  tag.textContent = STAGE_LABEL[stage] || stage;
  li.appendChild(tag);
  li.appendChild(document.createTextNode(detail));
  stepsEl.appendChild(li);
}

function renderResult(result) {
  answerSection.hidden = false;

  decisionBadge.className = `badge ${result.decision}`;
  decisionBadge.textContent =
    result.decision === 'answered' ? 'Answered from sources'
      : result.decision === 'partial' ? 'Partially answered'
      : 'Declined — not enough grounding';

  const pct = Math.round((result.groundingScore || 0) * 100);
  meterFill.style.width = `${pct}%`;
  meterFill.style.background = pct >= 50 ? 'var(--good)' : pct >= 20 ? 'var(--warn)' : 'var(--bad)';
  groundingPct.textContent = `${pct}%`;

  answerText.innerHTML = linkifyCitations(result.answer, result.citations);
  renderCitations(result.citations);
  disclaimerEl.textContent = result.disclaimer || '';

  answerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Turn [1], [2] markers into focusable buttons that jump to the source.
// Markers reference SOURCE numbers (n); only linkify ones we actually have.
function linkifyCitations(text, citations) {
  const nums = new Set(citations.map((c) => c.n));
  const escaped = text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return escaped.replace(/\[(\d+)\]/g, (m, n) => {
    if (!nums.has(Number(n))) return m;
    return `<button class="cite" data-n="${n}" aria-label="Jump to source ${n}">[${n}]</button>`;
  });
}

function renderCitations(citations) {
  citationsEl.innerHTML = '';
  if (!citations.length) return;
  citations.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'src';
    div.id = `src-${c.n}`;
    const title = `${c.sourceTitle} — ${c.section}`;
    const link = c.sourceUrl
      ? ` · <a href="${c.sourceUrl}" target="_blank" rel="noopener noreferrer">source</a>`
      : '';
    div.innerHTML = `<span class="num">[${c.n}]</span>${title} (grounding ${Math.round(c.score * 100)}%)${link}`;
    citationsEl.appendChild(div);
  });

  citationsEl.parentElement.querySelectorAll('.cite').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(`src-${btn.dataset.n}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.outline = '2px solid var(--accent)';
        setTimeout(() => { target.style.outline = ''; }, 1200);
      }
    });
  });
}
