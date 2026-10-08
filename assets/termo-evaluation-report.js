// Presentation only: the existing admin API remains the authority for access and aggregation.
const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const SOURCE_LABELS = {
  learningLedger: "Atividades de estudo e recompensas",
  assessmentAttempts: "Tentativas de exercícios e simulados",
  behaviorTelemetry: "Navegação registrada no TERMO",
  experience: "Avaliações do aplicativo",
  communicationPreferences: "Preferências de e-mail (situação atual)",
  deliveryAudit: "Histórico de entregas de e-mail"
};
const STAGE_LABELS = {
  eligibility: "Quem pode participar", exposure: "Acesso ao recurso", action: "Atividade realizada",
  reward: "Recompensa registrada", duplicate_suppression: "Proteção contra repetição", opt_out: "Opção de não participar"
};
const STATUS_LABELS = {
  derived: "Definido por regras, não contado", available: "Registrado", observed: "Registrado",
  partial: "Registro parcial", unavailable: "Ainda não medido", not_applicable: "Não se aplica",
  enforced: "Proteção prevista; não é uma contagem"
};

export function evaluationDate(value) {
  const date = value ? new Date(value) : new Date(NaN);
  return Number.isNaN(date.getTime()) ? "horário não informado" : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo"
  }).format(date);
}

export function evaluationModel(report) {
  const sources = report?.dataQuality?.sources || {};
  const ready = name => sources[name]?.ok === true;
  const metric = (name, value) => {
    if (!ready(name) || value == null) return "Indisponível";
    if (typeof value === "object") return value.display == null ? "Indisponível" : String(value.display);
    return String(value);
  };
  const averages = (name, value, unit) => ready(name) && typeof value === "number" && Number.isFinite(value)
    ? `${value.toLocaleString("pt-BR")} ${unit}` : "Indisponível (sem leitura válida ou quantidade suficiente)";
  const expected = Object.keys(SOURCE_LABELS);
  const failed = expected.filter(name => !ready(name));
  const limited = expected.filter(name => sources[name]?.truncated);
  const facts = [];
  const actions = [];
  if (failed.length) {
    facts.push("A leitura está incompleta: uma ou mais fontes não puderam ser confirmadas. Isso não significa que não houve atividade.");
    actions.push("Tente Atualizar. Se a falha continuar, confira a seção de fontes abaixo antes de tomar decisões.");
  }
  if (limited.length) {
    facts.push("Uma ou mais fontes atingiram o limite de leitura. Seus números representam apenas o recorte retornado, não o total do período.");
    actions.push("Antes de divulgar totais ou médias, obtenha uma consulta completa das fontes limitadas.");
  }
  const attempts = report?.learning?.attempts;
  if (ready("assessmentAttempts")) {
    if (attempts?.suppressed || attempts?.display === "<5") {
      facts.push("Há poucas tentativas registradas; a quantidade exata fica oculta para proteger a privacidade.");
      actions.push("Continue acompanhando o uso antes de tirar conclusões sobre o desempenho dos estudantes.");
    } else if (attempts?.value === 0) {
      facts.push("Não foram encontradas tentativas nesta consulta. Isso não prova que ninguém leu o livro.");
      actions.push("Confira se os leitores estão chegando aos exercícios; valide o registro dessas atividades antes de mudar a divulgação.");
    } else if (Number.isFinite(attempts?.value) && attempts.value > 0) {
      facts.push("Existem tentativas registradas. A mesma pessoa pode realizar várias; a contagem não representa estudantes diferentes.");
      actions.push("Use os resultados para orientar uma revisão dos exercícios, sem anunciar ganho de aprendizagem apenas com esta média.");
    }
  }
  if (ready("experience")) {
    facts.push("As avaliações são voluntárias e refletem quem respondeu, não necessariamente todos os leitores.");
  }
  facts.push("Este relatório não compara com os 28 dias anteriores: ele não informa crescimento ou queda.");
  if (!actions.length) actions.push("Confira a disponibilidade das fontes e acompanhe os próximos registros antes de decidir mudanças.");
  return { sources, ready, metric, averages, facts, actions, failed, limited };
}

