# Plan Pendiente: Proyectos, Aprobación y Evidencias

Fecha: 2026-04-21

## Alcance implementado

Se dejó avanzado el flujo de proyectos para:

- Subir hasta 2 evidencias por proyecto.
- Comprimir evidencias desde el navegador y validarlas por debajo de 1 MB.
- Enviar proyectos a aprobación administrativa.
- Resolver aprobaciones o rechazos desde `planning/approvals`.
- Intentar notificar por correo al creador del proyecto cuando el administrador aprueba o rechaza.

## Archivos principales tocados

### Frontend

- `clima-web/src/pages/Planning/components/ProjectEvidenceManager.tsx`
- `clima-web/src/pages/Planning/components/ProjectModal.tsx`
- `clima-web/src/pages/Planning/components/ProjectContextMenu.tsx`
- `clima-web/src/pages/Planning/ProyectosPage.tsx`
- `clima-web/src/pages/Planning/ApprovalsPage.tsx`
- `clima-web/src/services/clarity.service.ts`
- `clima-web/src/services/planning.service.ts`
- `clima-web/src/types/modelos.ts`

### Backend Rust

- `backendrust/Cargo.toml`
- `backendrust/Cargo.lock`
- `backendrust/src/router.rs`
- `backendrust/src/handlers/proyectos.rs`
- `backendrust/src/handlers/planning.rs`
- `backendrust/src/db/scripts/create_proyecto_evidencias.sql`
- `backendrust/src/db/scripts/create_proyecto_aprobaciones.sql`

## Pendientes para cerrar funcionalidad

1. Aplicar los scripts SQL en SQL Server:
   - `backendrust/src/db/scripts/create_proyecto_evidencias.sql`
   - `backendrust/src/db/scripts/create_proyecto_aprobaciones.sql`

2. Desplegar y reiniciar el backend Rust que sirve `/api-portal-clima/`.

3. Verificar permisos reales en producción:
   - creador puede editar mientras el proyecto está en `Borrador` o `Rechazado`
   - creador no puede editar cuando está en `PendienteAprobacion`
   - administrador puede aprobar o rechazar

4. Probar el correo end to end:
   - aprobación con comentario opcional
   - rechazo con comentario obligatorio
   - validar remitente, destinatario y contenido

5. Probar almacenamiento de evidencias en disco:
   - ruta esperada: `/opt/apps/clima-portal-data/proyectos/<idProyecto>/`
   - validar permisos de escritura del proceso backend
   - validar reemplazo por `slot` 1 y 2

6. Validar visualización rápida de evidencias:
   - dos imágenes máximo por proyecto
   - eliminación y recarga
   - comportamiento con imágenes grandes o no soportadas

## Riesgos abiertos

- `cargo check` no quedó validado en este VPS por un fallo del compilador del entorno al compilar `aws-lc-sys`, así que la lógica nueva del backend todavía requiere validación al compilar en el servicio real.
- Los `package-lock.json` de `clima-web` y `clima-api-nest` quedaron modificados localmente por instalaciones previas, pero no forman parte de este cambio funcional.
- `backendrust/` no estaba previamente versionado en este repo, así que el commit de esta entrega debe mantener foco en los archivos funcionales y no arrastrar artefactos de diagnóstico.

## Checklist operativo sugerido

1. Ejecutar SQL.
2. Compilar backend Rust.
3. Reiniciar proceso PM2 o servicio equivalente.
4. Crear proyecto de prueba.
5. Subir 2 evidencias WebP.
6. Enviar proyecto a aprobación.
7. Aprobar desde admin y validar correo.
8. Repetir con rechazo y corrección.

## Resultado esperado

Al cerrar estos pendientes, cada proyecto podrá manejar hasta 2 evidencias livianas y quedará sujeto a revisión administrativa formal antes de pasar a estado operativo.
