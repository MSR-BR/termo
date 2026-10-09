(function (root) {
  "use strict";

  const APP_URL = "https://termo.app.br/";
  const MATHJAX_URL = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
  const MATHJAX_CONFIG = {
    tex: { inlineMath: [["\\(", "\\)"], ["$", "$"]], displayMath: [["\\[", "\\]"]] },
    svg: { fontCache: "local" }
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function safeCourseUrl(value) {
    try {
      const url = new URL(String(value || ""), APP_URL);
      return url.protocol === "https:" && url.hostname === "termo.app.br" ? url.href : APP_URL;
    } catch (_error) {
      return APP_URL;
    }
  }

  function buildPrintableExerciseHtml(exercise, options) {
    const item = exercise || {};
    const settings = options || {};
    const formatGeneratedText = typeof settings.formatGeneratedText === "function"
      ? settings.formatGeneratedText
      : function (value) { return `<p>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`; };
    const title = escapeHtml(item.exercise_title || "Exercício");
    const pageUrl = safeCourseUrl(settings.pageUrl);
    const itemLabel = escapeHtml(item.item_id || item.chapter_id || "Curso");
    const filename = `exercicio-${String(item.item_id || item.chapter_id || "curso").replace(/[^a-z0-9.-]+/gi, "-").toLowerCase()}`;
    const statement = formatGeneratedText(item.statement || "");
    const solution = formatGeneratedText(item.solution || "");

    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(filename)}</title>
  <style>
    @page { size: A4; margin: 17mm 16mm 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #21364d; background: #fff; font: 11pt/1.48 Georgia, "Times New Roman", serif; }
    main { max-width: 850px; margin: 0 auto; padding: 32px 28px 48px; }
    .book-header { border-bottom: 2px solid #004b87; padding-bottom: 13px; margin-bottom: 22px; }
    .book-title { margin: 0 0 4px; color: #004b87; font: 700 19pt/1.2 system-ui, sans-serif; }
    .book-author, .book-link { margin: 0; font: 10pt/1.4 system-ui, sans-serif; }
    a { color: #004b87; overflow-wrap: anywhere; }
    h1 { margin: 0 0 14px; color: #143b63; font: 700 16pt/1.25 system-ui, sans-serif; }
    h2 { margin: 23px 0 8px; color: #004b87; font: 700 12pt/1.3 system-ui, sans-serif; break-after: avoid; }
    p { margin: 0 0 10px; }
    .meta { padding: 12px 14px; border: 1px solid #d7e4ef; border-radius: 7px; background: #f7fafd; font: 9pt/1.5 system-ui, sans-serif; }
    .meta p { margin: 0 0 3px; }
    .meta p:last-child { margin-bottom: 0; }
    .notice { padding: 10px 13px; margin-top: 18px; border-left: 3px solid #ad4338; background: #fff8f6; font-size: 9pt; }
    .notice strong { display: block; margin-bottom: 4px; font-family: system-ui, sans-serif; }
    .exercise-content { overflow-wrap: break-word; }
    .exercise-content p { orphans: 2; widows: 2; }
    .termo-exercise__math-block { margin: 12px 0; text-align: center; break-inside: avoid; }
    mjx-container[display="true"] { max-width: 100%; margin: 12px auto !important; break-inside: avoid; }
    mjx-container[display="true"] svg { max-width: 100%; height: auto; }
    .print-tools { margin: 0 auto; max-width: 850px; padding: 18px 28px 0; font: 10pt/1.4 system-ui, sans-serif; }
    .print-tools button { margin-left: 12px; padding: 8px 14px; border: 1px solid #004b87; border-radius: 6px; color: #fff; background: #004b87; font: inherit; cursor: pointer; }
    .print-tools button:disabled { opacity: .5; cursor: wait; }
    .print-tools button:focus-visible { outline: 3px solid #b44a35; outline-offset: 3px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      main { max-width: none; padding: 0; }
      .print-tools { display: none; }
    }
  </style>
  <script>window.MathJax = ${JSON.stringify(MATHJAX_CONFIG)};<\/script>
  <script async src="${MATHJAX_URL}"><\/script>
  <script>
    window.addEventListener("load", function () {
      const status = document.getElementById("print-status");
      const button = document.getElementById("print-button");
      const mathJax = window.MathJax;
      if (!mathJax || !mathJax.startup || typeof mathJax.typesetPromise !== "function") {
        status.textContent = "As equações não puderam ser compostas. Verifique a conexão e recarregue esta página antes de salvar o PDF.";
        return;
      }
      mathJax.startup.promise
        .then(function () { return mathJax.typesetPromise([document.querySelector("main")]); })
        .then(function () { return document.fonts.ready; })
        .then(function () {
          status.textContent = "Equações prontas. Na impressão, escolha Salvar como PDF.";
          button.disabled = false;
          window.setTimeout(function () { window.print(); }, 300);
        })
        .catch(function () {
          status.textContent = "As equações não puderam ser compostas. Recarregue esta página antes de salvar o PDF.";
        });
    });
  <\/script>
</head>
<body>
  <div class="print-tools" role="status" aria-live="polite"><span id="print-status">Preparando as equações...</span><button id="print-button" type="button" disabled onclick="window.print()">Imprimir / Salvar PDF</button></div>
  <main>
    <header class="book-header">
      <p class="book-title">Termodinâmica para Estudantes de Física</p>
      <p class="book-author">Prof. Mario Reis</p>
      <p class="book-link"><a href="${APP_URL}">${APP_URL}</a></p>
    </header>
    <h1>${title}</h1>
    <div class="meta">
      <p><strong>Página:</strong> ${escapeHtml(item.page_title || "Página do curso")}</p>
      <p><strong>Capítulo/Item:</strong> ${itemLabel}</p>
      ${item.exercise_code ? `<p><strong>ID do exercício:</strong> ${escapeHtml(item.exercise_code)}</p>` : ""}
      <p><strong>Nível:</strong> ${escapeHtml(settings.difficultyLabel || "Médio")}</p>
      <p><strong>Link da página:</strong> <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
    </div>
    <p class="notice"><strong>Aviso sobre IA experimental</strong>Os exercícios e soluções foram gerados automaticamente por IA experimental e podem conter erros conceituais, matemáticos ou pedagógicos. O conteúdo didático do livro e das páginas é de autoria do Prof. Mario Reis (Instituto de Física — UFF).</p>
    <section aria-labelledby="statement-title"><h2 id="statement-title">Enunciado</h2><div class="exercise-content">${statement}</div></section>
    <section aria-labelledby="solution-title"><h2 id="solution-title">Solução</h2><div class="exercise-content">${solution}</div></section>
  </main>
</body>
</html>`;
  }

  function openExercisePdf(exercise, options) {
    const printWindow = root.open("", "_blank");
    if (!printWindow) throw new Error("O navegador bloqueou a janela de impressão.");
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(buildPrintableExerciseHtml(exercise, options));
    printWindow.document.close();
    return "print";
  }

  root.TermoExercisePdf = { buildPrintableExerciseHtml, openExercisePdf };
})(window);
