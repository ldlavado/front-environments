# MML_2 — Camino A (HA/DR multi-región, FO-01-P1)

## Fin
- **Enunciado:** Continuidad de servicio crítico asegurada con HA/DR multi-región y trazabilidad certificable.
- **Indicadores:**
  - FIN-1: Disponibilidad de servicios críticos — Meta: ≥99.95% multi-región — MV: Monitoreo SRE y reportes mensuales.
  - FIN-2: RTO/RPO validados — Meta: ≤5 min en pruebas trimestrales — MV: Bitácora de pruebas HA/DR.
  - FIN-3: Auditorías y cumplimiento — Meta: 0 hallazgos críticos — MV: Informes de auditoría y SIEM.
- **Supuestos:** Regiones cloud y enlaces redundantes activos; patrocinio ejecutivo para reservas multi-región; sin fallas prolongadas de terceros (ISP/colo).

## Propósito
- **Enunciado:** Arquitectura activa-activa (Camino A) desplegada con runbooks automatizados y operación SRE 24/7.
- **Indicadores:**
  - PRO-1: Pruebas HA/DR exitosas — Meta: ≥4/año, 100% exitosas — MV: Bitácora automatizada y reportes SRE.
  - PRO-2: Latencia a sitios críticos — Meta: <35 ms promedio — MV: Monitoreo sintético.
  - PRO-3: Runbooks actualizados — Meta: ≥90% runbooks validados trimestralmente — MV: Repositorio IaC/ops.
  - PRO-4: SLA soporte — Meta: MTTR <30 min para incidentes P1 — MV: Gestor de incidentes (ITSM).
- **Supuestos:** Ventanas de prueba controladas; equipos SRE y seguridad con tiempo asignado.

## Componentes y actividades

### C1. Infraestructura activa-activa multi-región entregada
- Indicadores: C1-I1 (2+ regiones activas, MV: IaC/monitoreo); C1-I2 (latencia <35 ms / throughput p95, MV: synthetic+APM).
- Supuestos: Regiones/AZ disponibles; financiación de reservas y enlaces.
- Portafolio: FO-01-P1. Programas: digital, operaciones. Entornos: técnico, legal.
- Actividades: A1 (Diseño IaC multi-región), A2 (Provisionamiento automatizado en 2+ regiones).

### C2. Orquestación y pruebas HA/DR automatizadas
- Indicadores: C2-I1 (≥80% casos automatizados); C2-I2 (≥90% servicios críticos con runbook).
- Supuestos: Acceso a datos de producción para pruebas controladas; ventanas de prueba acordadas.
- Portafolio: FO-01-P1. Programas: operaciones, cumplimiento. Entornos: técnico.
- Actividades: A3 (Automatizar runbooks failover/failback), A4 (Pruebas trimestrales HA/DR + observabilidad sintética).

### C3. Trazabilidad y cumplimiento Zero-Trust para HA/DR
- Indicadores: C3-I1 (100% eventos críticos registrados, MV: SIEM/bitácoras); C3-I2 (Hallazgos críticos = 0).
- Supuestos: Integraciones SIEM e identidades listas; políticas de retención definidas.
- Portafolio: FA-02-P1. Programas: cumplimiento, digital. Entornos: legal, técnico.
- Actividades: A5 (Integrar trazabilidad y SIEM para DR), A6 (Validar controles Zero-Trust/cifrado).

### C4. Operación SRE 24/7 y soporte en campo/edge
- Indicadores: C4-I1 (Cobertura SRE 24/7 con runbooks validados); C4-I2 (MTTR P1 <30 min).
- Supuestos: Rotación on-call cubierta; alineación con equipos de campo y seguridad.
- Portafolio: FO-01-P1. Programas: operaciones. Entornos: técnico, social.
- Actividades: A7 (Operación SRE 24/7 y playbooks), A8 (Soporte en campo/edge y capacitación).

## Stakeholders clave
- **Patrocinio y decisión:** Cliente/Operaciones; Finanzas/Sponsors — aprueban presupuesto multi-región y ventanas de prueba.
- **Proveedor cloud/SRE:** Proveedor IoT/Cloud — opera infraestructura activa-activa, SRE 24/7 y runbooks HA/DR.
- **Seguridad y cumplimiento:** Seguridad/Compliance — mantiene Zero-Trust, SIEM y evidencias de auditoría.
- **Operaciones en campo:** Equipos OT/IT en sitio — soporte edge, pruebas controladas y continuidad local.
- **Regulador/Auditor:** MinTIC/Regulador; Auditor interno — revisan cumplimiento y trazabilidad.

## Supuestos globales
- Sin restricciones regulatorias nuevas que bloqueen multi-región.
- Costos de red y cloud se mantienen dentro del caso de negocio.

## Controles y exportación
- El componente `MmlMatrix2` permite importar/exportar JSON (clave localStorage `mml2_data`) y exportar la matriz a PNG.
