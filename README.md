# El Pistón | Sistema de gestión de taller automotriz

Aplicación web para centralizar los clientes, vehículos, órdenes de servicio, trabajos, repuestos y pagos de un taller automotriz. Incluye un panel operativo, seguimiento de órdenes, alertas de inventario e informes de facturación y saldos pendientes.

## Tecnologías y decisiones de diseño

| Componente | Tecnología | Decisión |
|---|---|---|
| Interfaz | HTML5, CSS3 y JavaScript (ES Modules) | Sin framework ni proceso de compilación; diseño adaptable a escritorio y móvil. |
| Comunicación | SDK de PocketBase para JavaScript (`pocketbase.es.mjs`) | Centraliza las llamadas HTTP, la sesión y el acceso a colecciones. |
| Servidor | PocketBase **v0.41.1** | Proporciona autenticación, reglas de acceso, API y persistencia sin servidor adicional. |
| Base de datos | SQLite integrada en PocketBase | Las relaciones se definen mediante campos `relation`. |
| Versionado del servidor | `pb_migrations/*.js` | Esquema, índices y permisos reproducibles mediante tres migraciones secuenciales. |
| Organización del cliente | SPA con vistas y formularios en `client/js/app.js` | Navegación sin recargar y uso directo del SDK. |

**Paleta visual:** azul marino `#153A56` para navegación y acciones principales, azul claro `#54B8E8` para acciones destacadas y ámbar `#F59E0B` para avisos de inventario.

**Convenciones de negocio:** los importes se guardan como enteros en centavos; el precio de cada trabajo o repuesto consumido queda en el registro de la orden; el inventario disponible se obtiene de unidades recibidas menos unidades consumidas. Se separan los importes facturados por órdenes entregadas y los cobros efectivamente registrados.

## Requisitos para ejecutar localmente

- Windows, macOS o Linux.
- Ejecutable **PocketBase v0.41.1** para el sistema operativo.
- Navegador moderno (Edge, Chrome o Firefox).
- Python 3, utilizado **solo** para servir los archivos estáticos del cliente por HTTP.
- SDK JavaScript disponible como `client/vendor/pocketbase.es.mjs` (incluido en la versión del proyecto que hemos preparado; si falta, se puede instalar mediante los scripts de `client/`).

No se requieren Node.js, Express, servicios de alojamiento ni una base de datos externa.

## Ejecución rápida

### 1. Iniciar PocketBase

Colocar el ejecutable de PocketBase en `server/` y abrir una terminal en esa carpeta.

**Windows — PowerShell:**

```powershell
.\pocketbase.exe serve
```

**macOS / Linux:**

```bash
./pocketbase serve
```

PocketBase ejecuta las migraciones pendientes de `server/pb_migrations/` al iniciar. El panel de administración se encuentra en **http://127.0.0.1:8090/_/**.

En el primer inicio, crear el superusuario de administración desde el panel. A continuación, crear las cuentas de empleados en **Collections → users**:

| Personal | `rol` | `activo` |
|---|---|---|
| Dueño | `dueno` | `true` |
| Recepcionista | `recepcionista` | `true` |
| Mecánicos | `mecanico` | `true` |

Cada empleado requiere `nombre`, `email` y `password`. Un dueño activo puede iniciar sesión aunque todavía no se hayan creado otras cuentas; para **crear órdenes** se necesita al menos un mecánico activo. `activo` es un campo de negocio distinto del campo nativo `verified`.

### 2. Servir el frontend

Con PocketBase ejecutándose, abrir **otra terminal** dentro de `client/`:

```powershell
py -m http.server 5500 --bind 127.0.0.1
```

Si el comando `py` no está disponible, usar `python -m http.server 5500 --bind 127.0.0.1` (o `python3` en macOS/Linux).

Abrir **http://127.0.0.1:5500/** e iniciar sesión con el correo y la contraseña de un registro de `users`, **no** con el superusuario del panel de PocketBase.

| Dirección | Uso |
|---|---|
| `http://127.0.0.1:8090` | Servidor PocketBase y API |
| `http://127.0.0.1:8090/_/` | Panel de administración de PocketBase |
| `http://127.0.0.1:5500` | Aplicación web |

La constante `API_URL` al inicio de `client/js/app.js` define el servidor de PocketBase.

### 3. Recorrido inicial

1. Iniciar sesión como dueño o recepcionista.
2. Crear un **cliente** y asociarle un **vehículo**.
3. Registrar uno o más **repuestos** con precio, unidades recibidas y stock mínimo.
4. Crear una **orden**, asignando vehículo y mecánico.
5. Agregar **diagnóstico, trabajos y repuestos utilizados**.
6. Registrar un **pago** y verificar los importes de la orden.
7. Actualizar el **estado** y consultar **dashboard, inventario y reportes**.

## Estructura del repositorio

```text
el-piston-proyecto/
├── README.md
├── .gitignore
├── client/
│   ├── index.html
│   ├── css/styles.css
│   ├── js/app.js
│   ├── vendor/pocketbase.es.mjs
│   ├── instalar-sdk.ps1
│   ├── instalar-sdk.sh
│   └── README.md
├── server/
│   ├── README.md
│   └── pb_migrations/
│       ├── 20261107000000_crear_modelo.js
│       ├── 20261108000000_agregar_fechas.js
│       └── 20261108010000_exigir_mecanico.js
├── docs/
│   ├── arquitectura.md
│   ├── modelo-datos.md
│   ├── api.md
│   ├── permisos.md
│   ├── configuracion-servidor.md
│   ├── operacion.md
│   └── pruebas.md
└── capturas/
```

`server/pb_data/` se crea al ejecutar el servidor y contiene la base de datos; no forma parte del repositorio. El ejecutable de PocketBase se instala por separado.

## Documentación técnica

| Archivo | Contenido |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Componentes, estructura, relaciones y decisiones técnicas. |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Diccionario de las ocho colecciones, campos e índices. |
| [`docs/api.md`](docs/api.md) | Endpoints HTTP, autenticación, ejemplos de SDK y payloads. |
| [`docs/permisos.md`](docs/permisos.md) | Roles y reglas de autorización efectivas. |
| [`docs/configuracion-servidor.md`](docs/configuracion-servidor.md) | Migraciones, configuración, datos locales y mantenimiento. |
| [`docs/operacion.md`](docs/operacion.md) | Procesos del taller y cálculos de negocio. |
| [`docs/pruebas.md`](docs/pruebas.md) | Escenarios de verificación funcional y API. |
| [`client/README.md`](client/README.md) / [`server/README.md`](server/README.md) | Referencia rápida por componente. |

## Datos y repositorio

Conservar las migraciones en control de versiones y excluir `server/pb_data/`, ejecutables y credenciales. El archivo `.gitignore` ya contempla esos recursos. Para llevar el servidor a una instalación nueva, copiar las migraciones, iniciar PocketBase y registrar los empleados desde el panel administrativo.

Para instrucciones completas, consultar [`docs/configuracion-servidor.md`](docs/configuracion-servidor.md).
