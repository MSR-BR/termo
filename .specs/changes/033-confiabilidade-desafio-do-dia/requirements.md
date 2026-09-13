# Requisitos — Change 033

## Funcionais

- [x] Reconhecer `daily-challenge` como modalidade própria.
- [x] Solicitar exatamente uma pergunta ao Gemini para essa modalidade.
- [x] Reduzir a variabilidade da geração e da correção matemática.
- [x] Manter a validação matemática fail-closed.
- [x] Usar contingência determinística para todos os capítulos elegíveis.
- [x] Derivar a contingência somente de itens publicados com URL física existente.
- [x] Excluir o capítulo 5 bloqueado.
- [x] Não expor o erro técnico do gerador na interface.
- [x] Oferecer nova tentativa com intervalo local de 60 segundos quando toda a requisição falhar.
- [x] Devolver falha de geração como `502`, não como conteúdo inexistente.
- [x] Registrar diagnóstico técnico seguro sem prompt, resposta, credencial ou dado pessoal.

## Segurança, privacidade e conteúdo

- [x] Preservar autenticação, token assinado do quiz e pontuação existentes.
- [x] Não alterar Supabase nem seus dados.
- [x] Não expor segredos, identidade do estudante, conteúdo privado ou resposta bruta do Gemini nos registros.
- [x] Não tornar conteúdo bloqueado elegível para IA.

## Rota planejada

- Classe da tarefa: arquitetura, depuração difícil e síntese com conteúdo educacional.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: a correção cruza geração Gemini, contrato matemático, API, token assinado, fallback editorial, interface e testes.
- Fallback permitido: `gpt-5.6-terra / high` se Sol estiver indisponível.
- Gatilhos de escalonamento: contrato matemático ainda falhar, capítulo bloqueado aparecer, token de contingência não puder ser submetido, ou testes de integração divergirem.
- Escalonamento de reasoning: `gpt-5.6-sol / xhigh` diante de falha persistente após um ciclo de correção.
- Fonte da disponibilidade: modelos anunciados pelo host Codex desta tarefa.
