# Usuarios, roles y reglas de acceso

## Roles

- **`dueno`**: gestiona clientes, vehículos, órdenes, repuestos, trabajos y cobros; consulta informes.
- **`recepcionista`**: comparte los permisos operativos del dueño.
- **`mecanico`**: consulta información operativa; actualiza determinadas propiedades de sus órdenes asignadas y registra trabajos y consumos. La interfaz muestra sus órdenes asignadas.

Los roles son valores del campo `users.rol`. Para operar, el empleado debe estar autenticado y tener `users.activo = true`.

## Expresiones base

**Empleado activo autenticado:**

```text
@request.auth.id != "" && @request.auth.activo = true
```

**Dueño o recepcionista:**

```text
@request.auth.id != "" && @request.auth.activo = true &&
(@request.auth.rol = "dueno" || @request.auth.rol = "recepcionista")
```

Las reglas están definidas en `20261107000000_crear_modelo.js`, y la condición adicional de cambio de estado del mecánico se agrega en `20261108010000_exigir_mecanico.js`.

## Matriz efectiva del servidor

| Colección | Listar / ver | Crear | Editar | Eliminar |
|---|---|---|---|---|
| `users` | Empleado activo | Solo superusuario | Solo superusuario | Solo superusuario |
| `clientes` | Empleado activo | Dueño / recepción | Dueño / recepción | Solo superusuario |
| `vehiculos` | Empleado activo | Dueño / recepción | Dueño / recepción | Solo superusuario |
| `ordenes` | Empleado activo | Dueño / recepción | Dueño / recepción o mecánico asignado con campos restringidos | Solo superusuario |
| `trabajos` | Empleado activo | Dueño / recepción / mecánico | Dueño / recepción | Solo superusuario |
| `repuestos` | Empleado activo | Dueño / recepción | Dueño / recepción | Solo superusuario |
| `orden_repuestos` | Empleado activo | Dueño / recepción / mecánico | Dueño / recepción | Solo superusuario |
| `pagos` | Dueño / recepción | Dueño / recepción | Solo superusuario | Solo superusuario |

**Importante para interpretar la matriz:** `listRule` y `viewRule` de `ordenes`, `trabajos` y `orden_repuestos` permiten la lectura a cualquier empleado activo. La vista del mecánico aplica además un filtro en el navegador para presentar únicamente sus órdenes. Las reglas de creación de `trabajos` y `orden_repuestos` permiten a los tres roles crear registros, mientras que la selección de órdenes asignadas se realiza en la interfaz.

En PocketBase, una regla `null` está **bloqueada para usuarios ordinarios** (solo superusuario); no equivale a una regla vacía, que permitiría acceso público.

## Edición de órdenes por mecánicos

Un mecánico solo puede ejecutar `PATCH` sobre una orden cuyo `mecanico` coincide con `@request.auth.id`. La regla evita cambios en:

- `vehiculo`
- `mecanico`
- `fecha_ingreso`
- `kilometraje_ingreso`
- `problema`
- `fecha_entrega`

La migración de asignación incorpora además el control de `estado` para que el mecánico no lo cambie a `entregada` ni a `cancelada`. El dueño y recepción pueden modificar órdenes conforme a su regla de acceso.

La interfaz propone los estados en secuencia; esta secuencia no forma parte de una enumeración de transiciones de PocketBase.

## Autenticación y cuentas

- La colección de autenticación es `users`.
- La autenticación por contraseña se solicita a `POST /api/collections/users/auth-with-password`.
- El `authRule` es `activo = true`.
- Los campos `nombre`, `rol` y `activo` se agregan por migración.
- `verified` es un campo nativo y no reemplaza `activo`.
- Las cuentas se administran desde `http://127.0.0.1:8090/_/`.
- No utilizar tokens de `_superusers` desde el frontend; los superusuarios no están sujetos a las API Rules de las colecciones.

## Comprobación de acceso

1. Iniciar sesión como `dueno` y consultar `pagos`: debe poder listar.
2. Iniciar sesión como `mecanico` e intentar listar `pagos`: la consulta no devuelve registros accesibles mediante la regla de listado.
3. Intentar crear un `cliente` con un token de mecánico: debe rechazarse.
4. Intentar cambiar `ordenes.mecanico` desde una sesión de mecánico: debe rechazarse.
5. Cambiar `activo` de un empleado a `false` desde el panel y comprobar que no vuelve a autenticarse.

La referencia de cada endpoint se encuentra en [api.md](api.md).
