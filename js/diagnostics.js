/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - MOTOR DE DIAGNÓSTICO & TEXTOS DEL PAPER
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Contiene los diagnósticos textuales, significados físicos de entrada y
 * matrices de calibración idénticas a las del paper.
 */

const DiagnosticsEngine = (() => {
  // Casos de Estudio Canónicos del Paper
  const STUDY_CASES = [
    {
      id: 'case-1',
      title: 'Caso 1: La Negligencia',
      subtitle: 'El sujeto sustituido por abandono',
      effort: 1.0,
      expectedV: 13.5,
      dotClass: 'dot-neglect',
      summary: 'Déficit severo de atención (x = 1.0)'
    },
    {
      id: 'case-2',
      title: 'Caso 2: El Equilibrio',
      subtitle: 'La porción perfecta de diseño',
      effort: 4.0,
      expectedV: 9.0,
      dotClass: 'dot-optimal',
      summary: 'Mínimo absoluto secular (x = 4.0)'
    },
    {
      id: 'case-3',
      title: 'Caso 3: La Saturación',
      subtitle: 'El sujeto sustituido por asfixia',
      effort: 9.0,
      expectedV: 16.5,
      dotClass: 'dot-collapse',
      summary: 'Colapso Heaviside activado (x = 9.0)'
    }
  ];

  // Matriz de Calibración General del Paper (Páginas 4, 5, 6 y 7)
  const CALIBRATION_MATRIX = [
    {
      id: 'neglect',
      zoneName: 'Zona de Colapso por Negligencia',
      effortRange: 'x ∈ [0, 1.5)',
      velocityRange: 'V(x) ∈ [12.14, 25.0]',
      example: 'x = 1.0 → V = 13.5',
      effortMeaning: 'Dar muy poco (Abandono): Ignorar a la pareja, ausencia total de comunicación, no destinar tiempo compartido y desatender por completo los acuerdos afectivos del vínculo.',
      systemState: 'La velocidad de sustitución es altísima. El sistema fracasa de forma acelerada por falta de energía de cohesión.',
      bondDiagnostic: 'La relación está muriendo por inanición energética. El costo de mantenerla sin atención activa es insostenible y el reemplazo es inminente.',
      physicalMeaning: 'Ruptura por abandono y desatención. La velocidad de sustitución supera con creces la capacidad de resistencia del sistema.'
    },
    {
      id: 'optimal',
      zoneName: 'Zona de Equilibrio Elástico (Óptimo)',
      effortRange: 'x ∈ [1.5, 7.5]',
      velocityRange: 'V(x) ∈ [9.0, 11.0]',
      example: 'x = 4.0 → V = 9.0 (Ideal)',
      effortMeaning: 'Dar la porción justa y equilibrada: Presencia activa, atención constante pero respetuosa del espacio ajeno, cuidado mutuo y gestión flexible de los problemas cotidianos.',
      systemState: 'Rango de máxima estabilidad. El riesgo de sustitución es el más bajo posible. La estructura se mantiene cohesionada y absorbe de manera flexible las fricciones diarias.',
      bondDiagnostic: 'La estructura goza de salud sistémica. El vínculo absorbe las fricciones diarias con máxima eficiencia y el riesgo de sustitución es técnicamente nulo.',
      physicalMeaning: 'Ruptura mínima e inercial. Es el suelo absoluto de la función. Representa el desgaste natural e inevitable de la convivencia, pero en su nivel mínimo.'
    },
    {
      id: 'fatigue',
      zoneName: 'Zona de Fatiga por Sobreinversión',
      effortRange: 'x ∈ (7.5, 8.0)',
      velocityRange: 'V(x) ∈ (11.0, 15.8)',
      example: 'x = 7.8 → V ≈ 11.5',
      effortMeaning: 'Dar de más (Tensión Previa): Empezar a sofocar a la pareja, hipervigilancia, llamadas excesivas, demanda de validación constante y pérdida de la propia autonomía.',
      systemState: 'El sistema comienza a sufrir por sobreesfuerzo. La velocidad de sustitución se acelera progresivamente, indicando desgaste acumulado.',
      bondDiagnostic: 'La relación está sobrecalentada. Aunque todavía no se ha roto del todo, la presión interna acelera la fatiga del material afectivo antes de fracturarse.',
      physicalMeaning: 'Ruptura por desgaste de sobrecarga. El sistema empieza a friccionar violentamente por hipervigilancia, perdiendo su flexibilidad elástica.'
    },
    {
      id: 'collapse',
      zoneName: 'Zona de Colapso Estructural por Asfixia',
      effortRange: 'x ≥ 8.0',
      velocityRange: 'V(x) ≥ 15.8',
      example: 'x = 9.0 → V = 16.5',
      effortMeaning: 'Dar en exceso extremo (Invasión Crítica): Acoso, control absoluto, invasión de la privacidad e incapacidad de dejar respirar al otro, activando la falla estructural.',
      systemState: 'Crisis severa. Se activa el umbral crítico de Heaviside (+5 unidades), provocando que el vínculo se rompa no por falta de atención, sino por un exceso violento de tensión mecánica.',
      bondDiagnostic: 'Colapso violento. El exceso de control y la falta de espacio vital destruyen el vínculo con mayor velocidad y violencia que la propia ausencia de atención.',
      physicalMeaning: 'Ruptura catastrófica por invasión. El sistema cruza el punto de fluencia de Heaviside; la velocidad de sustitución se dispara de golpe por saturación extrema.'
    }
  ];

  // Matriz de Desgaste Acumulado ΔD (Integral Definida - Páginas 13 y 14)
  const WEAR_MATRIX = [
    {
      id: 'delta-minor',
      range: 'ΔD ∈ [1, 10]',
      title: 'Zona de Ajuste Menor y Estabilidad Óptima',
      meaning: 'El costo de transición es mínimo. La relación opera dentro de los márgenes del equilibrio elástico, absorbiendo las variaciones cotidianas de manera fluida sin arrastrar deudas entrópicas significativas.'
    },
    {
      id: 'delta-rebuild',
      range: 'ΔD ∈ (10, 35]',
      title: 'Zona de Reconstrucción y Fricción Moderada',
      meaning: 'Refleja el precio de la reparación (en este rango se ubica el caso de estudio de 30.09 unidades: transición de x=1 a x=4). Demuestra que sanar un vínculo dañado exige que la estructura procese el pasado y soporte una adaptación transitoria antes de alcanzar la estabilidad.'
    },
    {
      id: 'delta-fatigue',
      range: 'ΔD ∈ (35, 60]',
      title: 'Zona de Fatiga Crítica y Sobrecarga',
      meaning: 'Muestra un desgaste extremo causado por el esfuerzo excesivo. La relación está sobrecalentada por el control y la vigilancia constante, lo que hace que pierda su capacidad natural para recuperarse y volver a la normalidad.'
    },
    {
      id: 'delta-collapse',
      range: 'ΔD > 60',
      title: 'Zona de Colapso Irreversible y Castigo Estructural',
      meaning: 'El sistema atraviesa niveles de asfixia profunda, acumulando un daño permanente que destruye por completo las posibilidades de recuperación y hace inevitable la ruptura.'
    }
  ];

  /**
   * Obtiene el diagnóstico completo para un valor de esfuerzo x
   */
  function getDiagnosticForEffort(x) {
    if (x < 1.5) return CALIBRATION_MATRIX[0];
    if (x <= 7.5) return CALIBRATION_MATRIX[1];
    if (x < 8.0) return CALIBRATION_MATRIX[2];
    return CALIBRATION_MATRIX[3];
  }

  return {
    STUDY_CASES,
    CALIBRATION_MATRIX,
    WEAR_MATRIX,
    getDiagnosticForEffort
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiagnosticsEngine;
}
