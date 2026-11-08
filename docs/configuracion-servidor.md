# Configuración y administración del servidor PocketBase

## 1. Instalación

Descargar **PocketBase v0.41.1** para el sistema operativo desde <https://pocketbase.io/docs/> y colocar el ejecutable en `server/`:

```text
server/
├── pocketbase.exe             # Windows (o pocketbase en macOS/Linux)
├── pb_migrations/
│   ├── 20261107000000_crear_modelo.js
│   ├── 20261108000000_agregar_fechas.js
│   └── 20261108010000_exigir_mecanico.js
└── pb_data/                   # Creada automáticamente al iniciar
```

Ejecutar desde `server/`:

```powershell
.\pocketbase.exe serve
```

En macOS/Linux usar `./pocketbase serve`. Por defecto la API queda en `http://127.0.0.1:8090` y el panel administrativo en `http://127.0.0.1:8090/_/`.

## 2. Migraciones (orden de aplicación)

| Archivo | Responsabilidad |
|---|---|
| `20261107000000_crear_modelo.js` | Añade campos y reglas a `users`; crea siete colecciones Base, relaciones y dos índices únicos. |
| `20261108000000_agregar_fechas.js` | Añade los campos `created` y `updated` de tipo Autodate a las siete colecciones Base. |
| `20261108010000_exigir_mecanico.js` | Hace obligatorio `ordenes.mecanico` y ajusta la regla de cambio de estado para mecánicos. |

PocketBase aplica las migraciones pendientes automáticamente al iniciar con `serve`. Para ejecutarlas manualmente, con el proceso detenido, está disponible:

```powershell
.\pocketbase.exe migrate up
```

Las migraciones ya aplicadas quedan registradas en la tabla interna `_migrations`; **no se repiten con cada reinicio**.

Si el servidor ya está funcionando con sus colecciones y registros, conservar `pb_data` y los tres archivos originales. No es necesario borrar la base de datos ni reconstruir las colecciones.

## 3. Preparar empleados

Desde el panel administrativo, crear los registros de `users`:

| Campo | Ejemplo |
|---|---|
| `nombre` | `Ana Rodríguez` |
| `email` | `ana@elpiston.local` |
| `password` | Contraseña definida por el administrador |
| `rol` | `dueno`, `recepcionista` o `mecanico` |
| `activo` | `true` |

La cuenta del superusuario de PocketBase se utiliza para administración y es distinta de las cuentas de empleados que inician sesión en la aplicación. Se recomienda crear un dueño, una recepcionista y dos mecánicos; para registrar órdenes es necesario al menos un mecánico activo.

## 4. Administración del esquema

Para consultar o ajustar colecciones:

1. Acceder a `http://127.0.0.1:8090/_/`.
2. Abrir **Collections**.
3. Seleccionar `users` o una colección de negocio.
4. Revisar los campos y la pestaña **API Rules**.

El servidor precompilado tiene automigración habilitada por defecto. Los cambios realizados en las colecciones mediante el panel pueden generar nuevas migraciones en `pb_migrations/`; revisar y conservar los archivos relevantes en control de versiones.

Evitar modificar manualmente las migraciones históricas ya aplicadas. Para nuevos cambios de esquema, crear una migración con un nombre de fecha posterior.

## 5. Almacenamiento y mantenimiento

- **`server/pb_data/`**: base de datos y archivos administrados por PocketBase.
- **`server/pb_migrations/`**: definición versionada del esquema y reglas; sí se incluye en Git.
- **`server/pb_backups/`**: copias de respaldo cuando se generan en la instalación local.
- **`server/pocketbase.exe`**: ejecutable descargado para el equipo.

Para respaldar la instalación local, detener PocketBase y copiar `server/pb_data/` a una ubicación segura. Para trasladar los datos a otra computadora, restaurar esa carpeta con el proceso detenido y conservar una versión compatible del ejecutable.

La carpeta `.gitignore` excluye `pb_data/`, `pb_backups/`, ejecutables y archivos `.env`. No incluir en el repositorio contraseñas, tokens de sesión ni copias de datos de clientes.

## 6. Conexión con la aplicación web

El SDK se instancia en `client/js/app.js`:

```javascript
const API_URL = 'http://127.0.0.1:8090';
// ...
pb = new PocketBase(API_URL);
```

El cliente se sirve por HTTP desde el puerto `5500`. Iniciar ambos procesos en terminales separadas y abrir `http://127.0.0.1:5500/`.

## 7. Diagnóstico de conectividad

- **Panel accesible:** `http://127.0.0.1:8090/_/`.
- **Health check:** `GET http://127.0.0.1:8090/api/health`.
- **Autenticación:** `POST /api/collections/users/auth-with-password` con `identity` y `password`.
- **Colecciones:** `GET /api/collections/clientes/records?sort=-created`; debe funcionar incluso sin registros.
- **Frontend:** comprobar en DevTools → Network las solicitudes a `127.0.0.1:8090`.

Si una consulta falla, revisar el código HTTP y el cuerpo JSON de respuesta, verificar el campo `activo` y las reglas de acceso. Para las consultas con `sort=-created` deben estar aplicadas las tres migraciones, incluida la que añade `created` y `updated`.

## 8. Referencias técnicas

- PocketBase: <https://pocketbase.io/docs/>
- Migraciones JavaScript: <https://pocketbase.io/docs/js-migrations/>
- API Rules: <https://pocketbase.io/docs/api-rules-and-filters/>
- API Records: <https://pocketbase.io/docs/api-records/>
