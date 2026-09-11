function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A deliberately small markdown renderer — just enough for chat output:
 * fenced code blocks, inline code, bold, italic, bullet lines, line breaks.
 * Not a full CommonMark implementation, but safe (HTML is escaped first)
 * and dependency-free.
 */
export function renderMarkdown(raw) {
  if (!raw) return "";

  const codeBlocks = [];
  let text = raw.replace(/```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(code.replace(/\n$/, ""));
    return `\u0000CODEBLOCK${codeBlocks.length - 1}\u0000`;
  });

  const inlineCodes = [];
  text = text.replace(/`([^`\n]+)`/g, (_, code) => {
    inlineCodes.push(code);
    return `\u0000INLINECODE${inlineCodes.length - 1}\u0000`;
  });

  text = escapeHtml(text);
  text = text.replace(/^### (.+)$/gm, '<h3 class="md-h">$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2 class="md-h">$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1 class="md-h">$1</h1>');
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/^- (.+)$/gm, "• $1");
  text = text.replace(/\n/g, "<br/>");

  text = text.replace(
    /\u0000INLINECODE(\d+)\u0000/g,
    (_, i) => `<code class="md-code">${escapeHtml(inlineCodes[Number(i)])}</code>`
  );
  text = text.replace(
    /\u0000CODEBLOCK(\d+)\u0000/g,
    (_, i) => `<pre class="md-pre"><code>${escapeHtml(codeBlocks[Number(i)])}</code></pre>`
  );

  return text;
}
