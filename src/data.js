export const stakeholders = [
  {
    stakeholder: 'MinTIC',
    total_pct: 100,
    variables: {
      'Política de datos e interoperabilidad (estándares, datos abiertos)': {
        total_pct: 22,
        impacto_pct: { politico: 6, económico: 4, técnico: 8, social: 1, ambiental: 0, legal: 3 },
      },
      'Lineamientos de ciberseguridad (CONPES/guías sectoriales)': {
        total_pct: 20,
        impacto_pct: { politico: 2, económico: 3, técnico: 9, social: 1, ambiental: 0, legal: 5 },
      },
      'Conectividad y políticas TIC (capilaridad/redes)': {
        total_pct: 18,
        impacto_pct: { politico: 5, económico: 4, técnico: 5, social: 1, ambiental: 0, legal: 3 },
      },
      'Servicios digitales y uso de nube (cloud-first/gobierno digital)': {
        total_pct: 16,
        impacto_pct: { politico: 3, económico: 4, técnico: 6, social: 1, ambiental: 0, legal: 2 },
      },
      'Programas de fomento/innovación (convocatorias, pilotos)': {
        total_pct: 14,
        impacto_pct: { politico: 3, económico: 6, técnico: 3, social: 1, ambiental: 0, legal: 1 },
      },
      'Estándares/guías técnicas para IoT': {
        total_pct: 10,
        impacto_pct: { politico: 1, económico: 1, técnico: 4, social: 0, ambiental: 0, legal: 4 },
      },
    },
  },
  {
    stakeholder: 'MinAmbiente',
    total_pct: 100,
    variables: {
      'Gestión de RAEE (residuos de equipos eléctricos/electrónicos)': {
        total_pct: 22,
        impacto_pct: { politico: 2, económico: 5, técnico: 3, social: 2, ambiental: 8, legal: 2 },
      },
      'Huella de carbono/GEI y compras sostenibles': {
        total_pct: 18,
        impacto_pct: { politico: 2, económico: 4, técnico: 3, social: 2, ambiental: 6, legal: 1 },
      },
      'Licenciamiento/permiso ambiental y manejo de residuos (si aplica)': {
        total_pct: 16,
        impacto_pct: { politico: 2, económico: 3, técnico: 2, social: 1, ambiental: 4, legal: 4 },
      },
      'Mitigación, adaptación y economía circular': {
        total_pct: 16,
        impacto_pct: { politico: 2, económico: 3, técnico: 2, social: 2, ambiental: 6, legal: 1 },
      },
      'Normativa de calidad ambiental en edificios (ruido, confort)': {
        total_pct: 14,
        impacto_pct: { politico: 1, económico: 2, técnico: 3, social: 2, ambiental: 4, legal: 2 },
      },
      'Reportes/compromisos voluntarios (p. ej., CDP, ESG)': {
        total_pct: 14,
        impacto_pct: { politico: 2, económico: 3, técnico: 2, social: 3, ambiental: 3, legal: 1 },
      },
    },
  },
  {
    stakeholder: 'Proveedor IoT/Cloud',
    total_pct: 100,
    variables: {
      'SLA, disponibilidad y redundancia multi-región': {
        total_pct: 22,
        impacto_pct: { politico: 0, económico: 5, técnico: 12, social: 1, ambiental: 0, legal: 4 },
      },
      'Seguridad y cumplimiento (ISO 27001, SOC 2, cifrado, backup)': {
        total_pct: 20,
        impacto_pct: { politico: 0, económico: 3, técnico: 8, social: 1, ambiental: 0, legal: 8 },
      },
      'Arquitectura e integración (APIs/SDKs, interoperabilidad)': {
        total_pct: 18,
        impacto_pct: { politico: 0, económico: 3, técnico: 12, social: 1, ambiental: 0, legal: 2 },
      },
      'Costos y pricing (on-demand, reservas, escalamiento)': {
        total_pct: 16,
        impacto_pct: { politico: 0, económico: 12, técnico: 2, social: 1, ambiental: 0, legal: 1 },
      },
      'Soporte y éxito del cliente (SRE, response time, capacitación)': {
        total_pct: 12,
        impacto_pct: { politico: 0, económico: 3, técnico: 5, social: 3, ambiental: 0, legal: 1 },
      },
      'Roadmap, lock-in y portabilidad (multi-cloud)': {
        total_pct: 12,
        impacto_pct: { politico: 0, económico: 4, técnico: 4, social: 1, ambiental: 0, legal: 3 },
      },
    },
  },
  {
    stakeholder: 'Cliente/Operaciones',
    total_pct: 100,
    variables: {
      'Aprobación de presupuesto y procurement': {
        total_pct: 22,
        impacto_pct: { politico: 2, económico: 12, técnico: 2, social: 2, ambiental: 0, legal: 4 },
      },
      'Adopción y gestión del cambio (formación, cultura datos)': {
        total_pct: 18,
        impacto_pct: { politico: 1, económico: 4, técnico: 3, social: 8, ambiental: 0, legal: 2 },
      },
      'Gobernanza de datos y KPIs (ahorro, disponibilidad, MTBF)': {
        total_pct: 16,
        impacto_pct: { politico: 0, económico: 3, técnico: 6, social: 3, ambiental: 0, legal: 4 },
      },
      'Integración con BMS/ERP/OT (interfaces y procesos)': {
        total_pct: 16,
        impacto_pct: { politico: 0, económico: 3, técnico: 10, social: 1, ambiental: 0, legal: 2 },
      },
      'Operación y mantenimiento (O&M) de la solución': {
        total_pct: 14,
        impacto_pct: { politico: 0, económico: 5, técnico: 6, social: 2, ambiental: 0, legal: 1 },
      },
      'HSE/Seguridad industrial y continuidad de negocio': {
        total_pct: 14,
        impacto_pct: { politico: 1, económico: 2, técnico: 3, social: 4, ambiental: 1, legal: 3 },
      },
    },
  },
]

export const environments = ['politico','económico','técnico','social','ambiental','legal']
