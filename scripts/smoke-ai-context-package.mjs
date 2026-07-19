import { buildAiExerciseContextPackage, buildAiExerciseContextPrompt } from "../lib/ai-context-package.mjs";

const samples = [
  {
    chapterId: "02",
    itemId: "2.3",
    pagePath: "/slides/capitulo-02/page_3.html",
    pageTitle: "Energia Livre de Helmholtz",
    difficulty: "medio"
  },
  {
    chapterId: "02",
    itemId: "2.4",
    pagePath: "/slides/capitulo-02/page_4.html",
    pageTitle: "Entalpia e Calor Isobarico",
    difficulty: "dificil"
  },
  {
    chapterId: "03",
    itemId: "3.1",
    pagePath: "/slides/capitulo-03/page_2.html",
    pageTitle: "Entropia, Gibbs e a Visao por Ensembles",
    difficulty: "medio"
  },
  {
    chapterId: "04",
    itemId: "4.1",
    pagePath: "/slides/capitulo-04/page_1.html",
    pageTitle: "Gas Real e Limites do Modelo Ideal",
    difficulty: "medio"
  }
];

for (const sample of samples) {
  const contextPackage = buildAiExerciseContextPackage(sample);
  const promptSection = buildAiExerciseContextPrompt(contextPackage);

  console.log("\n---");
  console.log(`${contextPackage.sectionId || sample.itemId} - ${sample.pageTitle}`);
  console.log(JSON.stringify({
    sectionId: contextPackage.sectionId,
    hasPrimaryBookSource: contextPackage.meta.hasPrimaryBookSource,
    hasTeachingSource: contextPackage.meta.hasTeachingSource,
    topicIndexFound: contextPackage.meta.topicIndexFound,
    relatedFragmentCount: contextPackage.meta.relatedFragmentCount,
    advancedSupportFragmentCount: contextPackage.meta.advancedSupportFragmentCount,
    primarySource: contextPackage.primarySource ? {
      topicTitle: contextPackage.primarySource.topicTitle,
      pdfChapterNumber: contextPackage.primarySource.pdfChapterNumber,
      pageStart: contextPackage.primarySource.pageStart,
      pageEnd: contextPackage.primarySource.pageEnd
    } : null,
    topicIndex: contextPackage.topicIndex,
    sourceReferences: contextPackage.sourceReferences.slice(0, 6)
  }, null, 2));
  console.log("\nPrompt preview:");
  console.log(promptSection.slice(0, 1200));
}
