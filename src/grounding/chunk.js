/**
 * Shared document parsing/chunking used by BOTH the offline LocalKnowledgeSource
 * and the Azure AI Search uploader (scripts/index-foundry.mjs), so the offline
 * mock and live Foundry IQ index contain identical passages.
 *
 * Convention per source file:
 *   line "# Title"            -> sourceTitle
 *   line "> Source: name url" -> sourceUrl
 *   each "## Heading" section -> one passage
 */
export function parseSource(raw, file) {
  const lines = raw.split('\n');
  const titleLine = lines.find((l) => l.startsWith('# ')) || `# ${file}`;
  const sourceLine = lines.find((l) => l.startsWith('> Source:')) || '';
  const sourceTitle = titleLine.replace(/^#\s+/, '').trim();
  const urlMatch = sourceLine.match(/https?:\/\/\S+/);
  const sourceUrl = urlMatch ? urlMatch[0] : '';

  const sections = raw.split(/\n(?=##\s)/);
  const passages = [];
  let idx = 0;
  for (const section of sections) {
    const heading = (section.match(/^##\s+(.*)$/m) || [])[1];
    if (!heading) continue;
    const body = section.replace(/^##\s+.*$/m, '').trim();
    if (!body) continue;
    passages.push({
      id: `${file}#${idx++}`,
      section: heading.trim(),
      text: `${heading.trim()}. ${body}`
    });
  }
  return { sourceTitle, sourceUrl, passages };
}
