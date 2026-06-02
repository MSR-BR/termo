(function () {
  if (window.__termoPreviewRedirect) return;
  window.__termoPreviewRedirect = true;

  function injectResponsiveFixes() {
    if (document.getElementById("termo-cap3-responsive-fixes")) return;

    const style = document.createElement("style");
    style.id = "termo-cap3-responsive-fixes";
    style.textContent = `
      html,
      body {
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
      }

      .source-fragment,
      .source-embed,
      .source-embed > div,
      .cover-slide-root,
      .slide-root-container,
      .slide-root-canvas,
      .slide-main-canvas {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }

      .source-embed,
      .cover-slide-root,
      .slide-root-container,
      .slide-root-canvas,
      .slide-main-canvas {
        overflow: visible !important;
      }

      .source-embed > div,
      .cover-slide-root,
      .slide-root-container,
      .slide-root-canvas,
      .slide-main-canvas {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }

      .source-embed img,
      .source-embed svg,
      .source-embed canvas,
      .source-embed video,
      .cover-slide-root img,
      .slide-root-container img,
      .slide-root-canvas img,
      .slide-main-canvas img {
        max-width: 100% !important;
        height: auto !important;
      }

      mjx-container:not([display="true"]),
      mjx-container.MathJax:not([display="true"]),
      .source-embed mjx-container:not([display="true"]),
      .source-embed mjx-container.MathJax:not([display="true"]) {
        display: inline !important;
        max-width: none !important;
        overflow: visible !important;
        overflow-x: visible !important;
        vertical-align: baseline !important;
        line-height: 0 !important;
      }

      mjx-container:not([display="true"]) svg,
      mjx-container.MathJax:not([display="true"]) svg,
      .source-embed mjx-container:not([display="true"]) svg,
      .source-embed mjx-container.MathJax:not([display="true"]) svg {
        display: inline-block !important;
        max-width: none !important;
        overflow: visible !important;
        vertical-align: -0.18em !important;
      }

      mjx-container[display="true"],
      mjx-container.MathJax[display="true"],
      .source-embed mjx-container[display="true"],
      .source-embed mjx-container.MathJax[display="true"],
      .source-embed .math-box,
      .source-embed [class*="math-block"],
      .source-embed [class*="math-display"],
      .source-embed [class*="math-derivation"],
      .source-embed [class*="equation-display"],
      .source-embed [class*="formula-highlight"] {
        display: block !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        -webkit-overflow-scrolling: touch;
      }

      .source-embed table {
        max-width: 100% !important;
        border-collapse: collapse;
      }

      .source-embed th,
      .source-embed td {
        overflow-wrap: normal !important;
        word-break: normal !important;
      }

      @media (max-width: 980px) {
        .cover-slide-root,
        .slide-root-container,
        .slide-root-canvas,
        .slide-main-canvas,
        .main-content-layout {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
        }

        .cover-left-image-panel,
        .cover-right-content-panel,
        .left-column-exercise-stack,
        .right-column-exercise-stack {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }

        .source-embed [class*="content-grid"],
        .source-embed [class*="comparison-grid"],
        .source-embed [class*="ensemble-comparison-grid"],
        .source-embed [class*="gas-ideal-content-grid"],
        .source-embed [class*="grid-layout"] {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 16px !important;
        }

        .source-embed [class*="columns-container"],
        .source-embed [class*="columns-wrapper"],
        .source-embed [class*="comparison-columns"],
        .source-embed [class*="content-layout"],
        .source-embed [class*="layout-container"],
        .source-embed [class*="main-layout"],
        .source-embed [class*="main-content-wrapper"],
        .source-embed [class*="two-column"] {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
        }

        .source-embed [class*="left-"],
        .source-embed [class*="right-"],
        .source-embed [class*="-column"],
        .source-embed [class*="column"] {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }
      }

      @media (max-width: 700px) {
        body {
          padding: 10px !important;
        }

        .page {
          max-width: 100% !important;
          gap: 14px !important;
        }

        .hero,
        .card {
          border-radius: 18px !important;
        }

        .hero-inner,
        .card {
          padding: 18px !important;
        }

        .chapter-title {
          font-size: clamp(1.9rem, 11vw, 2.55rem) !important;
          line-height: 1.08 !important;
        }

        .cover-left-image-panel,
        .cover-left-image-panel img {
          height: 220px !important;
        }

        .cover-left-image-gradient-overlay,
        .cover-left-image-tint-overlay {
          display: none !important;
        }

        .cover-right-content-panel,
        .title-region-wrapper,
        .main-content-layout {
          padding: 20px !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .cover-main-title-heading,
        .title-main-heading {
          font-size: clamp(2rem, 11vw, 3rem) !important;
          line-height: 1.08 !important;
        }

        .cover-topics-preview-row {
          align-items: flex-start !important;
        }

        .source-embed [class*="main-content"],
        .source-embed [class*="content-layout"],
        .source-embed [class*="content-wrapper"],
        .source-embed [class*="main-layout"],
        .source-embed [class*="slide-root"],
        .source-embed [class*="slide-main"],
        .source-embed [class*="canvas"] {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        .source-embed [class*="card"],
        .source-embed [class*="box"],
        .source-embed [class*="module"],
        .source-embed [class*="panel"] {
          max-width: 100% !important;
        }

        .source-embed table {
          display: block !important;
          width: 100% !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
          font-size: clamp(0.78rem, 3.5vw, 0.95rem) !important;
        }

        .source-embed th,
        .source-embed td {
          padding: 8px !important;
          line-height: 1.35 !important;
        }

        .source-embed mjx-container[display="true"],
        .source-embed mjx-container.MathJax[display="true"] {
          font-size: 94% !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function typesetEmbeddedMath(attempts = 0) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") {
      if (attempts < 8) {
        window.setTimeout(() => typesetEmbeddedMath(attempts + 1), 300);
      }
      return;
    }

    const embeds = Array.from(document.querySelectorAll(".source-embed"));
    if (!embeds.length) return;

    try {
      if (typeof window.MathJax.typesetClear === "function") {
        window.MathJax.typesetClear(embeds);
      }
      window.MathJax.typesetPromise(embeds).catch((error) => {
        console.warn("Nao foi possivel recompor as equacoes do capitulo 3.", error);
      });
    } catch (error) {
      console.warn("Nao foi possivel preparar as equacoes do capitulo 3.", error);
    }
  }

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
    document.addEventListener("DOMContentLoaded", () => {
      injectResponsiveFixes();
      mountExercises();
      typesetEmbeddedMath();
    });
  } else {
    injectResponsiveFixes();
    mountExercises();
    typesetEmbeddedMath();
  }
})();
