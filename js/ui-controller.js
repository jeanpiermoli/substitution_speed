/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - CONTROLADOR DE INTERFAZ (UI)
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Sincronización bidireccional, cambio de tema claro/oscuro, soporte táctil
 * móvil y actualización fluida en tiempo real.
 */

const UIController = (() => {
  let currentEffort = 4.0;
  let integralX1 = 1.0;
  let integralX2 = 4.0;
  let currentTab = 'velocity';

  function init() {
    setupThemeToggle();
    setupTabNavigation();
    setupEffortControls();
    setupPresetButtons();
    setupLayerToggles();
    setupIntegralControls();
    setupDerivativeCalculator();
    setupInteractiveZoneCards();

    // Sincronización del arrastre directo en Canvas (Touch & Drag)
    if (typeof ChartEngine !== 'undefined' && ChartEngine.onUserXChange) {
      ChartEngine.onUserXChange((x) => {
        currentEffort = x;
        const slider = document.getElementById('effort-slider');
        const numberInput = document.getElementById('effort-number-input');
        const derSlider = document.getElementById('derivative-x-slider');
        const derNumber = document.getElementById('derivative-x-number');

        if (slider) slider.value = x;
        if (numberInput) numberInput.value = parseFloat(x).toFixed(2);
        if (derSlider) derSlider.value = x;
        if (derNumber) derNumber.value = parseFloat(x).toFixed(2);

        updateAll(x, false); // false = no re-disparar setUserX en ChartEngine
      });
    }

    // Sincronización de arrastre de límites de integral
    if (typeof ChartEngine !== 'undefined' && ChartEngine.onIntegralBoundsChange) {
      ChartEngine.onIntegralBoundsChange((x1, x2) => {
        const inputX1 = document.getElementById('integral-x1');
        const inputX2 = document.getElementById('integral-x2');
        if (inputX1) inputX1.value = parseFloat(x1).toFixed(1);
        if (inputX2) inputX2.value = parseFloat(x2).toFixed(1);
        integralX1 = parseFloat(x1) || 0;
        integralX2 = parseFloat(x2) || 0;
        updateIntegralCalculation(false);
      });
    }

    // Render inicial
    updateAll(currentEffort, true);
    updateIntegralCalculation(true);
  }

  /**
   * 1. GESTOR DE TEMA CLARO / OSCURO (2 Colores Base + 1 Acento)
   */
  function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('dsp-theme') || 'dark';

    document.documentElement.setAttribute('data-theme', savedTheme);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('dsp-theme', next);

        // Notificar al motor gráfico para repintar con la paleta activa
        if (typeof ChartEngine !== 'undefined') {
          ChartEngine.render();
        }
      });
    }
  }

  /**
   * 2. NAVEGACIÓN ENTRE PESTAÑAS
   */
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        currentTab = targetTab;

        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabPanels.forEach(panel => {
          if (panel.id === `tab-${targetTab}`) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });

        if (typeof ChartEngine !== 'undefined') {
          ChartEngine.setMode(targetTab);
        }

        if (targetTab === 'derivative') {
          updateDerivativeView();
        } else if (targetTab === 'integral') {
          updateIntegralCalculation(true);
        }

        if (typeof LatexRenderer !== 'undefined') {
          LatexRenderer.renderAll();
        }
      });
    });
  }

  /**
   * 3. CONTROLES DE ESFUERZO (SLIDER + INPUT)
   */
  function setupEffortControls() {
    const slider = document.getElementById('effort-slider');
    const numberInput = document.getElementById('effort-number-input');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentEffort = val;
        if (numberInput) numberInput.value = val.toFixed(2);
        updateAll(val, true);
      });
    }

    if (numberInput) {
      numberInput.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        val = Math.max(0, Math.min(9.99, val));
        currentEffort = val;
        if (slider) slider.value = val;
        updateAll(val, true);
      });
    }
  }

  /**
   * 4. BOTONES PRESET DE CASOS DEL PAPER
   */
  function setupPresetButtons() {
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetX = parseFloat(btn.getAttribute('data-effort'));
        setEffortValue(targetX);
      });
    });
  }

  function setEffortValue(val) {
    currentEffort = Math.max(0, Math.min(9.99, val));
    const slider = document.getElementById('effort-slider');
    const numberInput = document.getElementById('effort-number-input');

    if (slider) slider.value = currentEffort;
    if (numberInput) numberInput.value = currentEffort.toFixed(2);

    updateAll(currentEffort, true);
  }

  /**
   * 5. FILTROS DE CAPAS DE LA GRÁFICA
   */
  function setupLayerToggles() {
    const pills = document.querySelectorAll('.layer-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const layer = pill.getAttribute('data-layer');
        pill.classList.toggle('active');
        const isActive = pill.classList.contains('active');
        if (typeof ChartEngine !== 'undefined') {
          ChartEngine.toggleLayer(layer, isActive);
        }
      });
    });
  }

  /**
   * 6. CONTROLES DEL MODO INTEGRAL
   */
  function setupIntegralControls() {
    const inputX1 = document.getElementById('integral-x1');
    const inputX2 = document.getElementById('integral-x2');
    const btnPreset = document.getElementById('btn-preset-integral-study');

    if (inputX1) {
      inputX1.addEventListener('input', (e) => {
        integralX1 = parseFloat(e.target.value) || 0;
        updateIntegralCalculation(true);
      });
    }

    if (inputX2) {
      inputX2.addEventListener('input', (e) => {
        integralX2 = parseFloat(e.target.value) || 0;
        updateIntegralCalculation(true);
      });
    }

    if (btnPreset) {
      btnPreset.addEventListener('click', () => {
        integralX1 = 1.0;
        integralX2 = 4.0;
        if (inputX1) inputX1.value = '1.0';
        if (inputX2) inputX2.value = '4.0';
        updateIntegralCalculation(true);
      });
    }
  }

  /**
   * 7. CALCULADORA DE LA DERIVADA
   */
  function setupDerivativeCalculator() {
    const slider = document.getElementById('derivative-x-slider');
    const numberInput = document.getElementById('derivative-x-number');

    function sync(val) {
      const v = Math.max(0, Math.min(9.99, parseFloat(val) || 0));
      currentEffort = v;
      if (slider) slider.value = v;
      if (numberInput) numberInput.value = v.toFixed(2);
      updateDerivativeView();
      if (typeof ChartEngine !== 'undefined') {
        ChartEngine.setUserX(v);
      }
    }

    if (slider) {
      slider.addEventListener('input', (e) => sync(parseFloat(e.target.value)));
    }
    if (numberInput) {
      numberInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) sync(val);
      });
    }
  }

  /**
   * 8. TARJETAS INTERACTIVAS DE ZONAS (PESTAÑA 4)
   */
  function setupInteractiveZoneCards() {
    const zoneEfforts = {
      neglect: 1.0,
      optimal: 4.0,
      fatigue: 7.8,
      collapse: 9.0
    };

    const cards = document.querySelectorAll('.zone-card-btn, .zone-legend-item');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const zone = card.getAttribute('data-zone');
        if (zone && zoneEfforts[zone] !== undefined) {
          setEffortValue(zoneEfforts[zone]);
          // Cambiar automáticamente a la pestaña del simulador
          const velTabBtn = document.getElementById('tab-btn-velocity');
          if (velTabBtn) velTabBtn.click();
        }
      });
    });
  }

  /**
   * 9. ACTUALIZACIÓN CENTRAL
   */
  function updateAll(effort, notifyChart = true) {
    const vResult = MathEngine.calculateV(effort);
    const zone = MathEngine.classifyEffortZone(effort);
    const diagnostic = DiagnosticsEngine.getDiagnosticForEffort(effort);

    // 1. Cifra principal
    const velElem = document.getElementById('velocity-value');
    if (velElem) velElem.textContent = vResult.total.toFixed(2);

    // 2. Badge de estado
    const badge = document.getElementById('status-badge');
    if (badge) badge.textContent = zone.name;

    // 3. Telemetría móvil fija
    const mX = document.getElementById('mobile-live-x');
    const mV = document.getElementById('mobile-live-v');
    const mBadge = document.getElementById('mobile-live-badge');
    if (mX) mX.textContent = effort.toFixed(2);
    if (mV) mV.textContent = vResult.total.toFixed(2);
    if (mBadge) mBadge.textContent = zone.name;

    // 4. Sumandos de la ecuación
    updateTermValue('term-val-carencia', vResult.carencia.toFixed(2));
    updateTermValue('term-val-saturacion', vResult.saturacion.toFixed(2));
    updateTermValue('term-val-friccion', vResult.friccion.toFixed(2));
    updateTermValue('term-val-heaviside', vResult.heaviside.toFixed(1));

    const heavisideSwitch = document.getElementById('heaviside-switch-indicator');
    if (heavisideSwitch) {
      if (vResult.isHeavisideActive) {
        heavisideSwitch.textContent = '+5.0 (Activo)';
        heavisideSwitch.className = 'heaviside-switch on';
      } else {
        heavisideSwitch.textContent = '0.0 (Apagado)';
        heavisideSwitch.className = 'heaviside-switch off';
      }
    }

    // 5. Alerta de Heaviside
    const alertBox = document.getElementById('heaviside-critical-alert');
    if (alertBox) {
      alertBox.style.display = vResult.isHeavisideActive ? 'flex' : 'none';
    }

    // 6. Textos de diagnóstico
    setTextContentSmoothly('diagnostic-bond-text', diagnostic.bondDiagnostic);
    setTextContentSmoothly('diagnostic-effort-text', diagnostic.effortMeaning);

    // 7. Resaltar Preset activo
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      const bEffort = parseFloat(btn.getAttribute('data-effort'));
      btn.classList.toggle('active', Math.abs(bEffort - effort) < 0.05);
    });

    // 8. Resaltar Zona activa en leyenda y tarjetas
    const zoneElements = document.querySelectorAll('.zone-legend-item, .zone-card-btn');
    zoneElements.forEach(el => {
      const elZone = el.getAttribute('data-zone');
      el.classList.toggle('active-zone', elZone === zone.id);
    });

    // 9. Sincronizar motor gráfico
    if (notifyChart && typeof ChartEngine !== 'undefined') {
      ChartEngine.setUserX(effort);
    }

    if (currentTab === 'derivative') {
      updateDerivativeView();
    }
  }

  function updateTermValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setTextContentSmoothly(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent.trim() === text.trim()) return;
    el.textContent = text;
  }

  function updateDerivativeView() {
    const primeRes = MathEngine.calculateVPrime(currentEffort);
    const valElem = document.getElementById('derivative-current-val');
    const secElem = document.getElementById('derivative-secular-val');

    if (valElem) valElem.textContent = primeRes.total.toFixed(4);
    if (secElem) secElem.textContent = primeRes.secular.toFixed(4);
  }

  function updateIntegralCalculation(notifyChart = true) {
    const resSecular = MathEngine.calculateDeltaD(integralX1, integralX2, true);
    const resFull = MathEngine.calculateDeltaD(integralX1, integralX2, false);
    const classification = MathEngine.classifyDeltaD(resFull.deltaD);

    const valElem = document.getElementById('integral-result-delta-d');
    if (valElem) valElem.textContent = `${resFull.deltaD.toFixed(2)} u`;

    const fullValElem = document.getElementById('integral-result-full-d');
    if (fullValElem) fullValElem.textContent = `${resSecular.deltaD.toFixed(2)} u (secular)`;

    const badgeElem = document.getElementById('integral-zone-badge');
    if (badgeElem) badgeElem.textContent = classification.name;

    const descElem = document.getElementById('integral-interpretation-text');
    if (descElem) descElem.textContent = classification.description;

    if (notifyChart && typeof ChartEngine !== 'undefined') {
      ChartEngine.setIntegralBounds(integralX1, integralX2);
    }
  }

  return {
    init,
    updateAll,
    setEffortValue,
    updateIntegralCalculation
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
