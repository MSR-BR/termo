# Change Plan: TERMO — melhorias após análise de GA4 e Google Ads

## Estado

**C6, C7, C8, a implantação do teste C9 e a preparação técnica da C10 foram
autorizadas e concluídas em 4 de setembro de 2026. O C9 permanece em observação
até 17 de setembro de 2026. A publicação da C10 aguarda autenticação da Vercel;
C11 a C13 continuam somente como propostas, sem autorização para execução.**

As changes serão revisadas pelo responsável e, se aprovadas, executadas uma a
uma. Qualquer alteração em produção, Google Ads, GA4, Supabase, LinkedIn ou
envio de e-mail exigirá autorização específica.

## Evidência de partida

Períodos consultados em 4 de setembro de 2026:

- GA4: 7 de agosto a 3 de setembro de 2026;
- Google Ads: 5 de agosto a 3 de setembro de 2026;
- comparação recente do Ads: 28 de agosto a 3 de setembro de 2026.

Principais sinais:

- 860 usuários ativos, alta de 108,7%;
- 980 sessões, 1.800 visualizações e 8.258 eventos;
- taxa de engajamento de 42,65% e 43 s por sessão;
- tempo por usuário caiu 13,5%, apesar do crescimento de tráfego;
- Pesquisa paga gerou 813 sessões, 83% do total;
- Busca orgânica gerou somente 10 sessões, 1% do total;
- Google Ads gerou 987 cliques, 52.572 impressões e custo de €99,13;
- CTR de 1,88% e CPC médio aproximado de €0,10;
- `study_activation` registrou 141 conversões e é a conversão primária;
- `chapter_start` registrou 135, `exercise_start` 21 e `login_success` 6;
- existe uma conversão inativa com URL duplicada: `/home.html/home.html`;
- há consultas potencialmente desalinhadas, como resistores, ondulatória,
  física quântica e alguns termos genéricos relacionados ao PhET.

## Ordem proposta

1. C6 — auditoria e correção da medição;
2. C7 — relatório do funil de estudo;
3. C8 — qualidade dos termos e estrutura do Google Ads;
4. C9 — melhoria controlada do anúncio no Google Ads;
5. C10 — fortalecimento do SEO e das páginas de entrada;
6. C11 — publicação de divulgação no LinkedIn;
7. C12 — campanha de e-mail somente para usuários com consentimento;
8. C13 — acompanhamento e decisão após 14 e 30 dias.

---

## C6 — Auditoria e correção da medição

**Estado em 4 de setembro de 2026: concluída.**

### Objetivo

Garantir que as decisões de campanha usem ações reais de estudo, não simples
carregamentos de página ou eventos duplicados.

### Alterações propostas

1. Documentar no código a condição exata que dispara `study_activation`.
2. Confirmar que um usuário não produz várias ativações indevidas na mesma
   sessão.
3. Verificar a correspondência entre os nomes usados no app, GA4 e Ads:
   `home_study_cta_click`, `study_activation`, `chapter_start`,
   `exercise_start` ou `exercise_generate_success`, `login_success` e
   `simulator_start`.
4. Corrigir ou remover da medição a conversão inativa cuja URL contém
   `/home.html/home.html`.
5. Confirmar que nenhum evento envia nome, e-mail ou outro dado pessoal.
6. Manter `study_activation` como conversão primária apenas se representar
   efetivamente o começo do estudo.

### Validação

- executar uma sessão de teste completa;
- conferir cada evento no DebugView do GA4;
- confirmar uma única ativação por início real de estudo;
- confirmar que a conversão inválida deixou de aparecer como problema;
- comparar cliques do Ads e sessões pagas do GA4.

### Risco e reversão

O principal risco é interromper a série histórica. Antes de renomear qualquer
evento, preservar o nome anterior durante um período de transição ou registrar
a data exata da mudança.

### Resultado da execução

- O código local e o script publicado foram auditados na versão de analytics
  `0824.1`.
- `study_activation` é disparado somente por `chapter_start` ou
  `exercise_generate_success`.
