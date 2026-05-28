(function () {
  if (window.__termoPreviewRedirect) return;
  window.__termoPreviewRedirect = true;

  if (location.protocol === "file:") {
    const marker = "/termo/";
    const markerIndex = location.pathname.lastIndexOf(marker);
    if (markerIndex !== -1) {
      const relativePath = location.pathname.slice(markerIndex + marker.length);
      const target = `http://127.0.0.1:4173/${relativePath}${location.search}${location.hash}`;
      location.replace(target);
      return;
    }
  }

  function mountExercises() {
    if (window.TermoAIExercise && typeof window.TermoAIExercise.autoMount === "function") {
      window.TermoAIExercise.autoMount(document);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountExercises);
  } else {
    mountExercises();
  }
})();