export function renderEvaluationReport(report) {
  const model = evaluationModel(report);
  const { metric, averages } = model;
  const number = (source, value) => escape(metric(source, value));
  const list = items => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join("")}</ul>`;
  const table = (label, headers, rows) => `<div class="evaluation-table-wrap" tabindex="0" role="region" aria-label="${escape(label)} — tabela com rolagem horizontal"><table class="evaluation-table"><thead><tr>${headers.map(x => `<th scope="col">${escape(x)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const card = (source, value, label, note) => `<article><strong>${number(source, value)}</strong><span>${escape(label)}</span><p>${escape(note)}${model.sources[source]?.truncated ? " Leitura limitada: não é o total." : ""}</p></article>`;
  const mechanics = Array.isArray(report?.fidelity?.mechanics) ? report.fidelity.mechanics : [];
  // Conservative guard: do not present a derived zero when any contributing source failed.
  const mechanicsReady = ["learningLedger", "assessmentAttempts", "behaviorTelemetry"].every(model.ready);
  return `
    <section class="evaluation-section">
      <h3>De onde vêm os números?</h3>
      <p>Registros internos do TERMO, consultados no Supabase. <strong>Este painel não consulta o Google Analytics nem o Google Ads.</strong></p>
      <p>Atividades e avaliações: últimos ${escape(report?.window?.days ?? 28)} dias, de ${escape(evaluationDate(report?.window?.since))} até ${escape(evaluationDate(report?.generatedAt))} (Brasília). Preferências de e-mail: situação atual, fora dessa janela.</p>
      <p>Zero significa nenhum registro encontrado em uma leitura válida. “Indisponível” significa falta de informação. Valores como &lt;${escape(report?.privacy?.minimumCellSize ?? 5)} ocultam quantidades pequenas; não são zero. Esse limite protege a privacidade e não garante uma amostra representativa.</p>
    </section>
    <section class="evaluation-summary" aria-label="Resumo agregado">
      ${card("assessmentAttempts", report?.learning?.attempts, "Tentativas de exercícios e simulados", "Inclui os diferentes modos de prática; não são pessoas únicas.")}
      ${card("learningLedger", report?.learning?.independentRetrievals, "Registros de resposta sem ajuda", "Atividades classificadas como resposta independente, não quantidade de alunos.")}
      ${card("behaviorTelemetry", report?.behavior?.events, "Ações de navegação registradas", "Cliques e eventos; não são visitas nem usuários do GA4.")}
      ${card("experience", report?.experience?.ratings, "Avaliações do app", "Avaliações criadas ou atualizadas no período.")}
    </section>
    <div class="evaluation-sections">
      <section class="evaluation-section" aria-label="Relatório prático">
        <h3>O que podemos entender agora</h3>${list(model.facts)}
        <h3>Próximos passos sugeridos</h3>${list(model.actions)}
        <p>São sugestões para revisão, não ações automáticas. Atualizar não envia e-mails nem altera campanhas ou configurações.</p>
      </section>
      <section class="evaluation-section">
        <h3>Como foram as atividades</h3>
        <p><strong>Média das notas registradas:</strong> ${escape(averages("assessmentAttempts", report?.learning?.averageObservedScore, "%"))}.</p>
        <p>Cada tentativa com nota válida tem o mesmo peso. A média mistura modos de prática e pode incluir várias tentativas da mesma pessoa; não é uma nota média por estudante.${model.sources.assessmentAttempts?.truncated ? " A leitura desta fonte está limitada." : ""}</p>
        <p><strong>O que ainda não podemos concluir:</strong> estes dados não provam que o app causou aprendizagem. Faltam comparações equivalentes antes e depois, e verificações posteriores de retenção e aplicação em novas situações.</p>
        <p><strong>Média das avaliações voluntárias:</strong> ${escape(averages("experience", report?.experience?.averageRating, "de 5 estrelas"))}.${model.sources.experience?.truncated ? " Leitura limitada." : ""} Satisfação não mede aprendizagem.</p>
      </section>
      <section class="evaluation-section">
        <h3>Quais etapas conseguimos acompanhar</h3>
        <p>Esta tabela mostra o que já é registrado em cada recurso. “Ainda não medido” não significa defeito. Em telas pequenas, deslize a tabela para os lados ou use as setas após focá-la.</p>
        ${!mechanicsReady ? "<p>Contagens ocultadas nesta tabela porque uma fonte necessária não foi confirmada.</p>" : ""}
        ${table("Etapas dos recursos", ["Recurso", "Etapa", "O que sabemos", "Registros"], mechanics.map(mechanic => Object.entries(mechanic.stages || {}).map(([stage, value]) => `<tr><td>${escape(mechanic.label || "Recurso não identificado")}</td><td>${escape(STAGE_LABELS[stage] || "Etapa não identificada")}</td><td>${escape(STATUS_LABELS[value.status] || "Situação não identificada")}</td><td>${value.count == null ? "Não contado" : mechanicsReady ? escape(value.count.display ?? "Indisponível") : "Indisponível"}</td></tr>`).join("")).join(""))}
        ${["learningLedger", "assessmentAttempts", "behaviorTelemetry"].some(x => model.sources[x]?.truncated) ? "<p>Contagens limitadas ao recorte consultado.</p>" : ""}
      </section>
      <section class="evaluation-section">
        <h3>Preferências de e-mail hoje</h3>
        <p><strong>Autorizaram receber:</strong> ${number("communicationPreferences", report?.equitySafety?.optedIn)}. <strong>Pausa ativa:</strong> ${number("communicationPreferences", report?.equitySafety?.paused)}. <strong>Têm cancelamento registrado:</strong> ${number("communicationPreferences", report?.equitySafety?.optedOut)}.</p>
        <p>Os grupos podem se sobrepor: alguém pode ter cancelado e autorizado novamente. Não some essas quantidades. Autorizar não significa estar apto a receber agora; documentos vigentes, pausas e limites de envio são conferidos em “Preparar comunicação”.${model.sources.communicationPreferences?.truncated ? " Leitura limitada." : ""}</p>
      </section>
      <section class="evaluation-section">
        <h3>Conferência das fontes</h3>
        <p>Consulta limitada a até 10.000 registros por fonte. Uma leitura limitada pode afetar contagens e médias; atualizar não elimina esse limite.</p>
        ${table("Conferência das fontes", ["Informação", "Resultado da leitura", "Registros lidos"], Object.entries(SOURCE_LABELS).map(([name, label]) => `<tr><td>${escape(label)}</td><td>${!model.ready(name) ? "Não foi possível confirmar" : model.sources[name].truncated ? "Limitada — não representa o total" : "Leitura concluída"}</td><td>${number(name, model.sources[name]?.rows)}</td></tr>`).join(""))}
        <p>Não há contagem histórica completa das repetições bloqueadas. Não usamos este painel para afirmar ausência de problemas, vieses ou danos. Nenhum nome, e-mail ou resposta individual é exibido.</p>
      </section>
    </div>`;
}

export function mountEvaluationReport(root, requestReport) {
  const button = root.querySelector("[data-evaluation-refresh]");
  const status = root.querySelector("[data-evaluation-status]");
  const time = root.querySelector("[data-evaluation-time]");
  const content = root.querySelector("[data-evaluation-content]");
  let pending = false;
  let hasReport = false;
  async function refresh() {
    if (pending || !root.isConnected) return;
    pending = true;
    button.disabled = true;
    button.textContent = "Atualizando…";
    root.setAttribute("aria-busy", "true");
    status.textContent = "Consultando os registros do TERMO…";
    try {
      const report = await requestReport();
      if (!root.isConnected) return;
      // Reject malformed successes instead of replacing a valid report with empty data.
      if (!report?.dataQuality?.sources || !report?.window) throw new Error("invalid_report");
      content.innerHTML = renderEvaluationReport(report);
      hasReport = true;
      time.textContent = `Última consulta recebida: ${evaluationDate(report.generatedAt)} (Brasília). Não é o horário da última atividade.`;
      const incomplete = evaluationModel(report).failed.length > 0;
      status.textContent = incomplete ? "Consulta recebida com fontes indisponíveis. Veja as limitações abaixo." : "Relatório atualizado. Confira abaixo eventuais limites de leitura.";
    } catch (_) {
      if (!root.isConnected) return;
      status.textContent = hasReport
        ? "Não foi possível atualizar. Os dados anteriores continuam abaixo e podem estar desatualizados. Tente novamente."
        : "Não foi possível carregar o relatório. Confira sua conexão e sessão e clique em Atualizar para tentar novamente.";
    } finally {
      pending = false;
      if (root.isConnected) {
        button.disabled = false;
        button.textContent = "Atualizar";
        root.removeAttribute("aria-busy");
      }
    }
  }
  button.addEventListener("click", refresh);
  return refresh();
}