- A ativação é deduplicada por 30 minutos no navegador.
- `exercise_start` e `simulator_start` não geram `study_activation`.
- Os eventos enviados ao GA4 removem identificadores diretos e parâmetros
  sensíveis; UTMs cruas não são copiadas como propriedades personalizadas.
- O retorno OAuth emite `login_success` uma vez; uma sessão apenas restaurada
  não produz novo sucesso de login.
- Os 7 testes automatizados de analytics passaram e `npm run check` validou a
  estrutura do projeto.
- No Google Ads, a regra da conversão problemática já estava correta como
  `Page load: /home.html`; apenas o nome continha a duplicação. A ação foi
  renomeada para `TERMO (web) home_page_view`, preservada como secundária e sem
  participação nos lances.
- Nenhum arquivo de implementação precisou ser alterado e nenhum deploy foi
  necessário.

---

## C7 — Relatório do funil de estudo

**Estado em 4 de setembro de 2026: concluída, com limitações documentadas para
login e retenção.**

### Objetivo

Medir onde o usuário interrompe o percurso e separar volume de tráfego de
aprendizagem efetiva.

### Funil proposto

1. visita à home;
2. clique em “Começar a estudar”;
3. `study_activation`;
4. `chapter_start`;
5. `exercise_generate_success`;
6. `login_success`;
7. retorno em 7 e 30 dias;
8. avaliação do app, quando esse recurso estiver disponível.

### Segmentações mínimas

- canal: pago, orgânico, direto, referência, social e e-mail;
- campanha e palavra-chave, quando disponíveis;
- dispositivo;
- usuário novo versus recorrente;
- página de entrada e capítulo iniciado.

### Validação

- percentuais do funil reconciliados com os eventos brutos;
- nenhuma PII nas dimensões;
- relatório capaz de comparar tráfego pago com orgânico;
- período anterior preservado para comparação.

### Resultado da execução

- Foi criada e salva no GA4 a exploração `TERMO — Funil de estudo (C7)`, para
  o período de 7 de agosto a 3 de setembro de 2026, usando 100% dos dados
  disponíveis.
- A ordem foi ajustada à instrumentação real: o app envia `chapter_start`
  imediatamente antes de `study_activation`.
- O funil reconciliado registrou 774 visitas à home, 67 cliques no CTA, 52
  inícios de capítulo, 50 ativações e 3 exercícios gerados com sucesso.
- Os principais abandonos foram home → CTA (91,34%) e ativação → exercício
  gerado (94,00%).
- Pesquisa paga respondeu por 740 entradas na home e pelas 3 gerações de
  exercício; busca orgânica não teve volume visível entre os cinco canais do
  relatório e ainda não permite comparação confiável.
- A leitura por dispositivo foi validada: mobile concentrou 613 entradas, 60
  cliques, 46 ativações e os 3 exercícios gerados.
- `login_success` foi mantido visível, mas seu zero no final do funil não pode
  ser interpretado como ausência de login, pois o login pode ocorrer antes do
  estudo.
- Retorno em 7 e 30 dias foi separado como futura análise de retenção, pois
  exige uma definição estável de “retorno ao estudo”.
- Nenhuma dimensão com PII foi usada.
- O registro detalhado e as ressalvas estão em
  `docs/operations/termo-c7-funil-estudo-2026-09-04.md`.

---

## C8 — Qualidade dos termos e estrutura do Google Ads

**Estado em 4 de setembro de 2026: concluída sem aplicação de negativas ou
alterações na campanha.**

### Objetivo

Reduzir cliques de baixa intenção sem excluir consultas que realmente levem a
estudo.

### Alterações propostas

1. Exportar termos de pesquisa com custo, cliques, engajamento e
   `study_activation`.
2. Classificar os termos em:
   - termodinâmica e leis;
   - exercícios e listas;
   - simuladores;
   - temas próximos que exigem revisão;
   - termos claramente fora de escopo.
