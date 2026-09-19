/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - CONTROLADOR DE INTERFAZ (UI)
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Maneja eventos de usuario, sincronización de sliders, inputs, presets,
 * diagnósticos en vivo, carga de foto de autor y cambio de pestañas.
 */

const UIController = (() => {
  // Estado local de la UI
  let currentEffort = 4.0;
  let integralX1 = 1.0;
  let integralX2 = 4.0;
  let currentTab = 'velocity';

  /**
   * Inicializa todos los elementos interactivos del DOM
   */
  function init() {
    setupTabNavigation();
    setupEffortControls();
    setupPresetButtons();
    setupLayerToggles();
    setupIntegralControls();
    setupDerivativeCalculator();
    // Register chart user-X drag callback so UI inputs stay in sync
    if (typeof ChartEngine !== 'undefined' && ChartEngine.onUserXChange) {
      ChartEngine.onUserXChange((x) => {
        const slider = document.getElementById('derivative-x-slider');
        const numberInput = document.getElementById('derivative-x-number');
        if (slider) slider.value = x;
        if (numberInput) numberInput.value = parseFloat(x).toFixed(2);
        // Update displayed metric
        const res = MathEngine.calculateVPrime(x);
        const displayElem = document.getElementById('derivative-current-val');
        if (displayElem) displayElem.textContent = res.total.toFixed(4);
      });
    }
    // Register integral bounds drag callback so UI inputs stay in sync
    if (typeof ChartEngine !== 'undefined' && ChartEngine.onIntegralBoundsChange) {
      ChartEngine.onIntegralBoundsChange((x1, x2) => {
        const inputX1 = document.getElementById('integral-x1');
        const inputX2 = document.getElementById('integral-x2');
        if (inputX1) inputX1.value = parseFloat(x1).toFixed(2);
        if (inputX2) inputX2.value = parseFloat(x2).toFixed(2);
        // Update integral numeric summary
        integralX1 = parseFloat(x1) || 0;
        integralX2 = parseFloat(x2) || 0;
        updateIntegralCalculation();
      });
    }
    setupAuthorPhotoUpload();

    // Render inicial
    updateAll(currentEffort);
    updateIntegralCalculation();
    setupTableInteractions();
  }

  /**
   * 11. CONTROLES DE LA CALCULADORA DE LA DERIVADA (Pestaña Derivative)
   */
  function setupDerivativeCalculator() {
    const slider = document.getElementById('derivative-x-slider');
    const numberInput = document.getElementById('derivative-x-number');
    const btnCalc = document.getElementById('btn-eval-derivative');

    function syncAndCompute(val) {
      const v = Math.max(0, Math.min(9.99, parseFloat(val) || 0));
      if (slider) slider.value = v;
      if (numberInput) numberInput.value = v.toFixed(2);
      const res = MathEngine.calculateVPrime(v);
      const displayElem = document.getElementById('derivative-current-val');
      if (displayElem) displayElem.textContent = res.total.toFixed(4);
      // Also highlight the user X in the chart and re-render derivative viewport
      ChartEngine.setUserX(v);
      if (currentTab === 'derivative') {
        ChartEngine.setMode('derivative');
      }
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        syncAndCompute(val);
      });
    }

    if (numberInput) {
      numberInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        syncAndCompute(val);
      });
    }

    if (btnCalc) {
      btnCalc.addEventListener('click', () => {
        const val = parseFloat(numberInput ? numberInput.value : (slider ? slider.value : currentEffort)) || 0;
        syncAndCompute(val);
      });
    }
  }

  /**
   * Transición de texto suave que previene parpadeos y cambios bruscos
   */
  function setTextContentSmoothly(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent.trim() === text.trim()) return;

    el.classList.add('fading');
    setTimeout(() => {
      el.textContent = text;
      el.classList.remove('fading');
    }, 140);
  }

  function setEffortValue(val) {
    currentEffort = Math.max(0, Math.min(9.99, val));
    const slider = document.getElementById('effort-slider');
    const numberInput = document.getElementById('effort-number-input');
    if (slider) slider.value = currentEffort;
    if (numberInput) numberInput.value = currentEffort.toFixed(2);

    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      const bEffort = parseFloat(btn.getAttribute('data-effort'));
      if (Math.abs(bEffort - currentEffort) < 0.05) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateAll(currentEffort);
  }

  /**
   * Interactividad en las filas de las tablas (clic para fijar ese estado)
   */
  function setupTableInteractions() {
    const zoneEfforts = {
      neglect: 1.0,
      optimal: 4.0,
      fatigue: 7.8,
      collapse: 9.0
    };

    const allClickableRows = document.querySelectorAll('.calibration-row, .mini-matrix-row');
    allClickableRows.forEach(row => {
      row.addEventListener('click', () => {
        const zone = row.getAttribute('data-zone');
        if (zone && zoneEfforts[zone] !== undefined) {
          setEffortValue(zoneEfforts[zone]);
        }
      });
    });
  }

  /**
   * 1. NAVEGACIÓN ENTRE PESTAÑAS (MODOS DE LA APLICACIÓN)
   */
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        currentTab = targetTab;

        // Actualizar botones
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Actualizar paneles visibles
        tabPanels.forEach(panel => {
          if (panel.id === `tab-${targetTab}`) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });

        // Actualizar modo en el motor gráfico
        ChartEngine.setMode(targetTab);

        if (targetTab === 'derivative') {
          updateDerivativeView();
        } else if (targetTab === 'integral') {
          updateIntegralCalculation();
        }

        // Re-renderizar KaTeX si hay nuevas fórmulas en la vista
        if (typeof LatexRenderer !== 'undefined') {
          LatexRenderer.renderAll();
        }
      });
    });
  }

  /**
   * 2. CONTROLES DUALES DE ESFUERZO (SLIDER + INPUT NUMÉRICO)
   */
  function setupEffortControls() {
    const slider = document.getElementById('effort-slider');
    const numberInput = document.getElementById('effort-number-input');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentEffort = val;
        if (numberInput) numberInput.value = val.toFixed(2);
        updateAll(val);
      });
    }

    if (numberInput) {
      numberInput.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        val = Math.max(0, Math.min(9.99, val));
        currentEffort = val;
        if (slider) slider.value = val;
        updateAll(val);
      });
    }
  }

  /**
   * 3. BOTONES DE CASOS DE ESTUDIO DEL PAPER
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

  /**
   * 4. TOGGLES DE CAPAS DE LA GRÁFICA (DESGLOSE VISUAL)
   */
  function setupLayerToggles() {
    const pills = document.querySelectorAll('.layer-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const layer = pill.getAttribute('data-layer');
        pill.classList.toggle('active');
        const isActive = pill.classList.contains('active');
        ChartEngine.toggleLayer(layer, isActive);
      });
    });
  }

  /**
   * 5. CONTROLES DEL MODO INTEGRAL (TRANSICIÓN x1 -> x2)
   */
  function setupIntegralControls() {
    const inputX1 = document.getElementById('integral-x1');
    const inputX2 = document.getElementById('integral-x2');
    const btnPreset1to4 = document.getElementById('btn-preset-integral-study');

    if (inputX1) {
      inputX1.addEventListener('input', (e) => {
        integralX1 = parseFloat(e.target.value) || 0;
        updateIntegralCalculation();
      });
    }

    if (inputX2) {
      inputX2.addEventListener('input', (e) => {
        integralX2 = parseFloat(e.target.value) || 0;
        updateIntegralCalculation();
      });
    }

    if (btnPreset1to4) {
      btnPreset1to4.addEventListener('click', () => {
        integralX1 = 1.0;
        integralX2 = 4.0;
        if (inputX1) inputX1.value = '1.0';
        if (inputX2) inputX2.value = '4.0';
        updateIntegralCalculation();
      });
    }
  }

  /**
   * 6. ACTUALIZACIÓN CENTRAL DE LA CALCULADORA
   */
  function updateAll(effort) {
    const vResult = MathEngine.calculateV(effort);
    const zone = MathEngine.classifyEffortZone(effort);
    const diagnostic = DiagnosticsEngine.getDiagnosticForEffort(effort);

    // Actualizar Cifra Principal de Velocidad V(x)
    const velElem = document.getElementById('velocity-value');
    if (velElem) velElem.textContent = vResult.total.toFixed(2);

    // Actualizar Velocímetro / Hero Container
    const heroBox = document.getElementById('velocity-hero-box');
    if (heroBox) {
      heroBox.className = `velocity-hero ${zone.statusClass}`;
    }

    // Actualizar Badge de Estado
    const badge = document.getElementById('status-badge');
    if (badge) {
      badge.textContent = zone.name;
      badge.className = `status-badge ${zone.badgeClass}`;
    }

    // Actualizar Indicadores de Variables X e Y
    const liveX = document.getElementById('var-x-live-val');
    if (liveX) liveX.textContent = effort.toFixed(2);
    const liveY = document.getElementById('var-y-live-val');
    if (liveY) liveY.textContent = vResult.total.toFixed(2);

    // Actualizar Cajas de Sumandos Numéricos
    updateTermValue('term-val-carencia', vResult.carencia.toFixed(3));
    updateTermValue('term-val-saturacion', vResult.saturacion.toFixed(2));
    updateTermValue('term-val-friccion', vResult.friccion.toFixed(3));
    updateTermValue('term-val-heaviside', vResult.heaviside.toFixed(1));

    const heavisideSwitch = document.getElementById('heaviside-switch-indicator');
    if (heavisideSwitch) {
      if (vResult.isHeavisideActive) {
        heavisideSwitch.textContent = 'ACTIVO (+5.0)';
        heavisideSwitch.className = 'heaviside-switch on';
      } else {
        heavisideSwitch.textContent = 'APAGADO (0.0)';
        heavisideSwitch.className = 'heaviside-switch off';
      }
    }

    // Actualizar Cajas de Texto de Diagnóstico con Transición Suave
    setTextContentSmoothly('diagnostic-bond-text', diagnostic.bondDiagnostic);
    setTextContentSmoothly('diagnostic-effort-text', diagnostic.effortMeaning);
    setTextContentSmoothly('diagnostic-system-text', diagnostic.systemState);

    // Actualizar Alerta de Heaviside si aplica
    const alertBox = document.getElementById('heaviside-critical-alert');
    if (alertBox) {
      alertBox.style.display = vResult.isHeavisideActive ? 'flex' : 'none';
    }

    // Resaltar fila activa en la Matriz de Calibración y en la Mini-Matriz
    highlightActiveTableRow(zone.id);

    // Notificar al motor gráfico
    ChartEngine.setUserX(effort);

    // Si la pestaña actual es la derivada, actualizar sus métricas
    if (currentTab === 'derivative') {
      updateDerivativeView();
    }
  }

  function updateTermValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /**
   * 7. ACTUALIZACIÓN DEL ANÁLISIS DIFERENCIAL (DERIVADA)
   */
  function updateDerivativeView() {
    const primeRes = MathEngine.calculateVPrime(currentEffort);
    const vDoublePrime = MathEngine.calculateVDoublePrime(currentEffort);

    const valElem = document.getElementById('derivative-current-val');
    if (valElem) valElem.textContent = primeRes.total.toFixed(4);

    const secElem = document.getElementById('derivative-secular-val');
    if (secElem) secElem.textContent = primeRes.secular.toFixed(4);

    // Second derivative display removed from UI per request; no DOM update needed.

    const diracAlert = document.getElementById('dirac-impulse-notice');
    if (diracAlert) {
      diracAlert.style.display = currentEffort >= 7.95 && currentEffort <= 8.05 ? 'block' : 'none';
    }
  }

  /**
   * 8. ACTUALIZACIÓN DEL ANÁLISIS INTEGRAL (DESGASTE ACUMULADO)
   */
  function updateIntegralCalculation() {
    const resSecular = MathEngine.calculateDeltaD(integralX1, integralX2, true);
    const resFull = MathEngine.calculateDeltaD(integralX1, integralX2, false);
    const classification = MathEngine.classifyDeltaD(resFull.deltaD);

    const valElem = document.getElementById('integral-result-delta-d');
    if (valElem) valElem.textContent = `${resFull.deltaD.toFixed(2)} unidades`;

    const fullValElem = document.getElementById('integral-result-full-d');
    if (fullValElem) fullValElem.textContent = `${resSecular.deltaD.toFixed(2)} u (secular pura)`;

    const badgeElem = document.getElementById('integral-zone-badge');
    if (badgeElem) {
      badgeElem.textContent = classification.name;
      badgeElem.className = `status-badge ${classification.badgeClass}`;
    }

    const descElem = document.getElementById('integral-interpretation-text');
    if (descElem) {
      setTextContentSmoothly('integral-interpretation-text', classification.description);
    }

    // Actualizar gráfico en modo integral
    ChartEngine.setIntegralBounds(integralX1, integralX2);
  }

  /**
   * 9. RESALTADO DINÁMICO EN LA MATRIZ DE CALIBRACIÓN Y MINI-MATRIZ
   */
  function highlightActiveTableRow(activeZoneId) {
    // 1. Filas de la tabla general en Pestaña 4
    const rows = document.querySelectorAll('.calibration-row');
    rows.forEach(row => {
      const zoneId = row.getAttribute('data-zone');
      if (zoneId === activeZoneId) {
        row.classList.add('active-row');
      } else {
        row.classList.remove('active-row');
      }
    });

    // 2. Filas de la mini-matriz contextual en Pestaña 1
    const miniRows = document.querySelectorAll('.mini-matrix-row');
    miniRows.forEach(row => {
      const zoneId = row.getAttribute('data-zone');
      const isMatch = zoneId === activeZoneId;
      row.classList.toggle('active-zone', isMatch);
      const pinContainer = row.querySelector('.active-pin-container');
      if (pinContainer) {
        pinContainer.innerHTML = isMatch ? '<span class="active-pin"><svg class="icon-svg icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg> Estás aquí</span>' : '';
      }
    });
  }

  /**
   * 10. GESTIÓN DE LA FOTO DE AUTOR (SUBIDA LOCAL + PERSISTENCIA)
   */
  function setupAuthorPhotoUpload() {
    // Photo upload functionality removed per request; no UI elements present
    const headerAvatar = document.getElementById('author-header-avatar');
    const cardAvatar = document.getElementById('author-card-avatar');
    const fallbackAvatars = document.querySelectorAll('.author-avatar-fallback');
    // Ensure no stored photo remains
    try { localStorage.removeItem('autor_photo_data'); } catch (e) {}
  }

  return {
    init,
    updateAll,
    updateIntegralCalculation
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
