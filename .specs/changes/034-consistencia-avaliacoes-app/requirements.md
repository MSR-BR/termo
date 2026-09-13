# Requisitos — Change 034

- [x] Exigir sessão Supabase válida para consultar ou enviar a avaliação.
- [x] Validar a sessão no servidor, sem confiar em identidade fornecida pelo navegador.
- [x] Derivar no servidor um HMAC estável do `user.id`, sem armazenar nome, e-mail ou o identificador bruto.
- [x] Reutilizar a unicidade de `app_ratings.visitor_hash` para deduplicar entre domínios e dispositivos.
- [x] Disponibilizar uma consulta individual de estado que revele somente se a própria conta já avaliou.
- [x] Preservar listagem e exclusão administrativas para `marioreis@id.uff.br`.
- [x] Não expor a tabela aos papéis `anon` ou `authenticated`.
- [x] Não criar migração quando o contrato de banco atual já for suficiente.
- [x] Não mostrar o diálogo para visitante sem login nem quando a consulta de estado falhar.
- [x] Registrar intervalo local de uma hora após falha de envio.
- [x] Preservar critérios atuais de retorno, adiamento, acessibilidade e eventos analíticos.
- [x] Atualizar a política de privacidade e remover a afirmação de anonimato do diálogo.
