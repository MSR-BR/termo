# Requisitos — Change 048

## Funcionais

- [ ] Confirmar que a consulta usa a autorização administrativa server-side já existente.
- [ ] Retornar apenas total, média, distribuição 1–5 e quantidade com comentário.
- [ ] Proibir nomes, e-mails, hashes, datas individuais, página e texto de feedback.
- [ ] Registrar ausência de dados como ausência, sem estimativa.
- [ ] Não alterar schema ou política sem uma Change nova e autorização explícita.

## Rota planejada

- Classe da tarefa: consulta protegida de agregado de satisfação.
- Modelo: `gpt-5.6-sol / high`.
- Justificativa: toca um recurso suportado por Supabase e exige preservar RLS,
  autorização e privacidade estrita.
- Fallback: `gpt-5.6-terra / high`.
- Dependência: acesso administrativo válido do usuário, em modo consulta.
