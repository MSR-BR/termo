# TERMO Specs

Esta pasta guarda specs de produto e comportamento para iniciativas maiores do
TERMO.

Convencao proposta:

- uma pasta por iniciativa;
- `spec.md` com objetivo, escopo, requisitos e criterios de aceitacao;
- documentos de arquitetura ou contratos ficam em `docs/architecture/`;
- planos de execucao e rollout ficam em `changes/`.

Quando usar:

- novas areas do produto;
- mudancas com impacto em dados, analytics, auth ou API;
- fluxos que precisem de implementacao em fases.

Quando nao usar:

- ajuste pequeno de copy;
- refactor local sem impacto de comportamento;
- correcoes pontuais sem mudanca de contrato.