3. Preparar uma lista de negativas para aprovação, sem aplicá-la
   automaticamente.
4. Revisar especialmente resistores, ondulatória, potência mecânica, física
   quântica, ONEE e buscas genéricas por PhET.
5. Não negativar `phet`, `termoquímica` ou outro tema próximo sem antes
   verificar ativações e engajamento.
6. Comparar Pesquisa Google e parceiros de pesquisa por custo por ativação.
7. Separar, quando houver volume suficiente, grupos de anúncios para:
   exercícios resolvidos, conceitos/leis e simuladores.

### Validação

- nenhum termo é bloqueado sem justificativa registrada;
- CTR, custo por ativação e taxa de engajamento são acompanhados por grupo;
- manter amostra anterior à mudança para comparação.

### Resultado da execução

- Foram analisados os termos de pesquisa do período de 5 de agosto a 3 de
  setembro de 2026: 987 cliques, 52.572 impressões, €99,13 de custo e 141
  conversões.
- Termos identificáveis representaram 652 cliques e 84 conversões; “outros
  termos de pesquisa” representaram 334 cliques e 57 conversões.
- `física` e `fisica`, embora genéricos, produziram juntas cinco conversões por
  €3,11 e não devem ser negativadas de forma ampla.
- Foi preparada para aprovação uma lista de oito negativas exatas, concentrada
  em resistores, ondulatória, potência mecânica, ONEE, PTIET, mecânica e física
  quântica. Nenhuma foi aplicada.
- `phet`, termoquímica e temas térmicos próximos foram mantidos fora da lista de
  negativas até existir evidência específica de baixa qualidade.
- Parceiros de pesquisa produziram aproximadamente 41,8% das conversões com
  24,3% do custo; o custo por conversão estimado foi €0,41, contra €0,91 na
  Pesquisa Google. A rede deve permanecer ativa e monitorada.
- A campanha continua com um único grupo de anúncios. A separação futura em
  conceitos/leis, exercícios/listas e simuladores foi documentada, mas não
  executada.
- Relatório detalhado: `docs/operations/termo-c8-termos-google-ads-2026-09-04.md`.
- Cálculo reproduzível: `docs/operations/termo-c8-validacao.ipynb`.

---

## C9 — Novo teste de anúncio no Google Ads

### Objetivo

Elevar o CTR sem prometer recursos que o usuário não encontrará imediatamente.

### Alterações propostas

1. Criar uma variação de anúncio, mantendo o anúncio atual para comparação.
2. Destacar “livro interativo”, “capítulos”, “exercícios” e “simuladores”.
3. Alinhar títulos ao conteúdo real da página de destino.
4. Não mudar orçamento nem estratégia de lances no mesmo dia do teste de
   criativo, para preservar a leitura causal.
5. Não aceitar ainda a recomendação automática de “Maximizar conversões”.

### Rascunho inicial para teste

**Títulos possíveis:**

- Termodinâmica para Estudantes
- Livro Interativo de Termodinâmica
- Estude Leis da Termodinâmica
- Exercícios e Simuladores
- Aprenda Termodinâmica Online

**Descrições possíveis:**

- Estude termodinâmica em capítulos organizados, com exercícios e simuladores
  interativos. Acesso aberto.
- Comece pelos conceitos fundamentais e avance no seu ritmo com recursos para
  estudantes de Física.

### Validação

- teste por no mínimo 14 dias, salvo problema evidente;
- comparar CTR, engajamento, ativação e custo por ativação;
- não declarar vencedor apenas pelo número de cliques.

### Execução em 4 de setembro de 2026

- variação `C9 — Livro interativo, exercícios e simuladores` criada e confirmada
  como **Active** no Google Ads;
- campanha: `TERMO - Search - BR - PT`;
- período: 4 a 17 de setembro de 2026 (14 dias);
- divisão de tráfego: 50% para a variação e 50% para o anúncio atual;
- orçamento, lances, palavras-chave e página de destino não foram alterados;
- registro operacional: `docs/operations/termo-c9-teste-anuncio-google-ads-2026-09-04.md`.

