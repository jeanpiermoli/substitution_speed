/**
 * ============================================================================
 * DINÁMICA DE SISTEMAS INTERPERSONALES - MOTOR GRÁFICO CIENTÍFICO (CANVAS 2D)
 * Autor: Jan Pier Molina Castaño (Universidad de La Guajira, 2026)
 * ============================================================================
 * Renderizado de alta fidelidad, paleta estricta (2 bases + 1 acento suave),
 * soporte táctil directo (drag & drop en móvil y PC) y modo claro/oscuro.
 */

const ChartEngine = (() => {
  const canvases = {
    velocity: { el: null, ctx: null },
    derivative: { el: null, ctx: null },
    integral: { el: null, ctx: null }
  };

  let ctx = null;
  let currentMode = 'velocity';
  let currentUserX = 4.0;
  let displayedUserX = 4.0;
  let displayedIntegralX1 = 1.0;
  let displayedIntegralX2 = 4.0;
  let integralX1 = 1.0;
  let integralX2 = 4.0;
  let rafId = null;

  let layers = {
    carencia: false,
    saturacion: false,
    friccion: false,
    heaviside: false
  };

  let isPointerDown = false;
  let activeCanvasKey = null;
  let hoverX = null;
  let userXChangeCb = null;

  let isDraggingIntegral = false;
  let activeIntegralHandle = null;
  let integralBoundsChangeCb = null;

  const MARGINS = { top: 25, right: 25, bottom: 40, left: 45 };

  /**
   * Obtiene la paleta estricta según el tema activo (2 bases + 1 acento)
   */
  function getPalette() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      return {
        bg: '#ffffff',
        grid: 'rgba(0, 0, 0, 0.05)',
        axis: 'rgba(0, 0, 0, 0.22)',
        text: '#64748b',
        accent: '#3d6f88',
        accentTint: 'rgba(61, 111, 136, 0.12)',
        accentRing: 'rgba(61, 111, 136, 0.30)',
        subLayer: '#788294',
        divider: 'rgba(0, 0, 0, 0.08)',
        tooltipBg: '#ffffff',
        tooltipBorder: '#dde1e7',
        tooltipText: '#181b20'
      };
    }
    return {
      bg: '#1a1e26',
      grid: 'rgba(255, 255, 255, 0.04)',
      axis: 'rgba(255, 255, 255, 0.18)',
      text: '#8892a0',
      accent: '#5b8ea8',
      accentTint: 'rgba(91, 142, 168, 0.14)',
      accentRing: 'rgba(91, 142, 168, 0.35)',
      subLayer: '#687282',
      divider: 'rgba(255, 255, 255, 0.06)',
      tooltipBg: '#12151a',
      tooltipBorder: '#272d38',
      tooltipText: '#e4e7ed'
    };
  }

  /**
   * Inicializa los lienzos de las 3 vistas y los listeners de redimensionamiento e interacción táctil
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
      scheduleRender();
    });

    // 1. Interacción táctil y puntero en el lienzo principal (Velocidad V(x))
    if (vEl) {
      vEl.style.touchAction = 'none';

      vEl.addEventListener('pointerdown', (ev) => {
        try { vEl.setPointerCapture(ev.pointerId); } catch (e) {}
        isPointerDown = true;
        activeCanvasKey = 'velocity';
        const x = pointerEventToDomainX(ev, vEl);
        if (x != null) {
          currentUserX = x;
          displayedUserX = x;
          scheduleRender();
          ensureAnimationLoop();
          if (userXChangeCb) userXChangeCb(currentUserX);
        }
      });

      vEl.addEventListener('pointermove', (ev) => {
        const x = pointerEventToDomainX(ev, vEl);
        if (isPointerDown && activeCanvasKey === 'velocity' && x != null) {
          currentUserX = x;
          displayedUserX = x;
          scheduleRender();
          if (userXChangeCb) userXChangeCb(currentUserX);
        }
      });

      vEl.addEventListener('pointerup', (ev) => {
        try { vEl.releasePointerCapture(ev.pointerId); } catch (e) {}
        isPointerDown = false;
        activeCanvasKey = null;
        scheduleRender();
        if (userXChangeCb) userXChangeCb(currentUserX);
      });

      vEl.addEventListener('pointerleave', () => {
        if (!isPointerDown) {
          activeCanvasKey = null;
        }
      });
    }

    // 2. Interacción táctil en derivada
    if (dEl) {
      dEl.style.touchAction = 'none';

      dEl.addEventListener('pointerdown', (ev) => {
        try { dEl.setPointerCapture(ev.pointerId); } catch (e) {}
        isPointerDown = true;
        activeCanvasKey = 'derivative';
        const x = pointerEventToDomainX(ev, dEl);
        if (x != null) {
          currentUserX = x;
          displayedUserX = x;
          scheduleRender();
          ensureAnimationLoop();
          if (userXChangeCb) userXChangeCb(currentUserX);
        }
      });

      dEl.addEventListener('pointermove', (ev) => {
        const x = pointerEventToDomainX(ev, dEl);
        if (isPointerDown && activeCanvasKey === 'derivative') {
          if (x != null) {
            currentUserX = x;
            displayedUserX = x;
            scheduleRender();
            if (userXChangeCb) userXChangeCb(currentUserX);
          }
        } else {
          hoverX = x;
          scheduleRender();
        }
      });

      dEl.addEventListener('pointerup', (ev) => {
        try { dEl.releasePointerCapture(ev.pointerId); } catch (e) {}
        isPointerDown = false;
        activeCanvasKey = null;
        hoverX = null;
        scheduleRender();
        if (userXChangeCb) userXChangeCb(currentUserX);
      });

      dEl.addEventListener('pointerleave', () => {
        hoverX = null;
        scheduleRender();
      });
    }

    // 3. Interacción táctil en integral (arrastre de límites x1, x2)
    if (iEl) {
      iEl.style.touchAction = 'none';
      const proximityPx = 18;

      iEl.addEventListener('pointerdown', (ev) => {
        try { iEl.setPointerCapture(ev.pointerId); } catch (e) {}
        const x = pointerEventToDomainX(ev, iEl);
        if (x == null) return;

        const rect = iEl.getBoundingClientRect();
        const plotW = rect.width - MARGINS.left - MARGINS.right;
        const px1 = MARGINS.left + (displayedIntegralX1 / 10) * plotW;
        const px2 = MARGINS.left + (displayedIntegralX2 / 10) * plotW;
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

      iEl.addEventListener('pointermove', (ev) => {
        const x = pointerEventToDomainX(ev, iEl);
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

      iEl.addEventListener('pointerup', (ev) => {
        try { iEl.releasePointerCapture(ev.pointerId); } catch (e) {}
        if (isDraggingIntegral) {
          isDraggingIntegral = false;
          activeIntegralHandle = null;
          scheduleRender();
          if (integralBoundsChangeCb) integralBoundsChangeCb(integralX1, integralX2);
        }
      });
    }

    scheduleRender();
  }

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
    requestAnimationFrame(() => {
      if (canvases[mode]) {
        resizeCanvas(canvases[mode]);
      }
      scheduleRender();
    });
  }

  function setUserX(x) {
    currentUserX = Math.max(0, Math.min(9.99, x));
    scheduleRender();
    ensureAnimationLoop();
  }

  function setIntegralBounds(x1, x2) {
    integralX1 = Math.max(0, Math.min(9.99, x1));
    integralX2 = Math.max(0, Math.min(9.99, x2));
    scheduleRender();
    ensureAnimationLoop();
  }

  function toggleLayer(layerName, state) {
    if (layers.hasOwnProperty(layerName)) {
      layers[layerName] = state !== undefined ? state : !layers[layerName];
      scheduleRender();
    }
  }

  function scheduleRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      renderActiveCanvas();
    });
  }

  let animating = false;
  function ensureAnimationLoop() {
    if (animating) return;
    animating = true;
    const step = () => {
      let needAnotherFrame = false;

      const uxDiff = currentUserX - displayedUserX;
      if (Math.abs(uxDiff) > 0.001) {
        displayedUserX += uxDiff * 0.22;
        needAnotherFrame = true;
      } else if (displayedUserX !== currentUserX) {
        displayedUserX = currentUserX;
      }

      const i1Diff = integralX1 - displayedIntegralX1;
      const i2Diff = integralX2 - displayedIntegralX2;
      if (Math.abs(i1Diff) > 0.001) {
        displayedIntegralX1 += i1Diff * 0.20;
        needAnotherFrame = true;
      } else if (displayedIntegralX1 !== integralX1) {
        displayedIntegralX1 = integralX1;
      }
      if (Math.abs(i2Diff) > 0.001) {
        displayedIntegralX2 += i2Diff * 0.20;
        needAnotherFrame = true;
      } else if (displayedIntegralX2 !== integralX2) {
        displayedIntegralX2 = integralX2;
      }

      renderActiveCanvas();

      if (needAnotherFrame) {
        requestAnimationFrame(step);
      } else {
        animating = false;
      }
    };
    requestAnimationFrame(step);
  }

  function pointerEventToDomainX(ev, canvasEl) {
    try {
      const rect = canvasEl.getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const denom = (rect.width - MARGINS.left - MARGINS.right);
      const x = ((px - MARGINS.left) / denom) * 10;
      if (isNaN(x)) return null;
      return Math.max(0, Math.min(9.99, x));
    } catch (e) {
      return null;
    }
  }

  function toCanvasCoords(x, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight) {
    const px = MARGINS.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
    const py = MARGINS.top + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;
    return { px, py };
  }

  function renderActiveCanvas() {
    const activeTarget = canvases[currentMode];
    if (!activeTarget || !activeTarget.el || !activeTarget.ctx) return;

    const canvasEl = activeTarget.el;
    ctx = activeTarget.ctx;

    const rect = canvasEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvasEl.width !== rect.width * dpr || canvasEl.height !== rect.height * dpr) {
      resizeCanvas(activeTarget);
    }

    const width = rect.width;
    const height = rect.height;
    const plotWidth = width - MARGINS.left - MARGINS.right;
    const plotHeight = height - MARGINS.top - MARGINS.bottom;
    const palette = getPalette();

    ctx.clearRect(0, 0, width, height);

    if (currentMode === 'velocity') {
      renderVelocityView(plotWidth, plotHeight, palette);
    } else if (currentMode === 'derivative') {
      renderDerivativeView(plotWidth, plotHeight, palette);
    } else if (currentMode === 'integral') {
      renderIntegralView(plotWidth, plotHeight, palette);
    }
  }

  /**
   * MODO 1: VELOCIDAD V(x)
   */
  function renderVelocityView(plotWidth, plotHeight, palette) {
    const xMin = 0, xMax = 10;
    const yMin = 0, yMax = 28;

    // 1. Zonas de fondo desaturadas y limpias
    drawZoneDividers(xMin, xMax, yMin, yMax, plotWidth, plotHeight, palette);

    // 2. Grilla cartesiana
    drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, 1, 5, 'Esfuerzo (x)', 'Velocidad V(x)', palette);

    // 3. Capas auxiliares opcionales (trazos punteados sutiles)
    if (layers.carencia) {
      drawCurve(x => MathEngine.calculateV(x).carencia, xMin, xMax, yMin, yMax, plotWidth, plotHeight, palette.subLayer, 1.2, true);
    }
    if (layers.saturacion) {
      drawCurve(x => MathEngine.calculateV(x).saturacion, xMin, xMax, yMin, yMax, plotWidth, plotHeight, palette.subLayer, 1.2, true);
    }
    if (layers.friccion) {
      drawCurve(x => MathEngine.calculateV(x).friccion + 10, xMin, xMax, yMin, yMax, plotWidth, plotHeight, palette.subLayer, 1.2, true);
    }
    if (layers.heaviside) {
      drawCurve(x => MathEngine.calculateV(x).heaviside, xMin, xMax, yMin, yMax, plotWidth, plotHeight, palette.subLayer, 1.2, true);
    }

    // 4. Curva principal en el Acento Único
    drawDiscontinuousCurve(
      x => MathEngine.calculateV(x).total,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      palette.accent, 2.4, 8.0, palette
    );

    // 5. Indicador del Punto Óptimo (x = 4.0, V = 9.0)
    const optCoords = toCanvasCoords(4.0, 9.0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.arc(optCoords.px, optCoords.py, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = palette.accent;
    ctx.fill();

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = palette.text;
    ctx.fillText('Óptimo (4, 9)', optCoords.px + 6, optCoords.py - 6);

    // 6. Nodo Activo del Usuario (Arrastrable)
    const userV = MathEngine.calculateV(displayedUserX).total;
    const userCoords = toCanvasCoords(displayedUserX, userV, xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    // Líneas guía
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(userCoords.px, userCoords.py);
    ctx.lineTo(userCoords.px, MARGINS.top + plotHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(userCoords.px, userCoords.py);
    ctx.lineTo(MARGINS.left, userCoords.py);
    ctx.stroke();
    ctx.restore();

    // Halo concéntrico suave
    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 12, 0, 2 * Math.PI);
    ctx.fillStyle = palette.accentTint;
    ctx.fill();

    // Círculo central
    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.strokeStyle = palette.bg;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawCoordinateBadge(userCoords.px, userCoords.py, `x: ${displayedUserX.toFixed(2)} | V: ${userV.toFixed(2)}`, palette);
  }

  /**
   * MODO 2: DERIVADA V'(x)
   */
  function renderDerivativeView(plotWidth, plotHeight, palette) {
    const xMin = 0, xMax = 10;
    const yMin = -5, yMax = 5;

    drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, 1, 1, 'Esfuerzo (x)', "Aceleración V'(x)", palette);

    // Línea cero V'(x) = 0
    const zeroCoords = toCanvasCoords(0, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = 1.2;
    ctx.moveTo(MARGINS.left, zeroCoords.py);
    ctx.lineTo(MARGINS.left + plotWidth, zeroCoords.py);
    ctx.stroke();

    // Curva secular punteada
    drawCurve(
      x => MathEngine.calculateVPrime(x).secular,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      palette.subLayer, 1.8, true
    );

    // Curva total en acento
    drawCurve(
      x => MathEngine.calculateVPrime(x).total,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      palette.accent, 2.2, false
    );

    // Impulso Dirac en x = 8
    const diracCoords = toCanvasCoords(8.0, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    const diracTop = toCanvasCoords(8.0, 4.5, xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(diracCoords.px, diracCoords.py);
    ctx.lineTo(diracTop.px, diracTop.py);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(diracTop.px - 4, diracTop.py + 7);
    ctx.lineTo(diracTop.px, diracTop.py);
    ctx.lineTo(diracTop.px + 4, diracTop.py + 7);
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.restore();

    // Nodo activo
    const userPrime = MathEngine.calculateVPrime(displayedUserX).total;
    const userCoords = toCanvasCoords(displayedUserX, userPrime, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.beginPath();
    ctx.arc(userCoords.px, userCoords.py, 5, 0, 2 * Math.PI);
    ctx.fillStyle = palette.accent;
    ctx.fill();

    drawCoordinateBadge(userCoords.px, userCoords.py, `x: ${displayedUserX.toFixed(2)} | V': ${userPrime.toFixed(2)}`, palette);
  }

  /**
   * MODO 3: INTEGRAL ΔD
   */
  function renderIntegralView(plotWidth, plotHeight, palette) {
    const xMin = 0, xMax = 10;
    const yMin = 0, yMax = 28;

    drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, 1, 5, 'Esfuerzo (x)', 'Función V(x)', palette);

    const lowerX = Math.min(displayedIntegralX1, displayedIntegralX2);
    const upperX = Math.max(displayedIntegralX1, displayedIntegralX2);

    // Sombreado de área con el tinte suave del acento
    ctx.save();
    ctx.beginPath();
    const startZero = toCanvasCoords(lowerX, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    ctx.moveTo(startZero.px, startZero.py);

    const steps = Math.max(40, Math.min(120, Math.floor((upperX - lowerX) * 15)));
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

    ctx.fillStyle = palette.accentTint;
    ctx.fill();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Curva V(x)
    drawDiscontinuousCurve(
      x => MathEngine.calculateV(x).total,
      xMin, xMax, yMin, yMax, plotWidth, plotHeight,
      palette.accent, 2.2, 8.0, palette
    );

    // Límites x1 y x2
    drawBoundaryLine(lowerX, yMin, yMax, plotWidth, plotHeight, `x₁ = ${lowerX.toFixed(1)}`, palette);
    drawBoundaryLine(upperX, yMin, yMax, plotWidth, plotHeight, `x₂ = ${upperX.toFixed(1)}`, palette);
  }

  function drawBoundaryLine(x, yMin, yMax, plotWidth, plotHeight, label, palette) {
    const bottom = toCanvasCoords(x, yMin, 0, 10, yMin, yMax, plotWidth, plotHeight);
    const top = toCanvasCoords(x, yMax, 0, 10, yMin, yMax, plotWidth, plotHeight);

    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(bottom.px, bottom.py);
    ctx.lineTo(top.px, top.py);
    ctx.stroke();
    ctx.restore();

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = palette.text;
    ctx.fillText(label, bottom.px - 14, MARGINS.top - 6);
  }

  function drawZoneDividers(xMin, xMax, yMin, yMax, plotWidth, plotHeight, palette) {
    const dividers = [1.5, 7.5, 8.0];
    ctx.save();
    ctx.strokeStyle = palette.divider;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    dividers.forEach(xVal => {
      const p = toCanvasCoords(xVal, 0, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.beginPath();
      ctx.moveTo(p.px, MARGINS.top);
      ctx.lineTo(p.px, MARGINS.top + plotHeight);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawGrid(xMin, xMax, yMin, yMax, plotWidth, plotHeight, xStep, yStep, xLabel, yLabel, palette) {
    ctx.save();
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = palette.text;

    // Eje X
    for (let x = xMin; x <= xMax; x += xStep) {
      const coords = toCanvasCoords(x, yMin, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.beginPath();
      ctx.moveTo(coords.px, MARGINS.top);
      ctx.lineTo(coords.px, MARGINS.top + plotHeight);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillText(x.toString(), coords.px, MARGINS.top + plotHeight + 14);
    }

    // Eje Y
    for (let y = yMin; y <= yMax; y += yStep) {
      const coords = toCanvasCoords(xMin, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      ctx.beginPath();
      ctx.moveTo(MARGINS.left, coords.py);
      ctx.lineTo(MARGINS.left + plotWidth, coords.py);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.fillText(y.toString(), MARGINS.left - 6, coords.py + 3);
    }

    ctx.restore();
  }

  function drawCurve(func, xMin, xMax, yMin, yMax, plotWidth, plotHeight, color, lineWidth = 2, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([3, 3]);

    ctx.beginPath();
    const steps = Math.max(60, Math.min(180, Math.floor(plotWidth / 2)));
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

  function drawDiscontinuousCurve(func, xMin, xMax, yMin, yMax, plotWidth, plotHeight, color, lineWidth, jumpX, palette) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Tramo 1: [0, 8)
    ctx.beginPath();
    const steps1 = Math.max(60, Math.floor(plotWidth * 0.7));
    const dx1 = (jumpX - 0.001 - xMin) / steps1;
    for (let i = 0; i <= steps1; i++) {
      const x = xMin + i * dx1;
      const y = func(x);
      const coords = toCanvasCoords(x, y, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
      if (i === 0) ctx.moveTo(coords.px, coords.py);
      else ctx.lineTo(coords.px, coords.py);
    }
    ctx.stroke();

    // Salto Heaviside
    const jumpBefore = toCanvasCoords(jumpX, func(jumpX - 0.01), xMin, xMax, yMin, yMax, plotWidth, plotHeight);
    const jumpAfter = toCanvasCoords(jumpX, func(jumpX + 0.01), xMin, xMax, yMin, yMax, plotWidth, plotHeight);

    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(jumpBefore.px, jumpBefore.py);
    ctx.lineTo(jumpAfter.px, jumpAfter.py);
    ctx.stroke();
    ctx.restore();

    // Tramo 2: [8, 10]
    ctx.beginPath();
    const steps2 = Math.max(25, Math.floor(plotWidth * 0.25));
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

  function drawCoordinateBadge(px, py, text, palette) {
    ctx.save();
    ctx.font = '10px JetBrains Mono, monospace';
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + 12;
    const badgeH = 20;
    let badgeX = px + 10;
    let badgeY = py - 26;

    const dpr = window.devicePixelRatio || 1;
    const cwidth = ctx && ctx.canvas ? ctx.canvas.width / dpr : 0;
    if (badgeX + badgeW > cwidth - 10) {
      badgeX = px - badgeW - 10;
    }
    if (badgeY < 5) {
      badgeY = py + 12;
    }

    ctx.fillStyle = palette.tooltipBg;
    ctx.strokeStyle = palette.tooltipBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.tooltipText;
    ctx.textAlign = 'left';
    ctx.fillText(text, badgeX + 6, badgeY + 14);
    ctx.restore();
  }

  return {
    init,
    render: scheduleRender,
    setMode,
    setUserX,
    setIntegralBounds,
    toggleLayer,
    onUserXChange: function(cb) { userXChangeCb = typeof cb === 'function' ? cb : null; },
    onIntegralBoundsChange: function(cb) { integralBoundsChangeCb = typeof cb === 'function' ? cb : null; }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChartEngine;
}
