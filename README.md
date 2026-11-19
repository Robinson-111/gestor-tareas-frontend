# TaskFlow · Frontend

Interfaz web para el gestor de tareas. Consume la API Django en `/api/v1/`.

## Stack

| Tecnología | Uso |
|---|---|
| **React 18 + TypeScript** | Componentes y tipado estricto |
| **Vite 6** | Dev server y build |
| **Tailwind CSS 3** | Sistema de diseño utilitario |
| **React Router 6** | Rutas protegidas por sesión y rol |
| **TanStack Query 5** | Caché, fetching y mutaciones |
| **Axios** | Cliente HTTP con refresh automático de JWT |
| **Zustand** | Sesión persistida y notificaciones |
| **Lucide React** | Iconografía |

## Funcionalidad

- **Autenticación**: login, registro y logout con JWT.
- **Sesión persistente** en `localStorage` y renovación automática del access token
  (rotando también el refresh token).
- **Mis módulos**: tarjetas con estado, contadores de tareas, integrantes y rol del
  usuario. Búsqueda local y creación de módulos con integrantes iniciales.
- **Detalle de módulo**: cabecera con estado y OWNER, pestañas de tareas
  (todas / pendientes / en curso / completadas), creación y edición de tareas,
  marcado rápido como completada, borrado y panel de miembros.
- **Miembros**: agregar, quitar, transferir la propiedad y abandonar el módulo.
- **Explorar**: módulos sin OWNER con acción de reclamo.
- **Admin**: listado y eliminación de cuentas para `ADMIN` y `SUPER_ADMIN`.
- **Diseño**: minimalista, responsive (sidebar en escritorio, drawer en móvil),
  estados vacíos, skeletons, toasts y confirmaciones.

## Puesta en marcha

Requisitos: Node.js 20+ y el backend en `http://localhost:8000`.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

El proxy de Vite reenvía `/api` a `http://localhost:8000`, por lo que no hace falta
configurar CORS para desarrollo. Si el backend vive en otra URL:

```bash
# .env
VITE_API_URL=http://localhost:8000/api/v1
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (5173) |
| `npm run build` | Typecheck + build de producción |
| `npm run preview` | Sirve el build |
| `npm run typecheck` | Solo TypeScript |

## Estructura

```text
src/
├── components/
│   ├── layout/       AppLayout, AuthShell, Logo
│   ├── members/      AddMemberModal, MembersPanel
│   ├── modules/      ModuleCard, ModuleFormModal
│   ├── tasks/        TaskFormModal
│   └── ui/           Button, Field, Modal, Badge, Avatar…
├── hooks/            useAuth, useModules, useMembers, useTasks
├── lib/              api (axios + refresh), queries, utils
├── pages/            Login, Register, Modules, ModuleDetail, Explorer, Admin, 404
├── routes/           ProtectedRoute
├── stores/           auth (Zustand persist), toast
└── types/            Tipos del contrato de la API
```

## Contrato de la API

- Base: `/api/v1`.
- Éxito: `{ message, data }` o el recurso directo según el endpoint.
- Error: envelope `{ message, errors?, code? }`; `errors` es un mapa
  `campo → string[]`.
- Los listados paginan con `page` y `page_size`; el frontend recorre las páginas
  (hasta 100 por página) para trabajar con listas completas.

Documentación completa del backend: `C:\Users\x\Documents\Proyecto Gestor de Tareas\documentacion-api`.

## Notas

- Los tokens se guardan en `localStorage` porque el backend actualmente los
  devuelve en el body JSON. Ver deuda técnica de la API (migración a cookies
  HttpOnly).
- La ruta `PATCH /modules/{id}/claim` se invoca **sin slash final**, tal como
  está definida en el backend.
- El listado de usuarios no expone `rol`; por eso la vista de Admin no muestra el
  rol global de cada cuenta.
