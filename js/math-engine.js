/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - MOTOR MATEMÁTICO PURO
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Implementación canónica y auditada de las ecuaciones de estado afectivo:
 *  - Función de Estado: Velocidad de Ruptura V(x)
 *  - Función Derivada: Aceleración y Sensibilidad V'(x)
 *  - Función Integral: Acumulación de Desgaste D(x) y Transición ΔD
 */

const MathEngine = (() => {
  // Constantes y umbrales de contorno
  const X_MIN = 0;
  const X_MAX = 9.99;
  const HEAVISIDE_THRESHOLD = 8.0;
  const OPTIMAL_X = 4.0;
  const NEGLECT_THRESHOLD = 1.5;
  const FATIGUE_THRESHOLD = 7.5;

  /**
   * Escalón de Heaviside H(x - 8):
   * Vale 0 si x < 8, y vale 1 si x >= 8.
   */
  function heaviside(x) {
    return x >= HEAVISIDE_THRESHOLD ? 1 : 0;
  }

  /**
   * 1. Término de Carencia (Negligencia): C(x) = 25 / (x + 1)
   */
  function termCarencia(x) {
    return 25 / (x + 1);
  }

  /**
   * 2. Término de Saturación (Ley de Hooke / Asfixia): S(x) = x
   */
  function termSaturacion(x) {
    return x;
  }

  /**
   * 3. Fricción Cotidiana (Altibajos normales): F(x) = 0.5 * sin(π * x)
   */
  function termFriccion(x) {
    return 0.5 * Math.sin(Math.PI * x);
  }

  /**
   * 4. Falla Estructural por Sobrecarga: E(x) = 5 * H(x - 8)
   */
  function termHeaviside(x) {
    return 5 * heaviside(x);
  }

  /**
   * Función de Estado Completa: V(x)
   * V(x) = 25/(x+1) + x + 0.5*sin(π*x) + 5*H(x-8)
   */
  function calculateV(x) {
    const c = termCarencia(x);
    const s = termSaturacion(x);
    const f = termFriccion(x);
    const h = termHeaviside(x);
    const total = c + s + f + h;
    return {
      x,
      total,
      carencia: c,
      saturacion: s,
      friccion: f,
      heaviside: h,
      isHeavisideActive: x >= HEAVISIDE_THRESHOLD
    };
  }

  /**
   * Función de Estado Secular (sin ruido periódico de fricción):
   * V_sec(x) = 25/(x+1) + x + 5*H(x-8)
   */
  function calculateVSecular(x) {
    return termCarencia(x) + termSaturacion(x) + termHeaviside(x);
  }

  /**
   * Primera Derivada: V'(x) (Aceleración de la ruptura)
   * V'(x) = -25 / (x+1)^2 + 1 + (π/2)*cos(π*x) + 5*δ(x-8)
   */
  function calculateVPrime(x) {
    const dCarencia = -25 / Math.pow(x + 1, 2);
    const dSaturacion = 1;
    const dFriccion = (Math.PI / 2) * Math.cos(Math.PI * x);
    const isDiracImpulse = Math.abs(x - HEAVISIDE_THRESHOLD) < 0.05;
    const secular = dCarencia + dSaturacion;
    const continuousTotal = secular + dFriccion;

    return {
      x,
      total: continuousTotal,
      secular,
      dCarencia,
      dSaturacion,
      dFriccion,
      isDiracImpulse
    };
  }

  /**
   * Segunda Derivada Secular: V''(x) = 50 / (x + 1)^3
   * En x = 4: V''(4) = 50 / 125 = 0.4 > 0 (Confirma mínimo absoluto)
   */
  function calculateVDoublePrime(x) {
    return 50 / Math.pow(x + 1, 3);
  }

  /**
   * Antiderivada Indefinida Completa D(x):
   * D(x) = 25*ln(x+1) + 0.5*x^2 - (1 / (2*π))*cos(π*x) + 5*(x-8)*H(x-8)
   */
  function indefiniteIntegral(x, includeFriction = true) {
    const termLog = 25 * Math.log(x + 1);
    const termQuad = 0.5 * Math.pow(x, 2);
    const termRamp = x >= HEAVISIDE_THRESHOLD ? 5 * (x - HEAVISIDE_THRESHOLD) : 0;
    const termOsc = includeFriction ? -(1 / (2 * Math.PI)) * Math.cos(Math.PI * x) : 0;

    return termLog + termQuad + termRamp + termOsc;
  }

  /**
   * Integral Definida entre x1 y x2: ΔD = D(x2) - D(x1)
   * Modela el desgaste acumulado o costo de transición entre dos estados afectivos.
   * @param {number} x1 Estado inicial
   * @param {number} x2 Estado final
   * @param {boolean} secular Si es true, usa el modelo secular del paper (anula fricción)
   */
  function calculateDeltaD(x1, x2, secular = true) {
    const lower = Math.min(x1, x2);
    const upper = Math.max(x1, x2);

    const D_upper = indefiniteIntegral(upper, !secular);
    const D_lower = indefiniteIntegral(lower, !secular);
    const delta = D_upper - D_lower;

    return {
      x1: lower,
      x2: upper,
      deltaD: delta,
      secular
    };
  }

  /**
   * Clasificación de Zona según Esfuerzo x y Velocidad V(x)
   */
  function classifyEffortZone(x) {
    if (x < NEGLECT_THRESHOLD) {
      return {
        id: 'neglect',
        name: 'Zona de Colapso por Negligencia',
        range: '[0, 1.5)',
        badgeClass: 'badge-neglect',
        themeColor: 'var(--zone-neglect)',
        statusClass: 'neglect'
      };
    } else if (x <= FATIGUE_THRESHOLD) {
      return {
        id: 'optimal',
        name: 'Zona de Equilibrio Elástico (Óptimo)',
        range: '[1.5, 7.5]',
        badgeClass: 'badge-optimal',
        themeColor: 'var(--zone-optimal-bright)',
        statusClass: 'optimal'
      };
    } else if (x < HEAVISIDE_THRESHOLD) {
      return {
        id: 'fatigue',
        name: 'Zona de Fatiga por Sobreinversión',
        range: '(7.5, 8.0)',
        badgeClass: 'badge-fatigue',
        themeColor: 'var(--zone-fatigue)',
        statusClass: 'fatigue'
      };
    } else {
      return {
        id: 'collapse',
        name: 'Zona de Colapso Estructural por Asfixia',
        range: '≥ 8.0',
        badgeClass: 'badge-collapse',
        themeColor: 'var(--zone-collapse-bright)',
        statusClass: 'collapse'
      };
    }
  }

  /**
   * Clasificación de Desgaste Acumulado ΔD según tabla de página 13-14 del paper
   */
  function classifyDeltaD(deltaD) {
    if (deltaD <= 10) {
      return {
        id: 'delta-minor',
        range: '[1, 10]',
        name: 'Zona de Ajuste Menor y Estabilidad Óptima',
        badgeClass: 'badge-optimal',
        description: 'El costo de transición es mínimo. La relación opera dentro de los márgenes del equilibrio elástico, absorbiendo las variaciones cotidianas de manera fluida sin arrastrar deudas entrópicas significativas.'
      };
    } else if (deltaD <= 35) {
      return {
        id: 'delta-rebuild',
        range: '(10, 35]',
        name: 'Zona de Reconstrucción y Fricción Moderada',
        badgeClass: 'badge-optimal',
        description: 'Refleja el precio de la reparación. Demuestra que sanar un vínculo dañado exige que la estructura procese el pasado y soporte una adaptación transitoria antes de alcanzar la estabilidad (Caso del paper: 30.09 unidades).'
      };
    } else if (deltaD <= 60) {
      return {
        id: 'delta-fatigue',
        range: '(35, 60]',
        name: 'Zona de Fatiga Crítica y Sobrecarga',
        badgeClass: 'badge-fatigue',
        description: 'Muestra un desgaste extremo causado por el esfuerzo excesivo. La relación está sobrecalentada por el control y la vigilancia constante, perdiendo su elasticidad de recuperación.'
      };
    } else {
      return {
        id: 'delta-collapse',
        range: '> 60',
        name: 'Zona de Colapso Irreversible y Castigo Estructural',
        badgeClass: 'badge-collapse',
        description: 'El sistema atraviesa niveles de asfixia profunda, acumulando un daño permanente que destruye por completo las posibilidades de recuperación y hace inevitable la ruptura.'
      };
    }
  }

  /**
   * Generador de datos discretizados para gráficas (Muestreo de 0 a 10)
   */
  function generateCurveData(numPoints = 250) {
    const points = [];
    const step = X_MAX / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      const x = i * step;
      points.push(calculateV(x));
    }
    return points;
  }

  function generateDerivativeCurveData(numPoints = 250) {
    const points = [];
    const step = X_MAX / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      const x = i * step;
      points.push(calculateVPrime(x));
    }
    return points;
  }

  function generateIntegralCurveData(numPoints = 250) {
    const points = [];
    const step = X_MAX / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      const x = i * step;
      points.push({
        x,
        D_sec: indefiniteIntegral(x, false),
        D_full: indefiniteIntegral(x, true)
      });
    }
    return points;
  }

  return {
    X_MIN,
    X_MAX,
    HEAVISIDE_THRESHOLD,
    OPTIMAL_X,
    NEGLECT_THRESHOLD,
    FATIGUE_THRESHOLD,
    calculateV,
    calculateVSecular,
    calculateVPrime,
    calculateVDoublePrime,
    indefiniteIntegral,
    calculateDeltaD,
    classifyEffortZone,
    classifyDeltaD,
    generateCurveData,
    generateDerivativeCurveData,
    generateIntegralCurveData
  };
})();

// Exportar para entorno modular / navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathEngine;
}
