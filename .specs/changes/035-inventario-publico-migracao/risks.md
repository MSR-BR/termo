# Riscos — Change 035

| Risco | Probabilidade/impacto | Controle proposto | Evidência esperada |
|---|---|---|---|
| privatizar o repositório e derrubar o Pages atual | alta/alto | migrar a ponte antes do corte | URL histórica responde `200` após o corte |
| acreditar que GitHub privado torna o deploy Vercel privado | alta/alto | criar artefato público por allowlist | código, testes, SQL e documentos internos retornam `404` |
| expor o índice IA administrativo por URL direta | confirmada/alto | remover do estático e exigir sessão + e-mail no servidor | acesso anônimo e não administrativo negado |
| quebrar deploy automático após privatização | média/alto | verificar acesso do GitHub App e executar teste controlado | commit autorizado produz deployment `READY` |
| perder sinais de SEO da ponte | baixa/médio | preservar URL e canonical atuais | canonical, sitemap e Search Console sem regressão |
| copiar documentos internos para o novo Pages | média/alto | repositório público mínimo e allowlist | somente arquivos aprovados estão acessíveis |
| tornar capítulo 5 descobrível durante a reorganização | baixa/alto | preservar registry e gates editoriais | capítulo 5 ausente de sitemap, busca e ponte |

## Riscos preservados caso a privatização seja retomada

- Vercel ainda entregar arquivos internos por URL.
- Índice IA continuar como arquivo estático público.
- Ponte substituta não responder no endereço histórico.
- Acesso do Vercel ao repositório privado não estar confirmado.
- Qualquer regressão em landing, app, APIs ou canonical.

## Estado da decisão

Esses riscos permanecem como memória da auditoria, mas não acionam trabalho
agora: a privatização foi suspensa em 14/09/2026.
