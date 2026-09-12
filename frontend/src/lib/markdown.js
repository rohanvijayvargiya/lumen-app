function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A deliberately small markdown renderer — just enough for chat output:
 * fenced code blocks, inline code, bold, italic, bullet lines, headings,
 * line breaks, and LaTeX math passthrough for KaTeX to render afterward.
 * Not a full CommonMark implementation, but safe (HTML is escaped first)
 * and dependency-free.
 */
export function renderMarkdown(raw) {
  if (!raw) return "";

  // Protect LaTeX math blocks FIRST, before anything else touches the
  // text. This matters because math often spans multiple lines
  // (\[ ... \n ... \n \]) — if we let the later "turn every newline into
  // <br/>" step run on it first, the opening and closing delimiters end
  // up in separate, disconnected DOM text nodes, and KaTeX's renderer
  // (which matches delimiter pairs within a single text node) silently
  // fails to find the closing half. Keeping the whole block intact as
  // one placeholder — reinserted untouched at the very end — avoids that.
  const mathBlocks = [];
  let text = raw
    .replace(/\\\[[\s\S]*?\\\]/g, (m) => {
      mathBlocks.push(m);
      return `\u0000MATHBLOCK${mathBlocks.length - 1}\u0000`;
    })
    .replace(/\$\$[\s\S]*?\$\$/g, (m) => {
      mathBlocks.push(m);
      return `\u0000MATHBLOCK${mathBlocks.length - 1}\u0000`;
    })
    .replace(/\\\([\s\S]*?\\\)/g, (m) => {
      mathBlocks.push(m);
      return `\u0000MATHBLOCK${mathBlocks.length - 1}\u0000`;
    });

  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
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
  // Reinsert math as ONE unbroken text node (no <br/> inside it) so
  // KaTeX's delimiter matching can see the whole \[ ... \] pair at once.
  text = text.replace(
    /\u0000MATHBLOCK(\d+)\u0000/g,
    (_, i) => `<span class="md-math">${escapeHtml(mathBlocks[Number(i)])}</span>`
  );

  return text;
}
