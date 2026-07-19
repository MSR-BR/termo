import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT_DIR, "data");
const OUTPUT_PATH = resolve(DATA_DIR, "book-section-corpus.json");
const DEFAULT_PDF_PATH = process.env.TERMO_LIVRO_PDF_PATH || "/Users/marioreis/Downloads/termodinamica-preprint.pdf";
const PYTHON_BIN = process.env.TERMO_BOOK_PYTHON || process.env.PYTHON || "python3";
const PDFTOTEXT_BIN = process.env.TERMO_PDFTOTEXT || "pdftotext";
const STOPWORDS = new Set([
  "para", "com", "uma", "das", "dos", "que", "por", "como", "entre", "sobre", "exemplo", "geral",
  "tipo", "livre", "energia", "sistemas", "sistema", "processos", "processo", "termodinamicos",
  "termodinamico", "termodinamica", "termodinamico", "funcao", "funcoes", "estado", "estados"
]);

const CHAPTER_CONFIG = [
  {
    id: "01",
    data: "capitulo-01.json",
    pdfChapterNumber: "2",
    pdfChapterTitle: "Conceitos Fundamentais",
    startPage: 7,
    endPage: 24,
    pageOverrides: {
      "1.1": { pageStart: 7, pageEnd: 7, reason: "PDF section 2.1 introduces the Zeroth Law and thermometry." },
      "1.2": { pageStart: 7, pageEnd: 8, reason: "Temperature measurement methods appear in the continuation of PDF section 2.1." },
      "1.3": { pageStart: 8, pageEnd: 9, reason: "Thermometric scales are discussed before Example 2.1." },
      "1.4": { pageStart: 9, pageEnd: 9, reason: "Example 2.1 derives the Celsius-Fahrenheit relation." },
      "1.5": { pageStart: 9, pageEnd: 10, reason: "PDF section 2.2 classifies open, closed and isolated systems." },
      "1.6": { pageStart: 10, pageEnd: 11, reason: "PDF section 2.3 discusses reversibility and equilibrium in thermodynamic transformations." },
      "1.7": { pageStart: 11, pageEnd: 11, reason: "PDF section 2.4 defines thermodynamic states and state functions." },
      "1.8": { pageStart: 11, pageEnd: 12, reason: "PDF section 2.5 introduces heat and sign conventions." },
      "1.9": { pageStart: 12, pageEnd: 13, reason: "The copper heating example appears around Examples 2.3 and 2.4." },
      "1.10": { pageStart: 13, pageEnd: 13, reason: "Example 2.4 covers thermal equilibrium between bodies." },
      "1.11": { pageStart: 13, pageEnd: 14, reason: "PDF section 2.6 gives the qualitative ideal-gas arguments." },
      "1.12": { pageStart: 14, pageEnd: 16, reason: "PDF section 2.7 and Example 2.5 discuss thermodynamic work." },
      "1.13": { pageStart: 15, pageEnd: 16, reason: "Example 2.5 covers isothermal expansion/compression work." },
      "1.14": { pageStart: 15, pageEnd: 17, reason: "PDF section 2.8 discusses conjugate, intensive and extensive variables." },
      "1.15": { pageStart: 17, pageEnd: 17, reason: "PDF section 2.9 introduces internal energy." },
      "1.16": { pageStart: 17, pageEnd: 18, reason: "PDF section 2.10 states the First Law." },
      "1.17": { pageStart: 18, pageEnd: 18, reason: "Example 2.6 applies the First Law to an isothermal ideal-gas process." },
      "1.18": { pageStart: 18, pageEnd: 19, reason: "PDF section 2.11 introduces entropy and Clausius' inequality." },
      "1.19": { pageStart: 19, pageEnd: 20, reason: "PDF section 2.12 discusses heat capacity." }
    },
    topicAliases: {
      "1.4": ["Relacao entre Escalas Termometricas"],
      "1.5": ["Sistemas Termodinamicos"],
      "1.7": ["Funcoes de Estado"],
      "1.10": ["Equilibrio Termico"],
      "1.12": ["Trabalho Termodinamico", "Trabalho de Expansao"],
      "1.14": ["Variaveis Conjugadas", "Variaveis Intensivas e Extensivas"],
      "1.16": ["Primeira Lei da Termodinamica"],
      "1.18": ["Desigualdade de Clausius"]
    }
  },
  {
    id: "02",
    data: "capitulo-02.json",
    pdfChapterNumber: "3",
    pdfChapterTitle: "Potenciais Termodinamicos e Aplicacoes",
    startPage: 25,
    endPage: 36,
    pageOverrides: {
      "2.1": { pageStart: 25, pageEnd: 25, startMarker: "3.1 processos: condições", endMarker: "3.2 entropia", reason: "Intro and process conditions in PDF section 3.1." },
      "2.2": { pageStart: 25, pageEnd: 26, startMarker: "3.2 entropia", endMarker: "3.3.2 Energia Livre de Helmholtz", reason: "Entropy and internal energy bridge in PDF sections 3.2 and 3.3.1." },
      "2.3": { pageStart: 26, pageEnd: 28, startMarker: "3.3.2 Energia Livre de Helmholtz", endMarker: "3.3.3 Entalpia", reason: "Helmholtz starts in PDF section 3.3.2 and continues through Example 3.1." },
      "2.4": { pageStart: 28, pageEnd: 30, startMarker: "3.3.3 Entalpia", endMarker: "3.3.4 Energia Livre de Gibbs", reason: "Enthalpy starts in PDF section 3.3.3 and includes Examples 3.2 and 3.3." },
      "2.5": { pageStart: 30, pageEnd: 31, startMarker: "3.3.4 Energia Livre de Gibbs", endMarker: "3.3.5 Grand Potencial", reason: "Gibbs starts in PDF section 3.3.4 and includes Example 3.4." },
      "2.6": { pageStart: 31, pageEnd: 32, startMarker: "3.3.5 Grand Potencial", endMarker: "3.3.6 Variáveis conjugadas", reason: "Grand potential starts in PDF section 3.3.5." },
      "2.7": { pageStart: 32, pageEnd: 32, startMarker: "3.3.6 Variáveis conjugadas", endMarker: "3.4 relações de maxwell", reason: "Magnetic conjugate variables are in PDF section 3.3.6." },
      "2.8": { pageStart: 32, pageEnd: 34, startMarker: "3.4 relações de maxwell", endMarker: "3.5 retângulo termodinâmico", reason: "Maxwell relations and thermodynamic rectangle appear in PDF sections 3.4 and 3.5." },
      "2.9": { pageStart: 34, pageEnd: 35, startMarker: "3.5 retângulo termodinâmico", endMarker: "exercícios", reason: "Thermodynamic rectangle summary table and final synthesis." }
    },
    referenceOverrides: {
      "2.8": [
        { label: "Relacoes de Maxwell", pageStart: 32, pageEnd: 34, startMarker: "3.4 relações de maxwell", endMarker: "3.5 retângulo termodinâmico", reason: "Primary reference for Maxwell relations." },
        { label: "Retangulo termodinamico", pageStart: 34, pageEnd: 35, startMarker: "3.5 retângulo termodinâmico", endMarker: "exercícios", reason: "Secondary reference used by the app page together with Maxwell relations." }
      ]
    },
    topicAliases: {
      "2.1": ["Transformacoes de Legendre"],
      "2.3": ["Energia Livre de Helmholtz"],
      "2.4": ["Entalpia"],
      "2.5": ["Energia Livre de Gibbs"],
      "2.6": ["Grand Potencial", "Grand Potential"],
      "2.7": ["Campo Magnetico e Magnetizacao"],
      "2.8": ["Relacoes de Maxwell", "Retangulo Termodinamico"]
    }
  },
  {
    id: "03",
    data: "capitulo-03.json",
    pdfChapterNumber: "4",
    pdfChapterTitle: "Termodinamica Estatistica",
    startPage: 37,
    endPage: 54,
    pageOverrides: {
      "3.1": { pageStart: 37, pageEnd: 38, reason: "PDF section 4.1 introduces entropy, Gibbs entropy and ensembles." },
      "3.2": { pageStart: 38, pageEnd: 39, reason: "PDF section 4.2 defines the microcanonical ensemble and Boltzmann entropy." },
      "3.3": { pageStart: 39, pageEnd: 40, reason: "PDF section 4.3 derives the canonical ensemble and Boltzmann distribution." },
      "3.4": { pageStart: 39, pageEnd: 40, reason: "PDF section 4.3.1 connects partition function, Helmholtz free energy and internal energy." },
      "3.5": { pageStart: 40, pageEnd: 41, reason: "PDF section 4.4 discusses distinguishability and the Gibbs paradox." },
      "3.6": { pageStart: 41, pageEnd: 42, reason: "PDF section 4.5.1 builds the ideal-gas partition function." },
      "3.7": { pageStart: 42, pageEnd: 43, reason: "PDF sections 4.5.2 and 4.5.3 connect Helmholtz free energy, equation of state, energy and entropy." },
      "3.8": { pageStart: 44, pageEnd: 47, reason: "PDF section 4.6 develops the quantum paramagnetism example." },
      "3.9": { pageStart: 48, pageEnd: 48, reason: "PDF section 4.7 develops the classical paramagnetism example." },
      "3.10": { pageStart: 49, pageEnd: 50, reason: "PDF section 4.8 discusses the Third Law and the low-temperature limit." },
      "3.11": { pageStart: 51, pageEnd: 54, reason: "PDF section 4.9 covers heat capacity in solids, Dulong-Petit and Einstein's model." }
    },
    topicAliases: {
      "3.1": ["Ensemble", "Entropia de Gibbs"],
      "3.2": ["Ensemble Micro-Canonico", "Formula de Boltzmann"],
      "3.3": ["Ensemble Canonico", "Distribuicao de Boltzmann", "Parametro Beta"],
      "3.4": ["Funcao de Particao", "Energia Livre de Helmholtz"],
      "3.5": ["Paradoxo de Gibbs", "Particulas Indistinguiveis"],
      "3.6": ["Gas Ideal Monoatomico", "Funcao de Particao do Gas Ideal"],
      "3.7": ["Sackur-Tetrode"],
      "3.8": ["Paramagnetismo Quantico"],
      "3.9": ["Paramagnetismo Classico", "Funcao de Langevin"],
      "3.10": ["Terceira Lei", "Nernst"],
      "3.11": ["Capacidade Calorifica em Solidos", "Solido de Einstein"]
    }
  },
  {
    id: "04",
    data: "capitulo-04.json",
    pdfChapterNumber: "5",
    pdfChapterTitle: "Transicoes de Fase",
    startPage: 63,
    endPage: 84,
    pageOverrides: {
      "4.1": { pageStart: 63, pageEnd: 63, reason: "PDF section 5.1 opens with why the ideal gas fails and motivates Van der Waals." },
      "4.2": { pageStart: 63, pageEnd: 64, reason: "PDF section 5.1.1 introduces the Van der Waals equation of state." },
      "4.3": { pageStart: 64, pageEnd: 65, reason: "Critical parameters are derived immediately before reduced variables." },
      "4.4": { pageStart: 65, pageEnd: 66, reason: "PDF section 5.1.2 defines reduced variables and the reduced equation of state." },
      "4.5": { pageStart: 66, pageEnd: 66, reason: "PDF section 5.1.3 defines the spinodal and mechanical instability." },
      "4.6": { pageStart: 67, pageEnd: 69, reason: "PDF section 5.1.4 discusses Helmholtz/Gibbs free energy and stability." },
      "4.7": { pageStart: 68, pageEnd: 71, reason: "PDF section 5.1.5 derives Maxwell's construction and shows the coexistence isotherm." },
      "4.8": { pageStart: 71, pageEnd: 72, reason: "PDF section 5.1.6 discusses superheating, supercooling and metastability." },
      "4.9": { pageStart: 72, pageEnd: 74, reason: "PDF section 5.1.7 covers latent heat and the Clausius-Clapeyron equation." },
      "4.10": { pageStart: 74, pageEnd: 75, reason: "PDF section 5.1.8 introduces isothermal compressibility." },
      "4.11": { pageStart: 76, pageEnd: 77, reason: "PDF section 5.1.8 also derives the thermal expansion coefficient." }
    },
    topicAliases: {
      "4.1": ["Validade do Gas Ideal", "Introducao ao Gas de Van der Waals"],
      "4.2": ["Equacao de Estado de Van der Waals"],
      "4.3": ["Ponto Critico"],
      "4.4": ["Equacao de Estado Reduzida"],
      "4.5": ["Instabilidade Mecanica", "Espinodal"],
      "4.6": ["Energia Livre de Helmholtz e Gibbs"],
      "4.7": ["Construcao de Maxwell"],
      "4.8": ["Superaquecimento e Super-resfriamento"],
      "4.9": ["Clausius-Clapeyron"],
      "4.10": ["Compressibilidade Isotermica"],
      "4.11": ["Expansao Termica"]
    }
  },
  {
    id: "06",
    data: "capitulo-06.json",
    pdfChapterNumber: "7",
    pdfChapterTitle: "Ciclos Termodinamicos",
    startPage: 95,
    endPage: 126,
    pageOverrides: {
      "6.1": { pageStart: 95, pageEnd: 96, reason: "PDF section 7.1 introduces operating modes for heat engines and refrigerators." },
      "6.2": { pageStart: 95, pageEnd: 98, reason: "PDF section 7.2.1 describes the Carnot heat-engine stages." },
      "6.3": { pageStart: 98, pageEnd: 99, reason: "PDF section 7.2.2 discusses energy, heat and work in the Carnot cycle." },
      "6.4": { pageStart: 99, pageEnd: 100, reason: "PDF sections 7.2.3 and 7.2.4 derive efficiency and the ideal-gas Carnot result." },
      "6.5": { pageStart: 101, pageEnd: 102, reason: "Example 7.1 is the numerical Carnot heat-engine example." },
      "6.6": { pageStart: 102, pageEnd: 107, reason: "PDF section 7.3 discusses the Carnot cycle as a refrigerator." },
      "6.7": { pageStart: 107, pageEnd: 108, reason: "Example 7.2 is the numerical Carnot refrigerator example." },
      "6.8": { pageStart: 108, pageEnd: 111, reason: "PDF section 7.4.1 and 7.4.2 describe the Stirling cycle without regenerator." },
      "6.9": { pageStart: 112, pageEnd: 113, reason: "PDF section 7.4.3 discusses entropy production in Stirling without regenerator." },
      "6.10": { pageStart: 113, pageEnd: 115, reason: "PDF section 7.5 introduces the Stirling engine with an alpha-type regenerator." },
      "6.11": { pageStart: 115, pageEnd: 126, reason: "PDF sections 7.5.3 and 7.5.4 develop the alpha Stirling engine stages and balances." }
    },
    topicAliases: {
      "6.1": ["Maquinas Termicas e Refrigeradores"],
      "6.2": ["Ciclo de Carnot"],
      "6.4": ["Eficiencia de Carnot"],
      "6.6": ["Carnot como Refrigerador", "Refrigerador de Carnot"],
      "6.8": ["Ciclo de Stirling"],
      "6.9": ["Entropia no Stirling"],
      "6.10": ["Motor de Stirling", "Regenerador Tipo Alfa"]
    }
  }
];

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value = "", minLength = 4) {
  return normalizeText(value)
    .split(" ")
    .filter(function (token) {
      return token.length >= minLength && !STOPWORDS.has(token);
    });
}

