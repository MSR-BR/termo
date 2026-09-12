# Requisitos — Change 031

## Funcionais

- [x] Copiar o MP4 para uma pasta pública e estável do TERMO.
- [x] Exibir o vídeo na landing com controles nativos e sem autoplay.
- [x] Preservar a proporção vertical sem corte.
- [x] Fornecer capa, texto contextual e chamada para o app.
- [x] Manter a integração no gerador canônico de `home.html`.
- [x] Registrar o uso publicitário como decisão futura.

## Segurança, privacidade e conteúdo

- [x] Não coletar dados pessoais nem adicionar telemetria nesta Change.
- [x] Não alterar autenticação, Supabase, Gemini ou conteúdo editorial.
- [x] Não tornar conteúdo bloqueado elegível para busca, SEO ou IA.
- [x] Não inventar métricas, avaliações, depoimentos ou resultados didáticos.

## Rota planejada

- Classe da tarefa: integração visual de mídia pública em landing estática.
- Modelo: `gpt-5.6-terra`.
- Reasoning: `medium`.
- Justificativa: alteração delimitada em HTML/CSS, gerador SEO e acessibilidade.
- Fallback permitido: `gpt-5.6-sol / medium`.
- Gatilhos de escalonamento: regressão do gerador, falha de reprodução, quebra
  responsiva ou conflito com SEO.
- Fonte da disponibilidade: roadmap canônico do TERMO; rota real não exposta.
