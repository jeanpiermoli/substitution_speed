# 🔬 Simulador de Dinámica de Sistemas Interpersonales

Bienvenido al repositorio oficial del **Simulador de Dinámica de Sistemas Interpersonales**. Este proyecto consiste en un dashboard interactivo diseñado para la exploración, simulación y análisis numérico de modelos de dinámicas relacionales en tiempo real. 

A través de esta plataforma web, los usuarios pueden evaluar cómo varían distintos parámetros interpersonales, analizar tendencias de cambio y calcular niveles de desgaste acumulado sin necesidad de realizar cálculos manuales ni instalar software adicional.

---

## 🎯 ¿Para qué sirve este proyecto?

El simulador permite estudiar de manera cuantitativa y visual la conducta de modelos interpersonales complejos. Con este sistema puedes:

1. **Analizar la Velocidad de Respuesta o Sustitución ($V(x)$):** Observar el comportamiento del sistema ante diferentes niveles de inversión o distancia ($x$).
2. **Evaluar el Ritmo de Cambio o Aceleración ($V'(x)$):** Determinar la estabilidad del sistema y anticipar si se encuentra en fase de crecimiento o declive.
3. **Calcular el Desgaste Acumulado ($\Delta D$):** Medir el área bajo la curva mediante integrales definidas en un rango específico de transición $[x_1, x_2]$.
4. **Visualizar Discontinuidades y Diagnósticos Automáticos:** Monitorear transiciones no lineales (como atenuación, saturación y colapso estructural) acompañadas de interpretaciones cualitativas automáticas.

---

## 💻 Guía de Uso del Simulador

La interfaz del programa está dividida en dos secciones principales: el **Panel de Controles y Diagnóstico** (izquierda) y el **Panel Gráfico Interactivo** (derecha).

### 1. Selección de Pestañas de Análisis
En la parte superior encontrarás tres modos de trabajo:
* **Velocidad ($V(x)$):** Modo principal para observar el estado actual del sistema y la descomposición de sus términos.
* **Aceleración ($V'(x)$):** Muestra el ritmo de cambio puntual y determina si el comportamiento es creciente o decreciente.
* **Área Bajo la Curva ($\Delta D$):** Habilita los selectores de rango $[x_1, x_2]$ para calcular numéricamente la integral y el desgaste acumulado.

### 2. Controles de Parámetros
* **Slider de Evaluación ($x$):** Arrastra el control para evaluar cualquier punto específico.
* **Inputs de Calibración:** Modifica los coeficientes del modelo (Carencia $a$, Saturación $b$, Transición $c$, Fricción $k$, Umbral Heaviside $x_s$, etc.) para observar cómo se deforma la curva en tiempo real.
* **Botones de Escenarios Predefinidos (*Presets*):** Puedes hacer clic en cualquiera de los tres botones rápidos para cargar configuraciones canónicas:
  * 🔴 **Negligencia / Déficit:** Carga un escenario de baja inversión ($x = 1.0$).
  * 🟢 **Equilibrio Óptimo:** Configura un estado de máxima estabilidad ($x = 4.0$).
  * 🟠 **Saturación y Colapso:** Aplica parámetros de asfixia o exceso ($x = 9.0$).

### 3. Interpretación de Resultados y Gráfica
* **Visualización en Canvas:** La curva azul principal muestra el comportamiento del sistema. Las áreas sombreadas representan integrales en el rango seleccionado.
* **Conmutadores de Capas:** Puedes marcar o desmarcar las casillas sobre la gráfica para ocultar o mostrar trazos individuales de cada componente.
* **Diagnóstico Cualitativo:** En el panel izquierdo aparecerán tarjetas con insignias de color (*Badges*) indicando la zona activa (Negligencia, Equilibrio, Fatiga o Colapso) y una lectura explicativa del estado actual.

---

## 🛠️ Arquitectura del Software y Flujo de Trabajo

El sistema está desarrollado con **JavaScript Vanilla (ES6+)**, sin frameworks pesados, garantizando un rendimiento óptimo de 60 FPS en el renderizado del lienzo Canvas HTML5.

```
├── index.html              # Estructura semántica, paneles y navegación
├── css/
│   ├── variables.css       # Tokens de diseño (Paleta Titanio/Azul Nórdico)
│   ├── base.css            # Resets y tipografías (Outfit, Inter, JetBrains Mono)
│   ├── components.css      # Tarjetas, controles, sliders, badges y tooltips
│   └── charts.css          # Viewport del Canvas 2D y barra de herramientas
├── js/
│   ├── math-engine.js      # Motor numérico (Cálculo de V(x), V'(x) e integrales)
│   ├── diagnostics.js     # Matriz de diagnósticos, casos canónicos y textos
│   ├── chart-engine.js     # Motor gráfico y renderizado en Canvas 2D
│   ├── latex-renderer.js   # Integración con KaTeX para fórmulas matemáticas
│   ├── ui-controller.js    # Gestor de eventos del DOM y sincronización
│   └── main.js             # Punto de entrada y arranque de la aplicación
└── assets/                 # Recursos gráficos e imágenes institucionales
```

### Flujo de Datos Interno:

```
[ Interacción del Usuario ] (Sliders, Inputs, Presets, Pestañas)
            │
            ▼
     [ UIController ] ─────► Solicits datos a ─────► [ MathEngine ]
            │                                               │
            ├──► Consulta diagnóstico a                     │ Devuelve cálculo
            │    [ DiagnosticsEngine ]                      │ de la función
            │                                               ▼
            ├──► Actualiza paneles del DOM ◄────────────────┘
            │
            └─► Solicita renderizado ────► [ ChartEngine ]
                                                │
                                                ▼
                                    [ Redibuja Canvas 2D ]
```

---

## 🚀 Instalación y Ejecución Local

Dado que es una aplicación web cliente estática, **no requiere la instalación de Node.js, dependencias ni procesos de compilación**.

1. **Clonar o descargar el repositorio:**
   ```bash
   git clone https://github.com/jeanpiermoli/P-gina-velocidad-de-sustituci-n..git
   cd P-gina-velocidad-de-sustituci-n.
   ```
2. **Ejecutar en el navegador:**
   - Abre directamente el archivo `index.html` haciendo doble clic o arrastrándolo a cualquier navegador web (Chrome, Edge, Firefox, Safari, Brave).
   - También puedes usar extensiones como **Live Server** en Visual Studio Code.

---

## 👨‍💻 Créditos y Licencia

* **Autor e Investigador:** Jan Pier Molina Castaño
* **Institución:** Universidad de La Guajira (2026)
* **Contacto:** [Instagram @jean.pieerr](https://www.instagram.com/jean.pieerr/)

Este proyecto está disponible para fines educativos, de investigación y consulta académica.