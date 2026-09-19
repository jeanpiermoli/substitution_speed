/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - RENDERIZADOR LATEX (KaTeX)
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Renderiza fórmulas matemáticas editoriales sin signos de dólar visibles.
 */

const LatexRenderer = (() => {
  /**
   * Renderiza una expresión LaTeX en un elemento DOM específico.
   * Si KaTeX no estuviera disponible (ej. sin conexión a internet),
   * tiene un fallback elegante en texto formateado legible.
   */
  function render(container, latexString, displayMode = false) {
    if (!container) return;

    if (typeof katex !== 'undefined') {
      try {
        katex.render(latexString, container, {
          displayMode: displayMode,
          throwOnError: false
        });
        return;
      } catch (err) {
        console.warn('Error al renderizar KaTeX:', err);
      }
    }

    // Fallback limpio sin KaTeX
    container.textContent = latexString
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
      .replace(/\\sin/g, 'sin')
      .replace(/\\cos/g, 'cos')
      .replace(/\\ln/g, 'ln')
      .replace(/\\pi/g, 'π')
      .replace(/\\delta/g, 'δ')
      .replace(/\\mathcal\{H\}/g, 'ℋ')
      .replace(/\\int/g, '∫')
      .replace(/\\Delta/g, 'Δ');
  }

  /**
   * Escanea y renderiza todos los elementos con el atributo [data-latex]
   */
  function renderAll() {
    const elements = document.querySelectorAll('[data-latex]');
    elements.forEach(el => {
      const latex = el.getAttribute('data-latex');
      const isDisplay = el.getAttribute('data-display') === 'true';
      render(el, latex, isDisplay);
    });
  }

  return {
    render,
    renderAll
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LatexRenderer;
}