---

## C10 — Fortalecimento do SEO e das páginas de entrada

### Objetivo

Reduzir gradualmente a dependência de mídia paga, hoje responsável por 83% das
sessões.

### Alterações propostas

1. Auditar indexação, sitemap, canonical, robots, títulos e descrições.
2. Verificar no Search Console páginas indexadas, consultas, impressões, CTR e
   posição média.
3. Melhorar títulos e textos introdutórios de páginas com intenção clara:
   - leis da termodinâmica;
   - exercícios de termodinâmica;
   - conceitos fundamentais;
   - simuladores de termodinâmica;
   - mapa de conteúdo.
4. Criar ligações internas claras entre home, capítulos, exercícios e
   simuladores.
5. Preservar uma URL canônica por conteúdo e evitar duplicações como
   `/home.html/home.html`.
6. Revisar a página do TERMO no WordPress para manter um único link principal
   para o app e links contextuais apenas quando realmente úteis.
7. Solicitar nova indexação somente das páginas que tiverem mudança material.

### Validação

- páginas principais indexáveis e com canonical correto;
- sitemap aceito;
- ausência de duplicações críticas;
- comparação de cliques orgânicos em 30, 60 e 90 dias.

### Execução em 4 de setembro de 2026

- criadas páginas indexáveis para `leis da termodinâmica`, `exercícios de
  termodinâmica` e `simuladores de termodinâmica`;
- adicionadas ligações internas da home para as novas rotas;
- páginas incluídas no sitemap e protegidas por testes de canonical, H1,
  metadados, dados estruturados e ligações internas;
- configurado redirecionamento permanente de `/home.html/home.html` para
  `/home.html`;
- testes locais aprovados; publicação pendente porque a sessão da Vercel CLI
  respondeu `Not authorized`;
- registro: `docs/operations/termo-c10-seo-2026-09-04.md`.

---

## C11 — Divulgação no LinkedIn

### Objetivo

Apresentar o TERMO de forma acadêmica, clara e amigável, levando o leitor para
uma única página principal.

### Formato proposto

- publicação orgânica no perfil do responsável;
- uma imagem do app ou captura da home;
- um único link principal;
- texto sem excesso de hashtags;
- parâmetros UTM próprios para LinkedIn, sem dados pessoais.

### Rascunho da publicação

> Tenho trabalhado no TERMO, um livro interativo e aberto de Termodinâmica para
> estudantes de Física.
>
> O projeto organiza os conceitos em capítulos e combina leitura, exercícios e
> simuladores para ajudar o estudante a avançar no próprio ritmo. A proposta é
> tornar o estudo da Termodinâmica mais visual, exploratório e conectado à
> resolução de problemas.
>
> Professores e estudantes estão convidados a conhecer o material e enviar
> sugestões. O acesso é aberto:
>
> [LINK PRINCIPAL DO TERMO]
>
> Se você ensina ou estuda Física, gostaria muito de saber quais recursos seriam
> mais úteis nas próximas versões.
>
> #Termodinâmica #EnsinoDeFísica #Educação #Física

### Antes da publicação

1. escolher a imagem;
2. revisar o texto e o link;
3. acrescentar UTM exclusiva para LinkedIn;
4. abrir a prévia da publicação;
5. publicar somente após confirmação explícita do responsável.

### Validação

- link abre corretamente em celular e desktop;
- GA4 reconhece LinkedIn/social sem registrar PII;
- acompanhar impressões, cliques, sessões engajadas e ativações por 14 dias.

---

## C12 — E-mail para usuários que autorizaram comunicações

### Objetivo

Convidar usuários consentidos a retornar ao TERMO, com envio controlado,
auditável e fácil descadastro.

### Regra obrigatória de elegibilidade

Somente incluir um destinatário quando houver registro verificável de
consentimento específico para receber novidades por e-mail. Criar conta, fazer
login ou aceitar Termos e Privacidade não constitui autorização de marketing.

Excluir sempre:

