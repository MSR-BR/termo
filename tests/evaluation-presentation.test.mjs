import test from "node:test";
import assert from "node:assert/strict";
import { evaluationModel, renderEvaluationReport, evaluationDate } from "../assets/termo-evaluation-report.js";

function fixture() {
  return {
    window: { days: 28, since: "2026-09-10T15:00:00Z" }, generatedAt: "2026-10-08T15:00:00Z",
    learning: { attempts: { value: 0, display: "0" }, averageObservedScore: null },
    dataQuality: { sources: Object.fromEntries(["learningLedger", "assessmentAttempts", "behaviorTelemetry", "experience", "communicationPreferences", "deliveryAudit"].map(x => [x, { ok: true, rows: { value: 0, display: "0" }, truncated: false }])) }
  };
}
test("zero, missing source and protected small count remain distinct", () => {
  const report = fixture();
  assert.equal(evaluationModel(report).metric("assessmentAttempts", report.learning.attempts), "0");
  assert.match(evaluationModel(report).facts.join(" "), /Não foram encontradas tentativas/);
  report.dataQuality.sources.assessmentAttempts.ok = false;
  assert.equal(evaluationModel(report).metric("assessmentAttempts", report.learning.attempts), "Indisponível");
  assert.doesNotMatch(evaluationModel(report).facts.join(" "), /Não foram encontradas tentativas/);
  report.dataQuality.sources.assessmentAttempts.ok = true;
  report.learning.attempts = { value: null, display: "<5", suppressed: true };
  assert.equal(evaluationModel(report).metric("assessmentAttempts", report.learning.attempts), "<5");
  assert.match(evaluationModel(report).facts.join(" "), /quantidade exata fica oculta/);
});
test("limited sources are not called complete totals; no invented trend or learning gain", () => {
  const report = fixture();
  report.dataQuality.sources.assessmentAttempts.truncated = true;
  report.learning.attempts = { value: 10000, display: "10000" };
  report.learning.averageObservedScore = 80;
  const html = renderEvaluationReport(report);
  assert.match(html, /não o total do período/);
  assert.match(html, /80 %/);
  assert.match(html, /não informa crescimento ou queda/);
  assert.match(html, /não provam que o app causou aprendizagem/);
  assert.match(html, /não consulta o Google Analytics nem o Google Ads/);
  assert.match(html, /situação atual, fora dessa janela/);
});
test("no percent from null, no raw internal codes, dynamic labels are escaped", () => {
  const report = fixture();
  report.fidelity = { mechanics: [{ label: '<img src=x onerror="alert(1)">', stages: { action: { status: "available", count: { display: "<5" } } } }] };
  const html = renderEvaluationReport(report);
  assert.doesNotMatch(html, /Indisponível%|null%|<img|assessmentAttempts|>available</);
  assert.match(html, /&lt;img/);
  assert.match(html, /Atividade realizada/);
  report.dataQuality.sources.learningLedger.ok = false;
  assert.match(renderEvaluationReport(report), /Contagens ocultadas/);
});
test("dates use Brasilia, absent timestamps are never invented", () => {
  assert.match(evaluationDate("2026-10-08T15:00:00Z"), /08\/10\/2026.*12:00:00/);
  assert.equal(evaluationDate(undefined), "horário não informado");
});
