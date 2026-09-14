# Notas e decisões — Change 035

## Decisão humana vigente

Em 14/09/2026 foi decidido manter o repositório `MSR-BR/termo` público. A
privatização está suspensa por tempo indeterminado. Nenhum repositório de ponte
será criado, o GitHub Pages atual permanecerá em `main:/docs` e a visibilidade do
TERMO não será alterada. Retomar o programa exige uma nova autorização humana
explícita.

A auditoria continua válida. A exposição de arquivos internos pelo Vercel e a
ausência de autorização server-side no índice IA podem ser tratadas em uma T36
independente, sem privatizar o GitHub.

## Estado confirmado em 14/09/2026

- `MSR-BR/termo` é público, usa `main` e a conta atual possui permissão `admin`.
- O GitHub Pages está `built`, publica `main:/docs`, usa HTTPS e responde em
  `https://msr-br.github.io/termo/`.
- O repositório de site pessoal `MSR-BR/msr-br.github.io` não existe.
- O Vercel está ligado ao repositório pessoal `MSR-BR/termo`, branch `main`, no
  projeto `termo` do plano Hobby.
- Os aliases de produção incluem `termo.app.br` e `termo-theta.vercel.app`.
- A conta Vercel e o autor Git observados correspondem ao login GitHub `MSR-BR`.
- A permissão futura do GitHub App Vercel sobre o repositório privado não pôde
  ser consultada pela API disponível; deve ser confirmada antes do corte.

## Inventário de `docs/`

Há 22 arquivos rastreados.

| Classe | Arquivos | Destino |
|---|---:|---|
| ponte pública intencional | `.nojekyll`, `index.html`, `sitemap.xml` | permanecer no Pages atual |
| administrativo na interface | `exercicios-ia-indice-referencias.html` | manter restrito no menu; avaliar hardening de rota na T36 |
| arquitetura | cinco arquivos em `architecture/` | continuam visíveis no repositório público; T36 pode retirá-los do deploy |
| blueprints | três arquivos em `blueprints/` | continuam visíveis no repositório público; T36 pode retirá-los do deploy |
| divulgação | um arquivo em `divulgacao/` | continua visível no repositório público; T36 pode retirá-lo do deploy |
| governança | um arquivo em `governance/` | continua visível no repositório público; T36 pode retirá-lo do deploy |
| operação | oito arquivos em `operations/` | continuam visíveis no repositório público; T36 pode retirá-los do deploy |

O arquivo `.nojekyll` faz o GitHub Pages copiar os arquivos sem processamento.
As URLs diretas de Markdown e do notebook foram confirmadas com resposta `200`.

## Índice IA administrativo

`CODEX_CONTEXT.md` e `index.html` confirmam que o link foi desenhado para o
administrador `marioreis@id.uff.br`. O menu verifica a sessão e a lista de
validadores antes de exibi-lo. Entretanto, o arquivo gerado contém apenas
`<meta name="robots" content="noindex">`; não possui autorização server-side e
responde `200` anonimamente no GitHub Pages e nos dois domínios Vercel.

Decisão: o índice é administrativo na interface. `noindex` permanece útil contra
indexação acidental, mas não substitui autenticação. Como o repositório continuará
público, o arquivo rastreado também continuará legível pelo GitHub. Uma T36 pode
impedir a entrega casual pelas URLs do app e exigir sessão na interface, mas não
pode prometer confidencialidade enquanto o conteúdo ou suas fontes permanecerem
no repositório público.

## Exposição adicional confirmada no Vercel

O projeto usa a raiz como saída estática. Amostras de `lib/`, `scripts/`,
`tests/`, `supabase/`, `.specs/`, `docs/` e `CODEX_CONTEXT.md` responderam `200`
por URL pública. `.env` não é rastreado e `package.json`/`README.md` retornaram
`404`, mas essas exclusões parciais não constituem uma fronteira de publicação.