- usuários sem opt-in explícito;
- usuários que cancelaram a autorização;
- endereços suprimidos, inválidos ou com falha permanente;
- destinatários que atingiram o limite de frequência definido;
- contas administrativas e de teste, salvo inclusão manual para teste interno.

### Etapas propostas

1. Auditar a origem, data, versão e estado atual de cada consentimento.
2. Gerar apenas uma contagem preliminar de elegíveis, sem exportar endereços
   desnecessariamente.
3. Confirmar provedor, domínio remetente, endereço de resposta e mecanismo de
   descadastro.
4. Preparar uma lista final no servidor, com supressões e deduplicação.
5. Enviar primeiro para uma lista interna de teste.
6. Apresentar ao administrador a prévia da mensagem e o total de destinatários.
7. Exigir confirmação explícita imediatamente antes do envio real.
8. Registrar tentativas, entregas, falhas, descadastros, cliques e ativações.

### Rascunho do e-mail

**Assunto:** Continue seus estudos de Termodinâmica no TERMO

**Pré-cabeçalho:** Capítulos, exercícios e simuladores em um livro interativo e
aberto.

**Mensagem:**

Olá,

O TERMO continua evoluindo para apoiar o estudo de Termodinâmica com capítulos
organizados, exercícios e simuladores interativos.

Você pode retomar o conteúdo pelos conceitos fundamentais e avançar no seu
ritmo.

**[Continuar estudando]**

Se conhecer estudantes ou professores de Física que possam se beneficiar do
projeto, fique à vontade para compartilhar o acesso.

Você está recebendo esta mensagem porque autorizou o envio de novidades do
TERMO. **[Cancelar recebimento]**

### Restrições

- nenhum envio automático ou recorrente nesta change;
- nenhum envio sem prévia aprovada;
- um único CTA principal;
- frequência inicial proposta: no máximo um e-mail em 30 dias;
- links com UTM de campanha, nunca com e-mail ou identificador pessoal;
- descadastro deve produzir efeito imediato.

### Validação

- consulta de elegibilidade testada com casos positivos e negativos;
- nenhum usuário sem consentimento na lista;
- descadastro funcional antes do primeiro envio;
- teste em celular e desktop;
- relatório de entrega, clique, ativação e cancelamento.

---

## C13 — Acompanhamento e decisão

### Objetivo

Evitar decisões baseadas em poucos dias ou apenas em cliques.

### Leitura em 14 dias

- integridade dos eventos;
- CTR e CPC por anúncio e termo;
- sessões e ativações por canal;
- resultado do LinkedIn, se publicado;
- entrega e descadastro do e-mail, se enviado.

### Leitura em 30 dias

- custo por `study_activation`;
- passagem de ativação para capítulo e exercício;
- retorno de usuários;
- evolução da busca orgânica;
- qualidade por rede e dispositivo;
- decisão sobre negativas, orçamento e estratégia de lances.

### Critério para “Maximizar conversões”

Considerar o teste somente quando:

- `study_activation` estiver tecnicamente validado;
- houver volume estável de conversões;
- os termos fora de escopo tiverem sido tratados;
- custo por ativação e qualidade pós-clique estiverem conhecidos.

## Aprovações necessárias

Cada item abaixo exige uma autorização separada:

- [x] C6 — medição (concluída em 4 de setembro de 2026);
- [x] C7 — funil e relatório (concluída em 4 de setembro de 2026);
- [x] C8 — termos/negativas e estrutura do Ads (concluída em 4 de setembro de 2026);
- [x] C9 — teste de anúncio no Google Ads (ativo; avaliação pendente até 17/09/2026);
- [ ] C10 — SEO e páginas de entrada (implementada e testada; publicação pendente);
- [ ] C11 — publicação no LinkedIn;
- [ ] C12 — preparação e envio de e-mail consentido;
- [ ] C13 — acompanhamento e decisão.

Marcar uma caixa neste documento não substitui a confirmação do responsável na
conversa antes de qualquer ação externa.
