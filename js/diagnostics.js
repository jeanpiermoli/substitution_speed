/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - MOTOR DE DIAGNÓSTICO
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Diagnósticos clínicos concisos, directos y libres de texto innecesario.
 */

const DiagnosticsEngine = (() => {
  const STUDY_CASES = [
    {
      id: 'case-1',
      title: '1. Negligencia',
      effort: 1.0,
      expectedV: 13.5,
      summary: 'Abandono crítico (x = 1.0)'
    },
    {
      id: 'case-2',
      title: '2. Equilibrio',
      effort: 4.0,
      expectedV: 9.0,
      summary: 'Mínimo de deterioro (x = 4.0)'
    },
    {
      id: 'case-3',
      title: '3. Asfixia',
      effort: 9.0,
      expectedV: 16.5,
      summary: 'Salto Heaviside (x = 9.0)'
    }
  ];

  const CALIBRATION_MATRIX = [
    {
      id: 'neglect',
      zoneName: 'Zona de Negligencia',
      effortRange: 'x ∈ [0, 1.5)',
      velocityRange: '12.14 a 25.0',
      example: 'x = 1.0 → V = 13.5',
      effortMeaning: 'Dar muy poco. Desatención, ausencia de acuerdos y falta de presencia.',
      systemState: 'Deterioro acelerado por inanición afectiva.',
      bondDiagnostic: 'La relación carece de energía de cohesión. El riesgo de ruptura o sustitución es inminente por desinterés prolongado.'
    },
    {
      id: 'optimal',
      zoneName: 'Zona de Equilibrio Óptimo',
      effortRange: 'x ∈ [1.5, 7.5]',
      velocityRange: '9.0 a 11.0',
      example: 'x = 4.0 → V = 9.0 (Ideal)',
      effortMeaning: 'La porción justa. Presencia atenta que respeta la autonomía y el espacio ajeno.',
      systemState: 'Máxima estabilidad y absorción elástica de la rutina.',
      bondDiagnostic: 'Salud sistémica óptima. El vínculo absorbe las fricciones cotidianas y el riesgo de reemplazo es el mínimo posible.'
    },
    {
      id: 'fatigue',
      zoneName: 'Zona de Fatiga por Sobreesfuerzo',
      effortRange: 'x ∈ (7.5, 8.0)',
      velocityRange: '11.0 a 15.8',
      example: 'x = 7.8 → V ≈ 11.5',
      effortMeaning: 'Dar de más. Hipervigilancia, demanda constante de validación y pérdida de autonomía.',
      systemState: 'Sobrecalentamiento estructural previo a la fractura.',
      bondDiagnostic: 'La estructura sufre por exceso de tensión. La presión constante agota la elasticidad natural del vínculo.'
    },
    {
      id: 'collapse',
      zoneName: 'Zona de Asfixia (Heaviside)',
      effortRange: 'x ≥ 8.0',
      velocityRange: 'V(x) ≥ 15.8',
      example: 'x = 9.0 → V = 16.5',
      effortMeaning: 'Invasión extrema. Control excesivo, pérdida total de límites personales y asfixia.',
      systemState: 'Límite de fluencia superado (+5 unidades irreversibles).',
      bondDiagnostic: 'Colapso por sobrecarga. El exceso de control y la asfixia destruyen el vínculo con mayor rapidez y violencia que el abandono.'
    }
  ];

  function getDiagnosticForEffort(x) {
    const clampedX = Math.max(0, Math.min(9.99, x));
    if (clampedX < 1.5) return CALIBRATION_MATRIX[0];
    if (clampedX <= 7.5) return CALIBRATION_MATRIX[1];
    if (clampedX < 8.0) return CALIBRATION_MATRIX[2];
    return CALIBRATION_MATRIX[3];
  }

  function getStudyCases() {
    return STUDY_CASES;
  }

  function getCalibrationMatrix() {
    return CALIBRATION_MATRIX;
  }

  return {
    getDiagnosticForEffort,
    getStudyCases,
    getCalibrationMatrix
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiagnosticsEngine;
}
