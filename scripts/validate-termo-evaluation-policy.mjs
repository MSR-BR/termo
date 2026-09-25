import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const POLICY_URL = new URL("data/termo-evaluation-communication-policy-v1.json", ROOT);
const REQUIRED_LAYERS = ["learning", "behavior", "experience", "fidelity", "equity_safety"];
const REQUIRED_STAGES = ["eligibility", "exposure", "action", "reward", "duplicate_suppression", "opt_out"];
const ALLOWED_STAGE_STATUS = new Set(["available", "derived", "partial", "enforced", "unavailable", "not_applicable"]);

export function validateEvaluationPolicy(policy) {
  const errors = [];
  if (policy?.version !== "1.0.0") errors.push("A política precisa declarar a versão 1.0.0.");
  const layerIds = new Set((policy?.layers || []).map(function (layer) { return layer.id; }));
  REQUIRED_LAYERS.forEach(function (id) {
    if (!layerIds.has(id)) errors.push(`Camada ausente: ${id}.`);
  });
  if (JSON.stringify(policy?.fidelityStages || []) !== JSON.stringify(REQUIRED_STAGES)) {
    errors.push("As seis etapas de fidelidade precisam estar declaradas na ordem canônica.");
  }
  (policy?.mechanics || []).forEach(function (mechanic) {
    REQUIRED_STAGES.forEach(function (stage) {
      if (!mechanic?.[stage]) errors.push(`${mechanic?.id || "Mecânica sem id"}: etapa ${stage} ausente.`);
      if (mechanic?.[stage] && !ALLOWED_STAGE_STATUS.has(mechanic[stage].status)) {
        errors.push(`${mechanic.id}: status inválido em ${stage}.`);
      }
    });
  });
  if (policy?.communication?.optInDefault !== false) errors.push("O opt-in de e-mail deve começar desligado.");
  if (policy?.communication?.productWorksWithoutMessages !== true) errors.push("O produto deve funcionar sem mensagens opcionais.");
  if (policy?.communication?.unsubscribeWithoutLogin !== true) errors.push("O descadastro sem login é obrigatório.");
  if (policy?.privacy?.ga4CanAwardPoints !== false) errors.push("GA4 não pode atribuir pontos.");
  if (policy?.privacy?.ga4CanSetMastery !== false) errors.push("GA4 não pode definir domínio.");
  if (policy?.researchPlan?.baseline?.required !== true) errors.push("O plano precisa exigir baseline.");
  if (policy?.researchPlan?.retention?.required !== true) errors.push("O plano precisa exigir retenção tardia.");
  if (policy?.researchPlan?.transfer?.required !== true) errors.push("O plano precisa exigir transferência em forma alterada.");
  return errors;
}

const policy = JSON.parse(await readFile(POLICY_URL, "utf8"));
const errors = validateEvaluationPolicy(policy);
if (errors.length) {
  errors.forEach(function (error) { console.error(`- ${error}`); });
  process.exitCode = 1;
} else {
  console.log(`Política de avaliação T54 válida: ${policy.mechanics.length} mecânicas, ${policy.layers.length} camadas.`);
}
