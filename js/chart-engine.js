/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - MOTOR GRÁFICO CIENTÍFICO (CANVAS 2D)
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Renderizado de alta resolución (HiDPI / Retina) acelerado por hardware:
 *  - Plano cartesiano con grilla milimétrica y escalas exactas.
 *  - 4 Zonas de calibración coloreadas con fondos fríos y bordes translúcidos.
 *  - Trazo continuo de V(x), V'(x) y descomposición de sumandos.
 *  - Nodo interactivo flotante con halo radiante y mirilla telescópica.
 *  - Sombreado de área bajo la curva para la integral definida ΔD.
 */

const ChartEngine = (() => {
  const canvases = {
    velocity: { el: null, ctx: null },
    derivative: { el: null, ctx: null },
    integral: { el: null, ctx: null }
  };

  let ctx = null; // Contexto activo actual durante render
  let currentMode = 'velocity'; // 'velocity', 'derivative', 'integral'
  let currentUserX = 4.0;
  // Displayed (animated) positions used for smooth transitions
  let displayedUserX = 4.0;
  let displayedIntegralX1 = 1.0;
  let displayedIntegralX2 = 4.0;
  let integralX1 = 1.0;
  let integralX2 = 4.0;
  let rafId = null; // requestAnimationFrame id para debouncing
  let layers = {
    carencia: false,
    saturacion: false,
    friccion: false,
    heaviside: false
  };

  // Pointer interaction state for derivative canvas
  let isPointerDown = false;
  let hoverX = null;
  let userXChangeCb = null;
  // Integral drag state
  let isDraggingIntegral = false;
  let activeIntegralHandle = null; // 'x1' or 'x2' or null
  let integralBoundsChangeCb = null;

  // Configuración de visualización y márgenes
  const MARGINS = { top: 30, right: 35, bottom: 45, left: 55 };

  /**
   * Inicializa los lienzos de las 3 vistas y los listeners de redimensionamiento
   */
  function init(canvasElement) {
    const vEl = canvasElement || document.getElementById('state-chart-canvas');
    const dEl = document.getElementById('derivative-chart-canvas');
    const iEl = document.getElementById('integral-chart-canvas');

    if (vEl) canvases.velocity = { el: vEl, ctx: vEl.getContext('2d') };
    if (dEl) canvases.derivative = { el: dEl, ctx: dEl.getContext('2d') };
    if (iEl) canvases.integral = { el: iEl, ctx: iEl.getContext('2d') };

    resizeAll();
    window.addEventListener('resize', () => {
      resizeAll();
      render();
    });

    // Attach pointer handlers to derivative canvas for interactivity
    if (canvases.derivative && canvases.derivative.el) {
      const derEl = canvases.derivative.el;
      derEl.style.touchAction = 'none';

      derEl.addEventListener('pointerdown', (ev) => {
        try { derEl.setPointerCapture(ev.pointerId); } catch (e) {}
        isPointerDown = true;
        const x = pointerEventToDomainX(ev, derEl);
        if (x != null) {
          currentUserX = x;
          displayedUserX = x; // snap while dragging for immediacy
          scheduleRender();
          ensureAnimationLoop();
          if (userXChangeCb) userXChangeCb(currentUserX);
        }
      });

      derEl.addEventListener('pointermove', (ev) => {
        const x = pointerEventToDomainX(ev, derEl);
        if (isPointerDown) {
          if (x != null) {
            currentUserX = x;
            displayedUserX = x;
            scheduleRender();
            if (userXChangeCb) userXChangeCb(currentUserX);
          }
        } else {
          // hover feedback
          hoverX = x;
          scheduleRender();
        }
      });

      derEl.addEventListener('pointerup', (ev) => {
        try { derEl.releasePointerCapture(ev.pointerId); } catch (e) {}
        isPointerDown = false;
        hoverX = null;
        scheduleRender();
        if (userXChangeCb) userXChangeCb(currentUserX);
      });

      derEl.addEventListener('pointerleave', () => {
        hoverX = null;
        scheduleRender();
      });
    }

    // Attach pointer handlers to integral canvas for dragging bounds
    if (canvases.integral && canvases.integral.el) {
      const intEl = canvases.integral.el;
      intEl.style.touchAction = 'none';
      const proximityPx = 12; // how close the pointer must be to a bound in pixels

      intEl.addEventListener('pointerdown', (ev) => {
        try { intEl.setPointerCapture(ev.pointerId); } catch (e) {}
        const x = pointerEventToDomainX(ev, intEl);
        if (x == null) return;
        // compute pixel positions of displayed bounds
        const rect = intEl.getBoundingClientRect();
        const plotW = rect.width - MARGINS.left - MARGINS.right;
        const px1 = MARGINS.left + ((displayedIntegralX1 - 0) / 10) * plotW;
        const px2 = MARGINS.left + ((displayedIntegralX2 - 0) / 10) * plotW;
        const localPx = ev.clientX - rect.left;
        const d1 = Math.abs(localPx - px1);
        const d2 = Math.abs(localPx - px2);
        if (d1 <= proximityPx && d1 <= d2) {
          isDraggingIntegral = true;
          activeIntegralHandle = 'x1';
        } else if (d2 <= proximityPx) {
          isDraggingIntegral = true;
          activeIntegralHandle = 'x2';
        }
        if (isDraggingIntegral) {
          // snap immediately
          if (activeIntegralHandle === 'x1') {
            integralX1 = x;
            displayedIntegralX1 = x;
          } else if (activeIntegralHandle === 'x2') {
            integralX2 = x;
            displayedIntegralX2 = x;
          }
          scheduleRender();
          ensureAnimationLoop();
          if (integralBoundsChangeCb) integralBoundsChangeCb(integralX1, integralX2);
        }
      });

      intEl.addEventListener('pointermove', (ev) => {
        const x = pointerEventToDomainX(ev, intEl);
        if (!x) return;
        if (isDraggingIntegral && activeIntegralHandle) {
          if (activeIntegralHandle === 'x1') {
            integralX1 = x;
            displayedIntegralX1 = x;
          } else if (activeIntegralHandle === 'x2') {
            integralX2 = x;
            displayedIntegralX2 = x;
          }
          scheduleRender();
          if (integralBoundsChangeCb) integralBoundsChangeCb(integralX1, integralX2);
        }
      });

      intEl.addEventListener('pointerup', (ev) => {
        try { intEl.releasePointerCapture(ev.pointerId); } catch (e) {}
        if (isDraggingIntegral) {
          isDraggingIntegral = false;
          activeIntegralHandle = null;
          scheduleRender();
          ensureAnimationLoop();
          if (integralBoundsChangeCb) integralBoundsChangeCb(integralX1, integralX2);
        }
      });

      intEl.addEventListener('pointerleave', () => {
        if (isDraggingIntegral) {
          isDraggingIntegral = false;
          activeIntegralHandle = null;
          scheduleRender();
          if (integralBoundsChangeCb) integralBoundsChangeCb(integralX1, integralX2);
        }
      });
    }
  }

  /**
   * Ajusta el tamaño de un canvas teniendo en cuenta el ratio de píxeles del dispositivo (HiDPI / Retina)
   */
  function resizeCanvas(item) {
    if (!item || !item.el || !item.ctx) return;
    const rect = item.el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    item.el.width = rect.width * dpr;
    item.el.height = rect.height * dpr;
    item.ctx.resetTransform();
    item.ctx.scale(dpr, dpr);
  }

  function resizeAll() {
    Object.values(canvases).forEach(item => {
      if (item && item.el) resizeCanvas(item);
    });
  }

  function setMode(mode) {
    currentMode = mode;
    // Dar un micro tiempo para que el layout CSS muestre el panel antes de redimensionar
    requestAnimationFrame(() => {
      if (canvases[mode]) {
        resizeCanvas(canvases[mode]);
      }
      scheduleRender();
    });
  }

  function setUserX(x) {
    currentUserX = Math.max(0, Math.min(9.99, x));
    // Start animation towards new user x and schedule render loop
    scheduleRender();
    ensureAnimationLoop();
  }

  function setIntegralBounds(x1, x2) {
    integralX1 = Math.max(0, Math.min(9.99, x1));
    integralX2 = Math.max(0, Math.min(9.99, x2));
    // Always schedule render and animation so visual bounds update immediately
    scheduleRender();
    ensureAnimationLoop();
  }

  function toggleLayer(layerName, state) {
    if (layers.hasOwnProperty(layerName)) {
      layers[layerName] = state !== undefined ? state : !layers[layerName];
      scheduleRender();
    }
  }

  /**
   * Planifica el render usando requestAnimationFrame para agrupar llamadas
   * consecutivas y evitar bloqueos por render sincrónico.
   */
  function scheduleRender() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      _doRender();
    });
  }

  /**
   * Render real (separa la lógica para usar con rAF)
   */
  function _doRender() {
    // Render the currently active canvas
    renderCanvas(currentMode);
  }

  /**
   * Dibuja un canvas específico independientemente de `currentMode`.
   * Útil para actualizar la vista de la integral aunque no esté en primer plano.
   */
  function renderCanvas(mode) {
    const activeTarget = canvases[mode];
    if (!activeTarget || !activeTarget.el || !activeTarget.ctx) return;

    const canvasEl = activeTarget.el;
    ctx = activeTarget.ctx;

    const rect = canvasEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Asegurar tamaño sincronizado
    const dpr = window.devicePixelRatio || 1;
    if (canvasEl.width !== rect.width * dpr || canvasEl.height !== rect.height * dpr) {
      resizeCanvas(activeTarget);
    }

    const width = rect.width;
    const height = rect.height;
    const plotWidth = width - MARGINS.left - MARGINS.right;
    const plotHeight = height - MARGINS.top - MARGINS.bottom;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Fondo del gráfico
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    if (mode === 'velocity') {
      renderVelocityView(plotWidth, plotHeight);
    } else if (mode === 'derivative') {
      renderDerivativeView(plotWidth, plotHeight);
    } else if (mode === 'integral') {
      renderIntegralView(plotWidth, plotHeight);
    }
  }

  // Animation loop to ease numeric values (displayedUserX, integral bounds)
  let animating = false;
  function ensureAnimationLoop() {
    if (animating) return;
    animating = true;
    const step = () => {
      let needAnotherFrame = false;

      // ease displayedUserX -> currentUserX
      const uxDiff = currentUserX - displayedUserX;
      if (Math.abs(uxDiff) > 0.0005) {
        displayedUserX += uxDiff * 0.18; // easing factor
        needAnotherFrame = true;
      } else if (displayedUserX !== currentUserX) {
        displayedUserX = currentUserX;
      }

      // ease integral bounds
      const i1Diff = integralX1 - displayedIntegralX1;
      const i2Diff = integralX2 - displayedIntegralX2;
      if (Math.abs(i1Diff) > 0.0005) {
        displayedIntegralX1 += i1Diff * 0.16;
        needAnotherFrame = true;
      } else if (displayedIntegralX1 !== integralX1) {
        displayedIntegralX1 = integralX1;
      }
      if (Math.abs(i2Diff) > 0.0005) {
        displayedIntegralX2 += i2Diff * 0.16;
        needAnotherFrame = true;
      } else if (displayedIntegralX2 !== integralX2) {
        displayedIntegralX2 = integralX2;
      }

      // If any value moved, request a frame render for relevant canvases
      if (needAnotherFrame) {
        // Always update velocity + derivative to keep markers in sync
        renderCanvas('velocity');
        renderCanvas('derivative');
        // Also update integral view to animate shaded area
        renderCanvas('integral');
        requestAnimationFrame(step);
      } else {
        // final render to ensure accurate endpoints
        renderCanvas('velocity');
        renderCanvas('derivative');
        renderCanvas('integral');
        animating = false;
      }
    };
    requestAnimationFrame(step);
  }

  // Helper: convertir pointer event a coordenada X en dominio [0,10]
  function pointerEventToDomainX(ev, canvasEl) {
    try {
      const rect = canvasEl.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const xMin = 0, xMax = 10;
      const denom = (rect.width - MARGINS.left - MARGINS.right);
      const x = xMin + (px - MARGINS.left) / denom * (xMax - xMin);
      if (isNaN(x)) return null;
      return Math.max(0, Math.min(9.99, x));
    } catch (e) {
      return null;
    }
  }

  // Allow registration of integral bounds change callback
  function onIntegralBoundsChange(cb) {
    integralBoundsChangeCb = typeof cb === 'function' ? cb : null;
  }

  /**
   * Transforma coordenadas matemáticas (x, y) a coordenadas en píxeles del canvas
   */
  function toCanvasCoords(x, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight) {
    const px = MARGINS.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
    const py = MARGINS.top + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;
    return { px, py };
  }

  /**
   * Bucle principal de dibujo
   */
  function render() {
    const activeTarget = canvases[currentMode];
    if (!activeTarget || !activeTarget.el || !activeTarget.ctx) return;

    const canvasEl = activeTarget.el;
    ctx = activeTarget.ctx;

    const rect = canvasEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Asegurar tamaño sincronizado
    const dpr = window.devicePixelRatio || 1;
    if (canvasEl.width !== rect.width * dpr || canvasEl.height !== rect.height * dpr) {
      resizeCanvas(activeTarget);
    }

    const width = rect.width;
    const height = rect.height;
    const plotWidth = width - MARGINS.left - MARGINS.right;
    const plotHeight = height - MARGINS.top - MARGINS.bottom;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Fondo del gráfico
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    if (currentMode === 'velocity') {
      renderVelocityView(plotWidth, plotHeight);
    } else if (currentMode === 'derivative') {
      renderDerivativeView(plotWidth, plotHeight);
    } else if (currentMode === 'integral') {
      renderIntegralView(plotWidth, plotHeight);
    }
  }

  /**
   * MODO 1: VELOCIDAD V(x) CON ZONAS Y NODO ACTIVO
   */
  function renderVelocityView(plotWidth, plotHeight) {
    const xMin = 0;
    const xMax = 10;
    const yMin = 0;
    const yMax = 28;

    // 1. Dibujar Franjas de Fondo de las 4 Zonas de Calibración
    drawZoneBackgrounds(xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    // 2. Dibujar Grilla y Ejes Cartesianos
    drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, 1, 5, 'Esfuerzo (x)', 'Velocidad de Ruptura V(x)');

    // 3. Dibujar Capas de Sumandos Opcionales
    if (layers.carencia) {
      drawCurve(x => MathEngine.calculateV(x).carencia, xMin, xMax, yMin, yMax, plotWidth, plotHeight, '#38bdf8', 1.5, true);
    }
    if (layers.saturacion) {
      drawCurve(x => MathEngine.calculateV(x).saturacion, xMin, xMax, yMin, yMax, plotWidth, plotHeight, '#818cf8', 1.5, true);
    }
    if (layers.friccion) {
      drawCurve(x => MathEngine.calculateV(x).friccion + 10, xMin, xMax, yMin, yMax, plotWidth, plotHeight, '#a78bfa', 1.2, true);
    }
    if (layers.heaviside) {
      drawCurve(x => MathEngine.calculateV(x).heaviside, xMin, xMax, yMin, yMax, plotWidth, plotHeight, '#f43f5e', 1.5, true);
    }

    // 4. Dibujar Curva Principal V(x)
    drawDiscontinuousCurve(
      x => MathEngine.calculateV(x).total,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      '#38bdf8', 2.8, 8.0 // Salto de Heaviside en x = 8.0
    );

    // 5. Destacar Punto Óptimo Global (x = 4, V = 9)
    const optCoords = toCanvasCoords(4.0, 9.0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.arc(optCoords.px, optCoords.py, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#2e7d68';
    ctx.fill();
    ctx.strokeStyle = '#38a169';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Etiqueta mínima
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('Óptimo (4, 9)', optCoords.px + 6, optCoords.py - 6);

    // 6. Dibujar Nodo Interactivo del Usuario con Pulso Radiante (usar valor animado)
    const userV = MathEngine.calculateV(displayedUserX).total;
    const userCoords = toCanvasCoords(displayedUserX, userV, xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    // Líneas guía de mira telescópica (Dashed crosshair)
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;

    // Línea vertical al eje X
    ctx.beginPath();
    ctx.moveTo(userCoords.px, userCoords.py);
    ctx.lineTo(userCoords.px, MARGINS.top + plotHeight);
    ctx.stroke();

    // Línea horizontal al eje Y
    ctx.beginPath();
    ctx.moveTo(userCoords.px, userCoords.py);
    ctx.lineTo(MARGINS.left, userCoords.py);
    ctx.stroke();
    ctx.restore();

    // Halo radiante exterior
    const zoneInfo = MathEngine.classifyEffortZone(displayedUserX);
    const haloColor = displayedUserX >= 8 ? 'rgba(159, 18, 57, 0.4)' :
              displayedUserX > 7.5 ? 'rgba(194, 65, 12, 0.35)' :
              displayedUserX >= 1.5 ? 'rgba(46, 125, 104, 0.4)' :
              'rgba(180, 83, 9, 0.35)';

    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 14, 0, 2 * Math.PI);
    ctx.fillStyle = haloColor;
    ctx.fill();

    // Círculo concéntrico intermedio
    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Núcleo brillante (color según zona del displayedUserX)
    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = displayedUserX >= 8 ? '#f43f5e' : '#38bdf8';
    ctx.fill();

    // Tooltip flotante con coordenadas
    drawCoordinateBadge(userCoords.px, userCoords.py, `x: ${displayedUserX.toFixed(2)} | V: ${userV.toFixed(2)}`);
  }

  /**
   * MODO 2: DERIVADA V'(x) (ACELERACIÓN Y PULSO DEL PRESENTE)
   */
  function renderDerivativeView(plotWidth, plotHeight) {
    const xMin = 0;
    const xMax = 10;
    const yMin = -5;
    const yMax = 5;

    // Grilla con línea cero destacada
    drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, 1, 1, 'Esfuerzo (x)', "Aceleración V'(x)");

    // Línea de equilibrio cero V'(x) = 0
    const zeroCoords = toCanvasCoords(0, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(MARGINS.left, zeroCoords.py);
    ctx.lineTo(MARGINS.left + plotWidth, zeroCoords.py);
    ctx.stroke();

    // 1. Curva secular de equilibrio (punteada azul ártico)
    drawCurve(
      x => MathEngine.calculateVPrime(x).secular,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      '#38bdf8', 2.0, true
    );

    // 2. Curva total con oscilación de fricción (violeta continuo)
    drawCurve(
      x => MathEngine.calculateVPrime(x).total,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      '#818cf8', 2.0, false
    );

    // Leyenda superior de derivadas
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('--- Tendencia Secular V\'_sec(x)', MARGINS.left + 10, MARGINS.top + 15);
    ctx.fillStyle = '#818cf8';
    ctx.fillText('— Dinámica Total con Fricción', MARGINS.left + 190, MARGINS.top + 15);

    // Punto de cruce en x = 4 (mínimo secular V'_sec(4) = 0)
    const rootCoords = toCanvasCoords(4.0, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.arc(rootCoords.px, rootCoords.py, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#2e7d68';
    ctx.fill();
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('Cruce Secular x = 4 (V\' = 0)', rootCoords.px - 60, rootCoords.py - 10);

    // Representación del Impulso Delta de Dirac en x = 8
    const diracCoords = toCanvasCoords(8.0, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    const diracTop = toCanvasCoords(8.0, 4.5, xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    ctx.save();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(diracCoords.px, diracCoords.py);
    ctx.lineTo(diracTop.px, diracTop.py);
    ctx.stroke();

    // Flecha de impulso vertical
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(diracTop.px - 5, diracTop.py + 8);
    ctx.lineTo(diracTop.px, diracTop.py);
    ctx.lineTo(diracTop.px + 5, diracTop.py + 8);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.restore();

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#fda4af';
    ctx.fillText('Impulso Dirac 5δ(x-8)', diracTop.px - 55, diracTop.py - 6);

    // Hover cue (if present)
    if (hoverX != null) {
      drawHoverCue(hoverX, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    }

    // Nodo del usuario en la derivada (usar displayedUserX para movimiento suave)
    const userPrime = MathEngine.calculateVPrime(displayedUserX).total;
    const userCoords = toCanvasCoords(displayedUserX, userPrime, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#818cf8';
    ctx.fill();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawCoordinateBadge(userCoords.px, userCoords.py, `x: ${displayedUserX.toFixed(2)} | V': ${userPrime.toFixed(2)}`);
  }

  /**
   * MODO 3: INTEGRAL ΔD (ÁREA BAJO LA CURVA & DESGASTE ACUMULADO)
   */
  function renderIntegralView(plotWidth, plotHeight) {
    const xMin = 0;
    const xMax = 10;
    const yMin = 0;
    const yMax = 28;

    drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, 1, 5, 'Esfuerzo (x)', 'Función de Estado V(x)');

    // 1. Sombreado del Área bajo la curva entre x1 y x2
    // Use displayed (animated) integral bounds for smooth movement
    const lowerX = Math.min(displayedIntegralX1, displayedIntegralX2);
    const upperX = Math.max(displayedIntegralX1, displayedIntegralX2);

    ctx.save();
    ctx.beginPath();
    const startZero = toCanvasCoords(lowerX, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.moveTo(startZero.px, startZero.py);

    // Adaptive steps based on pixel width for smooth filling but lower CPU
    const steps = Math.max(40, Math.min(140, Math.floor((upperX - lowerX) / Math.max(0.02, (xMax - xMin)) * (plotWidth / 8))));
    const stepSize = (upperX - lowerX) / Math.max(1, steps);
    for (let i = 0; i <= steps; i++) {
      const curX = lowerX + i * stepSize;
      const curY = MathEngine.calculateV(curX).total;
      const coords = toCanvasCoords(curX, curY, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.lineTo(coords.px, coords.py);
    }

    const endZero = toCanvasCoords(upperX, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.lineTo(endZero.px, endZero.py);
    ctx.closePath();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 2. Curva completa V(x)
    drawDiscontinuousCurve(
      x => MathEngine.calculateV(x).total,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      '#38bdf8', 2.5, 8.0
    );

    // 3. Líneas de límites x1 y x2
    drawBoundaryLine(lowerX, yMin, yMax, plotWidth, plotHeight, `x₁ = ${lowerX.toFixed(2)}`, '#38bdf8');
    drawBoundaryLine(upperX, yMin, yMax, plotWidth, plotHeight, `x₂ = ${upperX.toFixed(2)}`, '#818cf8');
  }

  function drawBoundaryLine(x, yMin, yMax, plotWidth, plotHeight, label, color) {
    const bottom = toCanvasCoords(x, yMin, 0, 10, yMin, yMax, plotWidth, plotHeight);
    const top = toCanvasCoords(x, yMax, 0, 10, yMin, yMax, plotWidth, plotHeight);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(bottom.px, bottom.py);
    ctx.lineTo(top.px, top.py);
    ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(label, bottom.px - 16, MARGINS.top - 8);
  }

  /**
   * Dibuja los fondos coloreados de las 4 zonas de calibración
   */
  function drawZoneBackgrounds(xMin, xMax, yMin, yMax, plotWidth, plotHeight) {
    const zones = [
      { from: 0.0, to: 1.5, color: 'rgba(180, 83, 9, 0.10)' },   // Negligencia
      { from: 1.5, to: 7.5, color: 'rgba(46, 125, 104, 0.12)' }, // Equilibrio Óptimo
      { from: 7.5, to: 8.0, color: 'rgba(194, 65, 12, 0.12)' },  // Fatiga
      { from: 8.0, to: 10.0, color: 'rgba(159, 18, 57, 0.14)' }  // Asfixia Heaviside
    ];

    zones.forEach(z => {
      const p1 = toCanvasCoords(z.from, yMax, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      const p2 = toCanvasCoords(z.to, yMin, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.fillStyle = z.color;
      ctx.fillRect(p1.px, p1.py, p2.px - p1.px, p2.py - p1.py);
    });
  }

  /**
   * Dibuja la grilla, marcas y etiquetas de los ejes
   */
  function drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, xStep, yStep, xLabel, yLabel) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';

    // Líneas verticales (X)
    for (let x = xMin; x <= xMax; x += xStep) {
      const coords = toCanvasCoords(x, yMin, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.beginPath();
      ctx.moveTo(coords.px, MARGINS.top);
      ctx.lineTo(coords.px, MARGINS.top + plotHeight);
      ctx.stroke();

      // Etiqueta X
      ctx.textAlign = 'center';
      ctx.fillText(x.toString(), coords.px, MARGINS.top + plotHeight + 16);
    }

    // Líneas horizontales (Y)
    for (let y = yMin; y <= yMax; y += yStep) {
      const coords = toCanvasCoords(xMin, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.beginPath();
      ctx.moveTo(MARGINS.left, coords.py);
      ctx.lineTo(MARGINS.left + plotWidth, coords.py);
      ctx.stroke();

      // Etiqueta Y
      ctx.textAlign = 'right';
      ctx.fillText(y.toString(), MARGINS.left - 8, coords.py + 3);
    }

    // Título de los ejes
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, MARGINS.left + plotWidth / 2, MARGINS.top + plotHeight + 35);

    ctx.save();
    ctx.translate(MARGINS.left - 38, MARGINS.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  /**
   * Dibuja una curva matemática continua
   */
  function drawCurve(func, xMin, xMax, yMin, yMax, plotWidth, plotHeight, color, lineWidth = 2, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([4, 4]);

    ctx.beginPath();
    // Ajustar pasos según tamaño del plot para equilibrio entre calidad y rendimiento
    const steps = Math.max(80, Math.min(220, Math.floor(plotWidth / 2)));
    const dx = (xMax - xMin) / steps;
    let first = true;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = func(x);
      if (isNaN(y) || !isFinite(y)) continue;
      const coords = toCanvasCoords(x, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      if (first) {
        ctx.moveTo(coords.px, coords.py);
        first = false;
      } else {
        ctx.lineTo(coords.px, coords.py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Dibuja curva discontinua con salto abrupto (ej. Escalón de Heaviside en x = 8.0)
   */
  function drawDiscontinuousCurve(func, xMin, xMax, yMin, yMax, plotWidth, plotHeight, color, lineWidth, jumpX) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Tramo 1: desde xMin hasta jumpX - epsilon
    ctx.beginPath();
    const steps1 = Math.max(80, Math.min(220, Math.floor((jumpX - xMin) / Math.max(0.02, (xMax - xMin)) * (plotWidth / 6))));
    const dx1 = (jumpX - 0.001 - xMin) / steps1;
    for (let i = 0; i <= steps1; i++) {
      const x = xMin + i * dx1;
      const y = func(x);
      const coords = toCanvasCoords(x, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      if (i === 0) ctx.moveTo(coords.px, coords.py);
      else ctx.lineTo(coords.px, coords.py);
    }
    ctx.stroke();

    // Línea vertical discontinua que indica el salto de Heaviside +5
    const jumpBefore = toCanvasCoords(jumpX, func(jumpX - 0.01), xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    const jumpAfter = toCanvasCoords(jumpX, func(jumpX + 0.01), xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(jumpBefore.px, jumpBefore.py);
    ctx.lineTo(jumpAfter.px, jumpAfter.py);
    ctx.stroke();
    ctx.restore();

    // Tramo 2: desde jumpX hasta xMax
    ctx.beginPath();
    const steps2 = Math.max(60, Math.min(160, Math.floor((xMax - jumpX) / Math.max(0.02, (xMax - xMin)) * (plotWidth / 6))));
    const dx2 = (xMax - jumpX) / steps2;
    for (let i = 0; i <= steps2; i++) {
      const x = jumpX + i * dx2;
      const y = func(x);
      const coords = toCanvasCoords(x, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      if (i === 0) ctx.moveTo(coords.px, coords.py);
      else ctx.lineTo(coords.px, coords.py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCoordinateBadge(px, py, text) {
    ctx.save();
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + 14;
    const badgeH = 22;
    let badgeX = px + 12;
    let badgeY = py - 28;

    const dpr = window.devicePixelRatio || 1;
    const cwidth = ctx && ctx.canvas ? ctx.canvas.width / dpr : 0;
    if (badgeX + badgeW > cwidth - 10) {
      badgeX = px - badgeW - 12;
    }
    if (badgeY < 10) {
      badgeY = py + 15;
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'left';
    ctx.fillText(text, badgeX + 7, badgeY + 15);
    ctx.restore();
  }

  // Draw hover cue for derivative canvas (small vertical dashed line)
  function drawHoverCue(x, xMin, xMax, yMin, yMax, plotWidth, plotHeight) {
    if (x == null) return;
    const coords = toCanvasCoords(x, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(coords.px, MARGINS.top);
    ctx.lineTo(coords.px, MARGINS.top + plotHeight);
    ctx.stroke();
    ctx.restore();
  }

  return {
    init,
    render: scheduleRender,
    setMode,
    setUserX,
    setIntegralBounds,
    toggleLayer,
    // Allow UI to register a callback for when user X changes by dragging
    onUserXChange: function(cb) { userXChangeCb = typeof cb === 'function' ? cb : null; },
    onIntegralBoundsChange: function(cb) { integralBoundsChangeCb = typeof cb === 'function' ? cb : null; }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartEngine;
}