Conclusão: privatizar apenas o GitHub não protege o código já incluído no deploy.
T36 deve construir uma saída estática por allowlist, mantendo dependências de API
no bundle server-side e testando explicitamente que caminhos internos retornam
`404`.

## Plano originalmente proposto e agora suspenso

1. **T36 — Fronteira pública do Vercel e hardening administrativo** — permanece
   como melhoria de segurança independente, ainda não iniciada.
   (`gpt-5.6-sol / high`, fallback `gpt-5.6-terra / high`): criar build público
   por allowlist; preservar páginas e assets necessários; manter `api/` e suas
   dependências somente no servidor; substituir o arquivo estático do índice IA
   por acesso autenticado e autorizado; validar rotas públicas e negativas.
2. **T37 — Ponte GitHub Pages mínima** — suspensa e não criada.
   (`gpt-5.6-terra / high`, fallback `gpt-5.6-sol / high`): criar o repositório
   público `msr-br.github.io` e publicar somente `/termo/index.html`,
   `/termo/sitemap.xml` e os arquivos mínimos aprovados. Usar uma rota de prévia
   antes do corte e remover da ponte o link para o repositório que será privado.
3. **T38 — Corte técnico e SEO** — suspensa e não criada.
   (`gpt-5.6-sol / high`, fallback `gpt-5.6-terra / high`): confirmar que
   `https://msr-br.github.io/termo/` passa a ser servido pela ponte mínima,
   preservando o canonical atual para
   `https://termo-theta.vercel.app/home.html`, sitemap e links públicos.
4. **T39 — Privatização e verificação de deploy** — suspensa e não criada.
   (`gpt-5.6-sol / xhigh`, fallback `gpt-5.5 / xhigh`): confirmar o acesso do
   GitHub App Vercel, tornar `MSR-BR/termo` privado, testar um deployment
   controlado e verificar landing, app, APIs, domínios e ausência de arquivos
   internos públicos.
5. **T40 — Monitoramento pós-migração** — suspensa e não criada.
   (`gpt-5.6-terra / medium`, fallback `gpt-5.6-luna / medium`): conferir após
   7 e 30 dias indexação, Search Console, sitemap, erros 404 e URLs históricas.

## Decisões preservadas

- `home.html` continua sendo a landing principal.
- O canonical atual não muda neste programa; migrá-lo para `termo.app.br` exigiria
  uma Change editorial e de SEO separada.
- O app, seus capítulos publicados e simuladores continuam públicos.
- O capítulo 5 permanece bloqueado.
- O repositório TERMO permanece público com seu histórico e documentação. Uma
  eventual T36 pode reduzir os arquivos servidos pelo Vercel e pelo Pages, mas
  isso não torna confidencial o que continua rastreado no GitHub público.

## Referências externas verificadas

- GitHub Pages em repositórios privados depende de plano elegível; em GitHub Free,
  privatizar o repositório despublica o Pages atual:
  https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility
- Um site pessoal usa o repositório `<owner>.github.io` e pode servir a pasta
  `/termo/` no mesmo endereço histórico:
  https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- O Vercel admite repositórios privados pessoais em Hobby quando o autor do
  commit é o proprietário da equipe, mas a conexão Git precisa continuar
  autorizada:
  https://vercel.com/docs/git

## Status de publicação

- Commit funcional/documental: `c2c5002` (`docs: record suspended repository privacy plan`).
- Push: enviado a `origin/main` em 14/09/2026.
- Deploy Vercel: `dpl_F86MWMkts55dg5btVQws1TGrCMUb`, produção `Ready`, com
  aliases `termo.app.br` e `termo-theta.vercel.app`.
- GitHub Pages: build do commit `c2c5002` concluído como `built`.
- Mudanças remotas: somente push e publicações automáticas autorizadas pelo CPD;
  nenhuma configuração ou visibilidade foi alterada.
- Visibilidade do GitHub: permanece pública, sem alteração.
- Programa de privatização: suspenso por decisão humana em 14/09/2026.
