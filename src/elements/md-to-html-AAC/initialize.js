try {
  // Store initial state - converter will be created in update
  instance.data.currentStyle = "Default";
  instance.data.stylesheetIsSetup = false;
  instance.data.currentLatexEnabled = null; // Track latex state changes

  // Streaming: close a trailing code fence that is still open, and give a
  // table header without its delimiter row one, so partial replies render
  // as code and tables instead of raw text. Mirrors Showdown 2.1 fences:
  // the closer must repeat the opener and at least one line must sit between.
  instance.data.completeStreamingMarkdown = function (text) {
    const lines = text.split("\n");
    let open = null;
    for (let i = 0; i < lines.length; i++) {
      if (open) {
        if (lines[i].replace(/^ {0,3}/, "").startsWith(open.fence)) open = null;
      } else {
        const opener = /^ {0,3}(`{3,}|~{3,}) *([^\s`~]*)\s*$/.exec(lines[i]);
        if (opener) open = { fence: opener[1], line: i };
      }
    }

    if (open) {
      const body = lines.slice(open.line + 1);
      const last = body[body.length - 1];
      // "``" while the closing fence is still arriving
      if (body.length && last.trim() && new RegExp("^ {0,3}\\" + open.fence[0] + "+$").test(last)) body.pop();
      if (body.length && body[body.length - 1] === "") body.pop();
      const head = lines.slice(0, open.line + 1).join("\n");
      return head + "\n" + (body.length ? body.join("\n") : "") + "\n" + open.fence;
    }

    const rows = text.endsWith("\n") && !text.endsWith("\n\n") ? lines.slice(0, -1) : lines;
    const isRow = line => /^ {0,3}\|/.test(line || "");
    const isHeader = line => isRow(line) && /[^\s|:-]/.test(line);
    const isPartialDelimiter = line => isRow(line) && /^[\s|:-]*$/.test(line);
    const cells = line => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
    const delimiter = (header, partial) => "|" + cells(header).map((_, i) => {
      const cell = partial ? cells(partial)[i] : null;
      return cell && /^\s*:?-{3,}:?\s*$/.test(cell) ? cell : " --- ";
    }).join("|") + "|";
    const n = rows.length;
    if (isHeader(rows[n - 1]) && !isRow(rows[n - 2])) {
      return rows.concat(delimiter(rows[n - 1])).join("\n");
    }
    if (isPartialDelimiter(rows[n - 1]) && isHeader(rows[n - 2]) && !isRow(rows[n - 3])) {
      return rows.slice(0, -1).concat(delimiter(rows[n - 2], rows[n - 1])).join("\n");
    }
    return text;
  };

  // Highlight <pre><code> blocks in an HTML string. A template keeps images
  // and scripts inert while the blocks are highlighted.
  instance.data.highlightHtml = function (html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll("pre code").forEach(block => {
      try {
        hljs.highlightElement(block);
      } catch (error) {
        console.warn("Markdown Pro: could not highlight a code block", error);
      }
    });
    return template.innerHTML;
  };

  instance.data.convert = function () {
    const settings = instance.data.pending;
    let text = settings.markdown;
    if (settings.streaming && typeof text === "string") text = instance.data.completeStreamingMarkdown(text);

    let html = instance.data.converter.makeHtml(text);
    if (settings.autoHighlight && html) html = instance.data.highlightHtml(html);

    instance.publishState("html", html);

    if (settings.renderInElement) {
      if (!instance.data.output) {
        instance.data.output = document.createElement("div");
        instance.canvas[0].appendChild(instance.data.output);
      }
      const className = ("markdown-pro " + (settings.cssClass || "")).trim();
      if (instance.data.output.className !== className) instance.data.output.className = className;
      if (instance.data.renderedHtml !== html) {
        instance.data.output.innerHTML = html || "";
        instance.data.renderedHtml = html;
      }
    } else if (instance.data.output) {
      instance.data.output.remove();
      instance.data.output = null;
      instance.data.renderedHtml = null;
    }

    instance.triggerEvent("md_converted");
  };

  // Streaming: render at most once per frame. The timeout covers background
  // tabs, where requestAnimationFrame does not run.
  instance.data.scheduleConvert = function () {
    if (instance.data.scheduled) return;
    const run = () => {
      cancelAnimationFrame(instance.data.scheduled.frame);
      clearTimeout(instance.data.scheduled.timeout);
      instance.data.scheduled = null;
      instance.data.convert();
    };
    instance.data.scheduled = { frame: requestAnimationFrame(run), timeout: setTimeout(run, 100) };
  };

  instance.data.cancelScheduledConvert = function () {
    if (!instance.data.scheduled) return;
    cancelAnimationFrame(instance.data.scheduled.frame);
    clearTimeout(instance.data.scheduled.timeout);
    instance.data.scheduled = null;
  };
} catch (error) {
  console.error("error", error);
}
// test sa
// one more testyya
