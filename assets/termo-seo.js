(() => {
  const SITE_URL = "https://termo-theta.vercel.app";
  const COURSE_TITLE = "Termodinâmica para Estudantes de Física";
  const AUTHOR_NAME = "Prof. Mario Reis";
  const PUBLISHER_NAME = "Instituto de Física — Universidade Federal Fluminense";
  const DEFAULT_DESCRIPTION = "Livro interativo de Termodinâmica com capítulos, exercícios automáticos por IA, simulados por capítulo, pontos de estudo, desafio do dia, simuladores e material didático do Prof. Mario Reis (IF-UFF).";
  const APP_TITLE = "TERMO — App de Termodinâmica | Capítulos, exercícios e simuladores";
  const APP_DESCRIPTION = "App gratuito de Termodinâmica para estudantes de Física, com capítulos interativos, exercícios por IA, simulados científicos, pontos e trilhas de estudo.";
  const AUTHOR_SAME_AS = [
    "https://profmarioreis.wordpress.com/thermodynamics/",
    "https://international.uff.br/pesquisas-de-destaque/",
    "https://www.uff.br/informe/professor-da-uff-lanca-livro-didatico-sobre-mecanica-quantica/"
  ];
  const CHAPTER_META = {
    "01": {
      title: "Conceitos Fundamentais",
      description: "Conceitos fundamentais da Termodinâmica: equilíbrio térmico, temperatura, escalas, calor, trabalho e primeira lei."
    },
    "02": {
      title: "Potenciais Termodinâmicos e Aplicações",
      description: "Potenciais termodinâmicos, transformações de Legendre, energia livre, entalpia, relações de Maxwell e aplicações."
    },
    "03": {
      title: "Termodinâmica Estatística",
      description: "Termodinâmica estatística com ensembles, entropia, distribuição de Boltzmann, gás ideal e exemplos quânticos e clássicos."
    },
    "04": {
      title: "Transições de Fase",
      description: "Transições de fase, gás de Van der Waals, ponto crítico, estabilidade, coexistência e construção de Maxwell."
    },
    "05": {
      title: "Processos Termodinâmicos",
      description: "Processos termodinâmicos, trocas de calor e trabalho, transformações e interpretação física dos caminhos entre estados."
    },
    "06": {
      title: "Ciclos Termodinâmicos",
      description: "Ciclos termodinâmicos, máquinas térmicas, eficiência, refrigeradores e transformações cíclicas."
    }
  };

  const PRIVATE_VIEWS = new Set(["saved", "favorites", "validation-review", "journey", "daily-challenge"]);

  function isIndexPage() {
    return /(^|\/)index\.html$/i.test(window.location.pathname) || window.location.pathname === "/";
  }

  function textContent(node) {
    return node && node.textContent ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function truncate(value, maxLength) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trimEnd()}...`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureMetaByName(name) {
    let node = document.head.querySelector(`meta[name="${name}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("name", name);
      document.head.appendChild(node);
    }
    return node;
  }

  function ensureMetaByProperty(property) {
    let node = document.head.querySelector(`meta[property="${property}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("property", property);
      document.head.appendChild(node);
    }
    return node;
  }

  function ensureCanonical() {
    let node = document.head.querySelector('link[rel="canonical"]');
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", "canonical");
      document.head.appendChild(node);
    }
    return node;
  }

  function ensureJsonLdNode() {
    let node = document.head.querySelector('script[data-termo-seo-runtime="true"]');
    if (!node) {
      node = document.createElement("script");
      node.type = "application/ld+json";
      node.setAttribute("data-termo-seo-runtime", "true");
      document.head.appendChild(node);
    }
    return node;
  }

  function buildCanonicalForIndex(view, chapterId) {
    const canonical = new URL(SITE_URL);

    if (view === "chapters" && chapterId) {
      canonical.searchParams.set("view", "chapters");
      canonical.searchParams.set("chapter", chapterId);
      return canonical.toString();
    }

    if (view === "simulators") {
      canonical.searchParams.set("view", "simulators");
      return canonical.toString();
    }

    return canonical.toString();
  }

  function buildIndexMeta() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") || "chapters";
    const chapterId = params.get("chapter") || "";

    if (PRIVATE_VIEWS.has(view)) {
      return {
        title: `Área pessoal | ${COURSE_TITLE}`,
        description: "Área pessoal com pontos, simulados, desafio do dia, exercícios salvos, favoritos e histórico de estudo do livro interativo de Termodinâmica.",
        canonical: buildCanonicalForIndex("chapters", ""),
        robots: "noindex,nofollow,noarchive",
        ogType: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Área pessoal | ${COURSE_TITLE}`,
          description: "Área pessoal de estudo, pontos e simulados.",
          isPartOf: {
            "@type": "WebSite",
            name: COURSE_TITLE,
            url: SITE_URL
          },
          inLanguage: "pt-BR"
        }
      };
    }

    if (view === "simulators") {
      return {
        title: `Simuladores de Termodinâmica | ${COURSE_TITLE}`,
        description: "Simuladores interativos de termometria, equilíbrio térmico, Van der Waals, isotérmicas e ciclos termodinâmicos.",
        canonical: buildCanonicalForIndex(view, chapterId),
        robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
        ogType: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Simuladores de Termodinâmica | ${COURSE_TITLE}`,
          description: "Coleção de simuladores interativos de Termodinâmica.",
          url: buildCanonicalForIndex(view, chapterId),
          inLanguage: "pt-BR",
          isPartOf: {
            "@type": "WebSite",
            name: COURSE_TITLE,
            url: SITE_URL
          }
        }
      };
    }

    if (view === "chapters" && chapterId && CHAPTER_META[chapterId]) {
      const chapter = CHAPTER_META[chapterId];
      return {
        title: `${chapter.title} | Capítulo ${Number(chapterId)} | ${COURSE_TITLE}`,
        description: truncate(`${chapter.description} Livro interativo com material didático, exercícios automáticos e apoio ao estudo do Prof. Mario Reis.`, 170),
        canonical: buildCanonicalForIndex(view, chapterId),
        robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
        ogType: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${chapter.title} | ${COURSE_TITLE}`,
          description: chapter.description,
          url: buildCanonicalForIndex(view, chapterId),
          inLanguage: "pt-BR",
          isPartOf: {
            "@type": "Course",
            name: COURSE_TITLE,
            provider: {
              "@type": "CollegeOrUniversity",
              name: PUBLISHER_NAME
            }
          }
        }
      };
    }

    return {
      title: APP_TITLE,
      description: APP_DESCRIPTION,
      canonical: buildCanonicalForIndex(view, chapterId),
      robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TERMO",
          alternateName: COURSE_TITLE,
          url: SITE_URL,
          inLanguage: "pt-BR"
        },
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: COURSE_TITLE,
          description: DEFAULT_DESCRIPTION,
          provider: {
            "@type": "CollegeOrUniversity",
            name: PUBLISHER_NAME
          },
          creator: {
            "@type": "Person",
            name: AUTHOR_NAME,
            sameAs: AUTHOR_SAME_AS
          },
          url: SITE_URL
        }
      ]
    };
  }

  function applyMeta(meta) {
    document.title = meta.title;
    document.documentElement.lang = "pt-BR";

    ensureMetaByName("description").setAttribute("content", meta.description);
    ensureMetaByName("author").setAttribute("content", AUTHOR_NAME);
    ensureMetaByName("robots").setAttribute("content", meta.robots);
    ensureMetaByName("googlebot").setAttribute("content", meta.robots);
    ensureMetaByName("theme-color").setAttribute("content", "#004B87");

    ensureMetaByProperty("og:locale").setAttribute("content", "pt_BR");
    ensureMetaByProperty("og:type").setAttribute("content", meta.ogType);
    ensureMetaByProperty("og:site_name").setAttribute("content", COURSE_TITLE);
    ensureMetaByProperty("og:title").setAttribute("content", meta.title);
    ensureMetaByProperty("og:description").setAttribute("content", meta.description);
    ensureMetaByProperty("og:url").setAttribute("content", meta.canonical);

    ensureMetaByName("twitter:card").setAttribute("content", "summary");
    ensureMetaByName("twitter:title").setAttribute("content", meta.title);
    ensureMetaByName("twitter:description").setAttribute("content", meta.description);

    ensureCanonical().setAttribute("href", meta.canonical);

    ensureJsonLdNode().textContent = JSON.stringify(meta.jsonLd);
  }

  function updateIndexSeo() {
    if (!isIndexPage()) return;
    applyMeta(buildIndexMeta());
  }

  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    window.setTimeout(updateIndexSeo, 0);
    return result;
  };

  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    window.setTimeout(updateIndexSeo, 0);
    return result;
  };

  window.addEventListener("popstate", updateIndexSeo);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateIndexSeo, { once: true });
  } else {
    updateIndexSeo();
  }
})();