function truncateText(value = "", maxChars = 1600) {
  const text = String(value || "").trim();
  if (!text || text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf("\n\n"), sliced.lastIndexOf(". "));
  if (lastBreak >= Math.floor(maxChars * 0.55)) {
    return `${sliced.slice(0, lastBreak + 1).trim()}...`;
  }
  return `${sliced.trimEnd()}...`;
}

function loadChapterData(fileName) {
  return JSON.parse(
    requireText(resolve(DATA_DIR, fileName))
  );
}

function requireText(filePath) {
  return String(
    spawnSync("cat", [filePath], {
      cwd: ROOT_DIR,
      encoding: "utf8"
    }).stdout || ""
  );
}

function extractPdfPages(pdfPath) {
  function extractWithPdfPlumber() {
    const script = `
import json
import sys
import pdfplumber

pdf_path = sys.argv[1]
pages = []
with pdfplumber.open(pdf_path) as pdf:
    for index, page in enumerate(pdf.pages, start=1):
        text = page.extract_text(x_tolerance=1.5, y_tolerance=3) or ""
        pages.append({
            "pageNumber": index,
            "text": text
        })
json.dump(pages, sys.stdout, ensure_ascii=False)
`.trim();

    const result = spawnSync(PYTHON_BIN, ["-c", script, pdfPath], {
      cwd: ROOT_DIR,
      encoding: "utf8",
      env: process.env,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"]
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Falha ao extrair o PDF com ${PYTHON_BIN}.`);
    }

    return JSON.parse(result.stdout || "[]");
  }

  const pdfToTextResult = spawnSync(PDFTOTEXT_BIN, ["-q", "-layout", pdfPath, "-"], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"]
  });

  if (!pdfToTextResult.error && pdfToTextResult.status === 0 && pdfToTextResult.stdout) {
    const rawPages = String(pdfToTextResult.stdout).split("\f");
    const pages = rawPages
      .map(function (text, index) {
        return {
          pageNumber: index + 1,
          text: String(text || "").trim()
        };
      })
      .filter(function (page, index, list) {
        return page.text || index < list.length - 1;
      });

    if (pages.length) {
      const emptyPageCount = pages.filter((page) => !String(page.text || "").trim()).length;
      if (!emptyPageCount) return pages;

      const fallbackPages = extractWithPdfPlumber();
      const fallbackByPage = new Map(fallbackPages.map((page) => [page.pageNumber, page]));
      return pages.map(function (page) {
        if (String(page.text || "").trim()) return page;
        const fallback = fallbackByPage.get(page.pageNumber);
        if (!fallback || !String(fallback.text || "").trim()) return page;
        return {
          ...page,
          text: fallback.text,
          extractionSource: "pdfplumber-fallback"
        };
      });
    }
  }

  return extractWithPdfPlumber();
}

function normalizeWithIndex(value = "") {
  const normalizedChars = [];
  const sourceIndexes = [];
  let previousWasSpace = true;

  Array.from(String(value || "")).forEach(function (char, index) {
    const normalized = char
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " e ")
      .replace(/[^a-z0-9]+/g, " ");

    Array.from(normalized).forEach(function (normalizedChar) {
      if (/\s/.test(normalizedChar)) {
        if (!previousWasSpace) {
          normalizedChars.push(" ");
          sourceIndexes.push(index);
          previousWasSpace = true;
        }
        return;
      }

      normalizedChars.push(normalizedChar);
      sourceIndexes.push(index);
      previousWasSpace = false;
    });
  });

  return {
    text: normalizedChars.join("").trim(),
    sourceIndexes
  };
}

function findSourceIndexByMarker(content, marker) {
  if (!marker) return -1;
  const normalizedContent = normalizeWithIndex(content);
  const normalizedMarker = normalizeText(marker);
  if (!normalizedContent.text || !normalizedMarker) return -1;

  const normalizedIndex = normalizedContent.text.indexOf(normalizedMarker);
  if (normalizedIndex < 0) return -1;
  return normalizedContent.sourceIndexes[normalizedIndex] || 0;
}

function sliceContentByMarkers(content, override) {
  if (!override?.startMarker && !override?.endMarker) return content;

  const startIndex = findSourceIndexByMarker(content, override.startMarker);
  const endIndex = findSourceIndexByMarker(content, override.endMarker);
  const safeStart = startIndex >= 0 ? startIndex : 0;
  const safeEnd = endIndex > safeStart ? endIndex : content.length;

  return content.slice(safeStart, safeEnd).trim();
}

function getTopicAliases(config, topic) {
  return [
    topic.title || "",
    ...(config.topicAliases?.[topic.id] || [])
  ].filter(Boolean);
}

function countTokenHits(tokens, haystack) {
  return tokens.reduce(function (count, token) {
    return count + (haystack.includes(token) ? 1 : 0);
  }, 0);
}

function scorePageForTopic(page, topic, config) {
  const text = String(page.text || "");
  if (!text.trim()) return 0;

  const normalizedPage = normalizeText(text);
  const headingWindow = normalizedPage.slice(0, 1800);
  const aliases = getTopicAliases(config, topic);
  const aliasMatches = aliases.map(normalizeText).filter(Boolean);
  const titleTokens = tokenize(topic.title || "");
  const noteTokens = tokenize(topic.note || "", 5).slice(0, 8);

  let score = 0;

  aliasMatches.forEach(function (alias) {
    if (!alias) return;
    if (headingWindow.includes(alias)) {
      score = Math.max(score, 500 + alias.length);
    } else if (normalizedPage.includes(alias)) {
      score = Math.max(score, 360 + alias.length);
    }
  });

  const titleHitsHeading = countTokenHits(titleTokens, headingWindow);
  const titleHitsPage = countTokenHits(titleTokens, normalizedPage);
  const noteHitsHeading = countTokenHits(noteTokens, headingWindow);

  score += titleHitsHeading * 28;
  score += Math.max(0, titleHitsPage - titleHitsHeading) * 10;
  score += noteHitsHeading * 7;

  if (titleTokens.length && titleHitsHeading === titleTokens.length) {
    score += 120;
  }

  if (/\\bexemplo\\b/.test(normalizeText(topic.title || "")) && /\\bexemplo\\b/.test(headingWindow)) {
    score += 40;
  }

  return score;
}

function assignTopicStarts(topicPages, chapterEndPage) {
  const starts = [];
  let cursor = topicPages.length ? topicPages[0].rangeStart : 1;

  topicPages.forEach(function (entry, index) {
    const remaining = topicPages.length - index - 1;
    const latestStart = Math.max(cursor, chapterEndPage - remaining);
    const assigned = Math.min(Math.max(entry.bestPage, cursor), latestStart);
    starts.push(assigned);
    cursor = Math.min(assigned + 1, chapterEndPage);
  });

  return starts;
}

function buildSections(config, chapterData, pages, chapterEndPage) {
  const chapterPages = pages.filter(function (page) {
    return page.pageNumber >= config.startPage && page.pageNumber <= chapterEndPage;
  });

  const topicPlans = chapterData.topics.map(function (topic) {
    let bestPage = config.startPage;
    let bestScore = -1;

    chapterPages.forEach(function (page) {
      const score = scorePageForTopic(page, topic, config);
      if (score > bestScore) {
        bestPage = page.pageNumber;
        bestScore = score;
      }
    });

    return {
      topic,
      rangeStart: config.startPage,
      bestPage,
      bestScore: Math.max(0, bestScore)
    };
  });

  const starts = assignTopicStarts(topicPlans, chapterEndPage);

  function buildReference(entry, index, override, referenceIndex = 0) {
    const effectiveOverride = override || config.pageOverrides?.[entry.topic.id] || null;
    const pageStart = effectiveOverride?.pageStart || starts[index];
    const nextStart = starts[index + 1];
    const pageEnd = effectiveOverride?.pageEnd || (nextStart ? Math.max(pageStart, nextStart - 1) : chapterEndPage);
    const referencePages = chapterPages
      .filter(function (page) {
        return page.pageNumber >= pageStart && page.pageNumber <= pageEnd;
      });
    const rawContent = referencePages
      .map(function (page) {
        return String(page.text || "").trim();
      })
      .filter(Boolean)
      .join("\n\n");
    const content = sliceContentByMarkers(rawContent, effectiveOverride);

    return {
      id: `${config.id}:${entry.topic.id}:${referenceIndex + 1}`,
      label: effectiveOverride?.label || entry.topic.title || "",
      pdfChapterNumber: config.pdfChapterNumber,
      pdfChapterTitle: config.pdfChapterTitle,
      pageStart,
      pageEnd,
      startMarker: effectiveOverride?.startMarker || "",
      endMarker: effectiveOverride?.endMarker || "",
      mappingReason: effectiveOverride?.reason || "",
      extractionSources: Array.from(new Set(referencePages.map((page) => page.extractionSource || "pdftotext").filter(Boolean))),
      matchScore: entry.bestScore,
      needsReview: !effectiveOverride && entry.bestScore < 80,
      excerpt: truncateText(content, 1200),
      content: content.trim()
    };
  }

  return topicPlans.map(function (entry, index) {
    const referencePlans = Array.isArray(config.referenceOverrides?.[entry.topic.id])
      ? config.referenceOverrides[entry.topic.id]
      : [config.pageOverrides?.[entry.topic.id] || null];
    const references = referencePlans.map(function (referencePlan, referenceIndex) {
      if (referencePlan) {
        return buildReference(entry, index, referencePlan, referenceIndex);
      }
      return buildReference(entry, index, null, referenceIndex);
    });
    const content = references
      .map(function (reference) {
        return reference.content;
      })
      .filter(Boolean)
      .join("\n\n");
    const firstReference = references[0] || {};
    const lastReference = references[references.length - 1] || firstReference;

    return {
      chapterId: config.id,
      itemId: entry.topic.id,
      topicTitle: entry.topic.title || "",
      pagePath: entry.topic.url || "",
      pdfChapterNumber: config.pdfChapterNumber,
      pdfChapterTitle: config.pdfChapterTitle,
      pageStart: firstReference.pageStart || 0,
      pageEnd: lastReference.pageEnd || firstReference.pageEnd || 0,
      matchScore: entry.bestScore,
      mappingReason: references.map((reference) => reference.mappingReason).filter(Boolean).join(" | "),
      referenceCount: references.length,
      references,
      needsReview: references.some((reference) => reference.needsReview),
      excerpt: truncateText(content, 1600),
      content: content.trim()
    };
  });
}

function buildPageReferences(sections) {
  return sections.map(function (section) {
    return {
      pagePath: section.pagePath,
      chapterId: section.chapterId,
      itemId: section.itemId,
      topicTitle: section.topicTitle,
      referenceCount: section.referenceCount || 0,
      references: (section.references || []).map(function (reference) {
        return {
          id: reference.id,
          label: reference.label,
          pdfChapterNumber: reference.pdfChapterNumber,
          pdfChapterTitle: reference.pdfChapterTitle,
          pageStart: reference.pageStart,
          pageEnd: reference.pageEnd,
          startMarker: reference.startMarker,
          endMarker: reference.endMarker,
          mappingReason: reference.mappingReason,
          extractionSources: reference.extractionSources,
          needsReview: Boolean(reference.needsReview)
        };
      }),
      needsReview: Boolean(section.needsReview)
    };
  });
}

function main() {
  const pdfPath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_PDF_PATH;
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF nao encontrado em: ${pdfPath}`);
  }

  const pages = extractPdfPages(pdfPath);
  if (!pages.length) {
    throw new Error("Nao foi possivel extrair paginas do PDF.");
  }

  const sortedConfig = CHAPTER_CONFIG
    .slice()
    .sort(function (left, right) {
      return left.startPage - right.startPage;
    });

  const sections = [];
  const chapters = [];

  sortedConfig.forEach(function (config, index) {
    const chapterData = loadChapterData(config.data);
    const nextConfig = sortedConfig[index + 1] || null;
    const chapterEndPage = config.endPage || (nextConfig ? nextConfig.startPage - 1 : pages.length);
    const chapterSections = buildSections(config, chapterData, pages, chapterEndPage);

    chapters.push({
      chapterId: config.id,
      chapterTitle: chapterData.description || config.pdfChapterTitle,
      pdfChapterNumber: config.pdfChapterNumber,
      pdfChapterTitle: config.pdfChapterTitle,
      pageStart: config.startPage,
      pageEnd: chapterEndPage,
      topicCount: chapterSections.length
    });
    sections.push(...chapterSections);
  });

  const pageReferences = buildPageReferences(sections);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pdfSource: pdfPath,
        pageCount: pages.length,
        chapters,
        pageReferences,
        sections
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`Corpus salvo em ${OUTPUT_PATH}`);
  console.log(`Secoes geradas: ${sections.length}`);
}

main();
