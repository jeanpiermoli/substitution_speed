/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - BOOTSTRAPPER PRINCIPAL
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Iniciando Simulador: Dinámica de Sistemas Interpersonales (Jan Pier Molina Castaño, 2026)');

  // 1. Inicializar motor gráfico
  const canvas = document.getElementById('state-chart-canvas');
  if (canvas) {
    ChartEngine.init(canvas);
  }

  // 2. Inicializar controlador de interfaz
  UIController.init();

  // 3. Renderizar fórmulas con KaTeX (sin signos de dólar)
  if (typeof LatexRenderer !== 'undefined') {
    LatexRenderer.renderAll();
  }

  // Re-render en caso de que KaTeX cargue asíncronamente desde el CDN
  window.addEventListener('load', () => {
    if (typeof LatexRenderer !== 'undefined') {
      LatexRenderer.renderAll();
    }
  });
});
