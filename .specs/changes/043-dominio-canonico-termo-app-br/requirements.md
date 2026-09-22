# Requisitos — Change 043

## Funcionais

- [ ] Inventariar DNS, Vercel e domínio, em leitura, antes de qualquer mudança.
- [ ] Validar as rotas públicas, app, busca, simuladores, APIs e autenticação em
  `termo.app.br` e no domínio Vercel.
- [ ] Configurar uma única direção de redirecionamento permanente somente após
  aprovação do inventário.
- [ ] Atualizar referências canônicas coerentemente e sem URLs mistas.
- [ ] Verificar/adicionar a propriedade de domínio apropriada no Search Console
  e preservar a propriedade histórica Vercel para acompanhamento.
- [ ] Atualizar a URL final da campanha Ads apenas após a rota pública funcionar.

## Rota planejada

- Classe da tarefa: migração de domínio, SEO, hospedagem e telemetria.
- Modelo: `gpt-5.6-sol` / `high`.
- Justificativa: mudança transversal, reversibilidade limitada e risco de
  regressão em SEO, autenticação e URLs publicadas.
- Fallback: `gpt-5.6-terra / high`.
- Escalonar se houver DNS não gerenciável, conflito de domínio ou rota privada.
