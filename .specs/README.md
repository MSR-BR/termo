# TERMO Specs

Esta pasta guarda specs de produto e comportamento para iniciativas maiores do
TERMO.

Convenção canônica para novas iniciativas:

- uma pasta numerada por Change em `.specs/changes/NNN-slug/`;
- usar `.specs/changes/_template/` como estrutura inicial;
- conferir `.specs/changes/README.md` antes de escolher o próximo número;
- registrar objetivo, requisitos, tarefas, arquivos, critérios de aceite,
  validação, riscos, decisões e evidência de execução;
- separar a rota de modelo planejada da rota realmente observada;
- documentos compartilhados de arquitetura ou contratos ficam em
  `docs/architecture/`.

O diretório `changes/` permanece como histórico legado de planos e resultados.
Seus documentos existentes não devem ser migrados ou reescritos apenas para
adotar a nova estrutura.

Referência metodológica: consulte `TERMO_CHANGE_PROGRAM.md` e a referência
versionada registrada em `docs/governance/po-magico-reference.md`.

Quando usar:

- novas areas do produto;
- mudancas com impacto em dados, analytics, auth ou API;
- fluxos que precisem de implementacao em fases.

Quando nao usar:

- ajuste pequeno de copy;
- refactor local sem impacto de comportamento;
- correcoes pontuais sem mudanca de contrato.
