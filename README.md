# Dinámica de Sistemas Interpersonales

Simulador interactivo y visualizador matemático para el análisis cuantitativo de dinámicas relacionales y velocidad de sustitución, basado en la investigación de **Jan Pier Molina Castaño** (Universidad de La Guajira, 2026).

---

## 📌 Descripción del Proyecto

Esta plataforma web permite modelar y simular cómo varían la tensión, el deterioro y la estabilidad en vínculos interpersonales en función del nivel de esfuerzo o inversión ($x$).

La formulación matemática principal del modelo se define como:

$$V(x) = \frac{25}{x+1} + x + \frac{1}{2}\sin(\pi x) + 5\mathcal{H}(x-8)$$

Donde se analizan simultáneamente cuatro componentes físicos:
1. **Término de Carencia:** $\frac{25}{x+1}$ (Deterioro por abandono o negligencia).
2. **Término de Saturación:** $x$ (Tensión continua por sobreinversión, análoga a la Ley de Hooke).
3. **Fricción Cotidiana:** $\frac{1}{2}\sin(\pi x)$ (Oscilación periódica natural de la rutina).
4. **Falla Estructural:** $5\mathcal{H}(x-8)$ (Discontinuidad de Heaviside que modela la asfixia crítica para $x \ge 8$).

---

## 🚀 Funcionalidades Principales

* **Simulador Interactivo $V(x)$:** Control deslizante táctil y campo numérico de precisión, sincronizados con arrastre directo sobre el lienzo gráfico Canvas 2D.
* **Análisis Diferencial $V'(x)$:** Cálculo en tiempo real de la tasa instantánea de cambio y la tendencia secular de la curva.
* **Análisis Integral $\Delta D$:** Cálculo numérico del área bajo la curva e interpretación del desgaste acumulado en transiciones $[x_1, x_2]$.
* **Diseño Responsivo:** Adaptado ergonómicamente para computadoras de escritorio y teléfonos móviles (con barra de telemetría fija en móvil).
* **Paleta Estricta (3 Colores):** Dos colores base (fondo y superficies neutras) y un único acento suave desaturado, previniendo la fatiga visual.
* **Modo Claro y Modo Oscuro:** Conmutador de tema persistente en almacenamiento local.

---

## 🛠️ Tecnologías Empleadas

* **HTML5 Semántico & CSS3 Modular:** Variables CSS nativas, diseño fluido y sin dependencias pesadas.
* **JavaScript Vanilla (ES6+):** Arquitectura modular (`math-engine.js`, `chart-engine.js`, `diagnostics.js`, `ui-controller.js`).
* **KaTeX:** Renderizado matemático editorial de alta legibilidad.
* **Canvas 2D:** Motor de renderizado acelerado con soporte para pantallas táctiles y Retina/HiDPI.

---

## 💻 Ejecución Local

Al ser una aplicación web estática del lado del cliente, no requiere servidores ni gestores de paquetes:

1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/jeanpiermoli/P-gina-velocidad-de-sustituci-n..git
   ```
2. Abre el archivo `index.html` en cualquier navegador web moderno (Edge, Chrome, Safari, Firefox, Opera, Brave).

---

## 📄 Publicación Académica y Autor

* **Investigador y Desarrollador:** Jan Pier Molina Castaño
* **Institución:** Universidad de La Guajira (Riohacha, Colombia — 2026)
* **Contacto:** [Instagram @jean.pieerr](https://www.instagram.com/jean.pieerr/)
* **Paper Científico Oficial:** [Zenodo Record 22656086](https://zenodo.org/records/22656086)

---

## ⚖️ Licencia

Este proyecto está distribuido bajo la **Licencia MIT**. Consulta el archivo `LICENSE` para conocer los términos de libre uso, modificación y distribución.
