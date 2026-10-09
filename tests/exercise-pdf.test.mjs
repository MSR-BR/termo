import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../assets/termo-exercise-pdf.js", import.meta.url), "utf8");
const appHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

function loadExporter(open) {
  const window = { open };
  runInNewContext(source, { window, URL });
  return window.TermoExercisePdf;
}

const exercise = {
  exercise_title: "Análise da Equação de Van der Waals",
  page_title: "Equação de Estado de Van der Waals",
  item_id: "4.2",
  exercise_code: "EX-04-42-TESTE",
  statement: "Use \\(P + \\frac{a}{V_m^2}\\).",
  solution: "\\[P = \\frac{RT}{V_m-b} - \\frac{a}{V_m^2}\\]"
};

test("exportação apresenta livro, autor e endereço canônico sem duplicar o título", function () {
  const html = loadExporter().buildPrintableExerciseHtml(exercise, {
    pageUrl: "https://termo.app.br/slides/capitulo-04/page_2.html",
    difficultyLabel: "Médio"
  });

  assert.equal((html.match(/Termodinâmica para Estudantes de Física/g) || []).length, 1);
  assert.match(html, /Prof\. Mario Reis/);
  assert.match(html, /<a href="https:\/\/termo\.app\.br\/">https:\/\/termo\.app\.br\/<\/a>/);
  assert.match(html, /slides\/capitulo-04\/page_2\.html/);
  assert.match(html, /<h1>Análise da Equação de Van der Waals<\/h1>/);
  assert.match(html, /Aviso sobre IA experimental/);
  assert.match(html, /@page \{ size: A4/);
});

test("equações LaTeX são encaminhadas ao MathJax antes de imprimir", function () {
  const html = loadExporter().buildPrintableExerciseHtml(exercise);
  assert.match(html, /mathjax@3\/es5\/tex-svg\.js/);
  assert.match(html, /mathJax\.startup\.promise/);
  assert.match(html, /mathJax\.typesetPromise/);
  assert.match(html, /\\frac\{a\}\{V_m\^2\}/);
  assert.match(html, /button\.disabled = false;[\s\S]*window\.print\(\)/);
  assert.match(html, /As equações não puderam ser compostas/);
  assert.doesNotMatch(appHtml, /jspdf@2\.5\.1/);
  assert.match(appHtml, /assets\/termo-exercise-pdf\.js/);
});

test("texto e URL não confiáveis não geram HTML executável nem links externos", function () {
  const html = loadExporter().buildPrintableExerciseHtml({
    ...exercise,
    exercise_title: "<img src=x onerror=alert(1)>",
    statement: "<script>alert(1)</script>"
  }, { pageUrl: "javascript:alert(1)" });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test("abre janela sincronamente e informa quando o navegador a bloqueia", function () {
  let written = "";
  const popup = {
    document: {
      open() {},
      write(value) { written = value; },
      close() {}
    }
  };
  const exporter = loadExporter(function () { return popup; });
  assert.equal(exporter.openExercisePdf(exercise), "print");
  assert.match(written, /<h2 id="statement-title">Enunciado<\/h2>/);
  assert.equal(popup.opener, null);
  assert.throws(function () {
    loadExporter(function () { return null; }).openExercisePdf(exercise);
  }, /bloqueou a janela/);
});
