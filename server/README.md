# Servidor PocketBase

El directorio `server/` contiene la configuración versionada de la base de datos y las API Rules de El Pistón. El servidor es **PocketBase v0.41.1**, que integra SQLite, autenticación y API HTTP.

## Iniciar

Situarse dentro de `server/` y ejecutar:

```powershell
.\pocketbase.exe serve
```

En macOS/Linux, `./pocketbase serve`.

- Panel administrativo: <http://127.0.0.1:8090/_/>
- API: <http://127.0.0.1:8090/api/>
- Health check: <http://127.0.0.1:8090/api/health>

## Migraciones

1. `pb_migrations/20261107000000_crear_modelo.js`: colecciones, relaciones, índices y reglas.
2. `pb_migrations/20261108000000_agregar_fechas.js`: fechas de creación y actualización.
3. `pb_migrations/20261108010000_exigir_mecanico.js`: mecánico obligatorio y ajuste de permisos de estado.

Se aplican automáticamente las pendientes al arrancar. No alterar los archivos históricos en una instalación con datos.

## Empleados

Desde `/_/` → **Collections → users**, registrar usuarios con `nombre`, `email`, contraseña, `rol` (`dueno`, `recepcionista`, `mecanico`) y `activo = true`.

La cuenta del panel administrativo es un superusuario; para acceder al cliente web usar un empleado de `users`.

## Almacenamiento

`pb_data/` guarda la base de datos y se crea automáticamente. Debe conservarse entre reinicios y mantenerse fuera de Git. El `.gitignore` del repositorio lo excluye.

Documentación ampliada:
- [Configuración y migraciones](../docs/configuracion-servidor.md)
- [Colecciones](../docs/modelo-datos.md)
- [API](../docs/api.md)
- [Permisos](../docs/permisos.md)
