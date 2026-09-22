# TERMO Codex Context

This file is the durable project map for Codex sessions. Read it before making
non-trivial changes, then inspect the relevant source files directly.

## Project

TERMO is an interactive Thermodynamics book for Physics students. It combines
HTML chapters, conceptual summaries, figures, interactive simulators, AI
exercises, chapter quizzes, study points, daily challenge, protected book PDF
download, and user data features.

Project classification:
- `INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Governance Baseline

The active methodology reference is the Pó Mágico repository
`git@github.com:MSR-BR/po-magico.git`, file
`po_magico_v20260912.002.md`, verified at revision
`9d634d2c2957dca2c61380f4665f2da019d6ae99` (2026-09-12). The reference is
external: do not copy it into this repository or modify its preserved source
version as part of ordinary TERMO work.

New material initiatives use the canonical Change structure under
`.specs/changes/NNN-slug/`. The existing dated records under `changes/` are a
preserved legacy execution history and must not be moved, renamed, or rewritten
only to match the new convention. Before assigning a number, inspect both
locations and the roadmap in `.specs/changes/README.md`.

Every material Change must record separately:
- planned model route, reasoning level, justification, and allowed fallback;
- actual model and reasoning only when exposed by verifiable runtime evidence;
- unavailable telemetry as `not exposed` or `not measured`, never as an estimate;
- tests, gates, failures, corrections, deployment status, and pending human decisions.

The reusable structure lives at `.specs/changes/_template/`. A Change is complete
only after its applicable acceptance criteria and validation gates pass. Do not
commit, push, deploy, mutate a remote provider, or close a human-controlled
editorial decision without explicit authorization.

Canonical project sources include:
- chapter publication and navigation: `data/capitulo-*.json` plus existing app
  routing and rendered section files;
- book corpus and AI provenance: generated corpus, topic taxonomy/index, and
  their builders and validators;
- public discovery: `home.html`, `conteudo.html`, `search.html`, SEO builder,
  canonical metadata, robots, and sitemaps;
- product behavior: `index.html`, shared assets, APIs, tests, and Supabase
  migrations applicable to the flow.

When sources disagree, stop and document the conflict instead of silently
selecting the most convenient source. Chapter 5 remains blocked until an
explicit editorial decision and synchronized validation make it public.

Production (canonical):
- https://termo.app.br

Legacy compatibility origin:
- https://termo-theta.vercel.app (permanent redirect to the canonical domain; retain as the OAuth callback origin until the Supabase allow-list is updated and validated)

Remote repository:
- https://github.com/MSR-BR/termo.git

Public discovery / SEO entry points:
- Official static landing: https://termo.app.br/home.html
- Points and chapter quizzes: https://termo.app.br/index.html?view=journey
- Daily challenge: https://termo.app.br/index.html?view=daily-challenge
- Crawlable content map: https://termo.app.br/conteudo.html
- Main sitemap: https://termo.app.br/sitemap.xml
- GitHub Pages bridge: https://msr-br.github.io/termo/
- GitHub Pages bridge sitemap: https://msr-br.github.io/termo/sitemap.xml

The official landing includes the public presentation video at
`assets/videos/termo-apresentacao.mp4`, with its derived poster beside it. The
canonical generator is `scripts/build-seo-artifacts.mjs`; edit the generator,
not only `home.html`, so future SEO rebuilds preserve the video block and its
`VideoObject` metadata. The video does not autoplay and is not yet approved for
paid advertising or social campaigns. Reconsider those uses only after a later
GA4 and Google Ads review.

## Repository Shape

- `index.html`: main application shell and view controller.
- `slides/capitulo-01/`: chapter 1 pages. This chapter still has substantial
  inline CSS.
- `slides/capitulo-02/`: visual and structural reference for chapter layout.
- `slides/capitulo-03/`: chapter 3 pages aligned to chapter 2 patterns.
- `slides/capitulo-04/`: chapter 4 pages aligned to chapter 2 patterns.
- `slides/capitulo-06/`: chapter 6 pages aligned to chapter 2 patterns.
- `simulators/`: local simulator pages. Simulators should open in a new tab.
- `assets/`: shared CSS and JS, including chapter layout, auth, analytics,
  sharing, user data, and AI exercise logic.
- `api/`: backend/API routes used by the app.
- `data/`: structured chapter data.
- `scripts/`: maintenance, validation, SEO, and migration scripts.
- `supabase/`: Supabase-related project files.

Chapter 5 is intentionally disabled in the menu.

## Editorial Registry

The human-maintained publication policy is
`data/termo-editorial-policy.json`. The generated, explicit registry consumed by
the application and maintenance scripts is
`data/termo-editorial-registry.json`; rebuild it with
`npm run build:editorial-registry` and validate it with
`npm run validate:editorial-registry`.

The registry is the synchronization boundary for chapter and section status,
public availability, search eligibility, SEO eligibility, and AI exercise
eligibility. Search, sitemap generation, AI exercise catalogs, the exercise API,
and chapter quiz catalogs must derive their allowlists from it rather than from
new hardcoded chapter lists.

For a published chapter, section-level AI exercise eligibility is derived from
the canonical `aiExercise: true` field in `data/capitulo-*.json`. A visible HTML
exercise host does not grant eligibility by itself. The browser hides an
ineligible host, and the server rejects a request for an ineligible section.
Chapter 5 is explicitly blocked in every public dimension and must include a
documented reason until a new editorial decision changes the policy and all
generated artifacts pass validation.

## Visual And Content Conventions

- Treat chapter 2 as the source of truth for chapter layout, structure, and
  typography.
- Reuse existing chapter 2 templates and component patterns when possible.
- Do not invent a new layout when a local pattern already exists.
- Figure captions should use the existing visual pattern and live in the
  appropriate box.
- Avoid fragmenting one subtopic into many small cards. Group related material
  when the conceptual unit is single.
- Numerical examples usually work best as one statement card and one solution
  card, when the page structure allows it.
- Side-by-side desktop cards should align at the top.
- Keep simulator callouts visible in the corresponding chapter section, with a
  label such as `Simulador Sxx`.

## Simulator Conventions

Simulator catalog cards should include:
- simulator code, such as `S08`;
- title;
- short description;
- `Abrir simulador`;
- `Abrir secao x.xx`.

Simulator pages should keep the shared pattern:
- standardized header;
- usage instructions;
- credits;
- version information;
- opened from the app in a new tab.

Authenticated simulator activity is stored separately from aggregate analytics
in `public.simulator_activity`. The browser records it only through the atomic
`record_simulator_open` RPC, and the user reads only their own rows through RLS.
Anonymous simulator use remains unrestricted and does not create identifiable
activity. Opening a simulator does not award gamification points.

Known simulator mapping:
- `S01`: chapter 1, section 1.3, `slides/capitulo-01/page_4.html`
- `S02`: chapter 1, section 1.10, `slides/capitulo-01/page_11.html`
- `S03`: chapter 2, section 2.8, `slides/capitulo-02/page_8.html`
- `S04`: chapter 3, section 3.8, `slides/capitulo-03/page_18.html`
- `S05`: chapter 4, section 4.5, `slides/capitulo-04/page_9.html`
- `S06`: chapter 4, section 4.6, `slides/capitulo-04/page_11.html`
- `S07`: isothermal simulator, verify catalog mapping if needed
- `S08`: chapter 6, section 6.2, `slides/capitulo-06/page_2.html`
- `S09`: chapter 6, section 6.10, `slides/capitulo-06/page_10.html`

## Services And Sensitive Flows

- Deploy is on Vercel.
- Auth, Storage, and part of the data layer use Supabase.
- Supabase remote work requires verification of the signed-in provider identity,
  organization, and exact TERMO project reference before mutation. Validate
  schema, grants, RLS, indexes, API exposure, and server-side authorization.
- AI exercises use Gemini through the existing backend/API integration.
- Gemini credentials and privileged prompts remain server-side. Never expose
  secrets or treat a model response as canonical educational content without
  the existing source and validation controls.
- The canonical AI exercise provenance artifact is
  `data/ai-exercise-source-manifest.json`. It is generated from the editorial
  registry, book corpus, and topic index with
  `npm run build:ai-source-manifest`, then audited with
  `npm run validate:ai-source-manifest`. Only entries that are editorially
  eligible, `approved`, linked to a physical HTML page, mapped to PDF pages, and
  connected to a thematic reference may enter the section-exercise prompt.
- When an approved manifest entry exists, its URL and local HTML are canonical
  for the teaching context. Page text, title, subtitle, or path supplied by the
  browser must not override or supplement that reviewed source. A missing or
  incomplete manifest fails closed before Gemini is called.
- GA4 measures product behavior and acquisition after arrival. Do not send free
  text, email, or personal data as analytics properties, and keep its evidence
  distinct from Search Console and Google Ads data.
- Resend supports the existing consent-based email flows. Send only to recipients
  whose current legal preference authorizes email, and preserve delivery and
  suppression controls.
- Vercel hosts public and server routes. Environment variables, production
  aliases, and deployments are remote mutations and require exact-project
  verification plus explicit deployment authorization.
- The technical AI exercise reference index lives at
  `docs/exercicios-ia-indice-referencias.html`. It is shown in the app Extras
  menu only for the admin email `marioreis@id.uff.br`. Regenerate it whenever
  the app HTML content or the book PDF changes.
- AI exercise error reports reuse `exercise_validation_reports`. Student reports
  include a simple problem type; the professor can approve reports as memory,
  reject them, or set `review_status = disabled` to keep the history while
  removing that correction from future AI context. Only approved confirmed
  errors with `avoid_propagation = true` are loaded into generation memory.
- AI chapter quizzes use the same book corpus and topic index strategy as section
  exercises. The quiz prompt receives chapter-level PDF excerpts, app topics, and
  thematic metadata; generated quiz math is checked before the quiz token is
  accepted. Use `npm run smoke:ai-quiz-context` after changing quiz generation,
  book corpus, topic index, or chapter data.
- Gamification is intentionally lightweight for the first public version:
  `Pontos e simulados` lives under `Extras`, the header shows the user's points,
  chapter quizzes unlock in order, and `Desafio do dia` is a separate `Extras`
  item based only on already-studied topics or chapters with quiz attempts.
- The complete book PDF download is protected by login and shows a disclaimer
  before download.
- Vercel Analytics is enabled. More detailed event tracking may be expanded.

Do not break:
- login and redirect flow;
- PDF disclaimer and protected download flow;
- Supabase integration;
- Gemini exercise API integration;
- simulator opening behavior;
- SEO artifacts and canonical links.

## SEO / Discovery State As Of 2026-07-18

Google Search Console repeatedly failed on sitemap fetch / request indexing even
when public URLs were live. The practical strategy moved away from relying on
manual request indexing and toward public discovery paths.

Completed:
- simplified `robots.txt` and sitemap files;
- added a static academic landing page at `home.html`;
- added a crawlable content map at `conteudo.html`;
- added a GitHub Pages bridge under `docs/index.html`;
- configured GitHub Pages to publish `main` + `/docs`;
- added a short `README.md` with public links.
- updated landing, content map, GitHub Pages bridge, and runtime SEO copy to
  mention points, chapter quizzes, daily challenge, and simulators;
- kept personal progress routes such as `view=journey` and
  `view=daily-challenge` as `noindex` runtime pages.

Important commits:
- `5560d5d` Simplify sitemap for Search Console
- `5f464f2` Add academic landing page for TERMO
- `aea2dbf` Add GitHub Pages bridge for TERMO

The GitHub Pages bridge intentionally declares:
- canonical: `https://termo.app.br/home.html`
- public URL: `https://msr-br.github.io/termo/`

