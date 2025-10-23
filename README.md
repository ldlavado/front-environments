# MGIP Environments (front-end)

Aplicación web interactiva para analizar variables por entornos y stakeholders. Ofrece gráficos, matrices de análisis (DOFA, MEFI, MEFE, MAFE, MPC, MML), comparativas y herramientas para editar/importar datos.

La app usa React + Vite, Chart.js y un tema visual claro único basado en variables CSS.

## Vista general

Estructura principal del código en `src/`:

- `App.jsx`: orquesta la navegación por pestañas y carga de datos.
- `data.js`: datos por defecto y función `loadDefaultData()` que intenta cargar `public/default-data.json` con fallback local.
- `index.css`: tokens de estilo (CSS variables) y estilos globales. Tema fijo en claro.
- `components/`: componentes de visualización y análisis (ver lista abajo).

Fuentes de datos en `public/`:

- `default-data.json`: archivo que la app intenta cargar al iniciar.
- Otros JSON de ejemplo: `dofa.json`, `mafe.json`, `mefi.json`, `mefe.json`, `mml.json`, `mpc.json`.

## Componentes principales

- `Navbar.jsx`: barra fija con grupos de navegación y acción para “Restaurar datos por defecto”.
- `Charts.jsx`: gráficos base de distribución por entornos/stakeholders.
- `EnvironmentImpact.jsx`: impacto por entorno para stakeholders seleccionados.
- `StackedEnvironments.jsx`: comparación apilada entre entornos.
- `Heatmap.jsx`: mapa de calor de variables vs entornos.
- `RadarProfile.jsx`: perfiles tipo radar.
- `SimilarityMatrix.jsx`: matriz de similitud entre entornos o stakeholders.
- `SankeySimple.jsx`: flujo Sankey a partir de texto/relaciones.
- Matrices de análisis:
  - `DofaMatrix.jsx` (DOFA)
  - `MefiMatrix.jsx` (MEFI)
  - `MefeMatrix.jsx` (MEFE)
  - `MafeMatrix.jsx` (MAFE)
  - `MpcMatrix.jsx` (MPC)
  - `MmlMatrix.jsx` (MML)
- `StakeholderEditor.jsx`: editor de stakeholders y variables (con persistencia local).
- `ExcelView.jsx`: vista estilo “Excel” para editar/importar datos rápidamente.
- `EnvironmentResilience.jsx`: visualización de resiliencia por entorno.

Cada vista se selecciona desde la barra superior. La URL usa `hash` (por ejemplo `#heatmap`) para permitir navegación directa.

## Datos y formato

- Los datos por defecto están embebidos en `src/data.js` y se intentan sobrescribir con `public/default-data.json` si existe y es válido.
- Estructura esperada mínima:

```json
{
  "stakeholders": [
    {
      "stakeholder": "MinTIC",
      "total_pct": 10,
      "variables": {
        "Nombre variable": {
          "total_pct": 22,
          "impacto_pct": { "politico": 6, "económico": 4, "técnico": 8, "social": 1, "ambiental": 0, "legal": 3 }
        }
      }
    }
  ],
  "environments": ["politico", "económico", "técnico", "social", "ambiental", "legal"]
}
```

Si el `fetch` falla o el archivo no cumple el formato, se usa el fallback embebido.

## Requisitos técnicos

- Node.js 18+ (recomendado 18 LTS o 20).
- npm 9+.
- Navegador moderno (Chrome, Edge, Firefox) con soporte ES2020+.

Dependencias clave:

- React 19
- Vite 7
- Chart.js 4 y `chartjs-plugin-datalabels`

## Scripts disponibles

Todos se ejecutan desde la raíz del proyecto.

- Desarrollo (HMR):

```bash
npm run dev
```

- Construcción de producción:

```bash
npm run build
```

- Previsualización del build:

```bash
npm run preview
```

- Linter (ESLint):

```bash
npm run lint
```

## Tema visual

- La aplicación usa un único tema claro. Las variables CSS viven en `:root` dentro de `src/index.css` y no hay alternancia de tema.
- Esto evita conflictos entre temas y simplifica el renderizado de gráficos.

## Despliegue

- El proyecto incluye `render.yaml` para despliegue en Render.com. Flujo típico:
  1) Crear servicio estático en Render apuntando a este repo.
  2) Comando de build: `npm run build`.
  3) Directorio de publicación: `dist/`.
- Para otros proveedores (Netlify, Vercel, GitHub Pages), basta con publicar el contenido de `dist/` tras ejecutar el build.

## Notas y buenas prácticas

- Mantén coherencia con el formato de `default-data.json` si lo personalizas.
- Para cambios grandes en datos, verifica en varias vistas (Heatmap, Radar, Matrices) que los valores no rompan escalas.
- Si agregas componentes nuevos, reutiliza tokens de color de `index.css`.

## Desarrollo futuro (ideas)

- Exportar/Importar a CSV y XLSX desde `ExcelView`.
- Filtros avanzados por stakeholder/entorno.
- Parámetros en URL para estados (selecciones) compartibles.