Marketing/ads note: public ads should continue using `home.html` as the main
landing page. Personal routes are useful product destinations after login, but
should not be treated as SEO landing pages.

## Working Rules For Codex

Before editing:
- run `git status --short --branch`;
- inspect the specific files involved;
- compare chapter changes with chapter 2 patterns;
- preserve existing naming, layout, and UI vocabulary.

After editing:
- run `npm run check`;
- run targeted syntax checks when touching JS, such as `node --check path`;
- when changing the book PDF, chapter HTML, or AI exercise references, run
  `npm run extract:book-sections`, `npm run build:book-topic-index`,
  `npm run docs:ai-exercise-index`, `npm run validate:book-corpus`, and
  `npm run validate:book-topic-index`;
- when changing the AI exercise context package, run `npm run smoke:ai-context`
  to inspect the prompt context for representative sections;
- when changing chapter data, the book corpus, topic index, or AI exercise
  eligibility, rebuild and validate `data/ai-exercise-source-manifest.json`;
- when changing AI chapter quizzes, run `npm run smoke:ai-quiz-context`;
- when changing generated exercise math handling, run
  `npm run smoke:math-contract`;
- review `git diff`;
- for visual work, start `npm run dev` and inspect the affected page when useful.

Commit/deploy only when the user asks for it.
