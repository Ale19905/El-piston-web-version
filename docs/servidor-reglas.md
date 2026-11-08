# El Pistón — reglas de acceso en PocketBase

Las API Rules se definen automáticamente en la migración `server/pb_migrations/20261107000000_crear_modelo.js`. Aquí se explica su intención.

**Roles:** `dueno`, `recepcionista`, `mecanico`. Se considera `personal` a dueño o recepcionista.

**Autenticación requerida:** `@request.auth.id != "" && @request.auth.activo = true`.

## Tabla de reglas

| Colección | List/View | Create | Update | Delete |
|---|---|---|---|---|
| `users` | Empleados activos autenticados | Superusuario | Superusuario | Superusuario |
| `clientes` | Empleados activos | Personal | Personal | Superusuario |
| `vehiculos` | Empleados activos | Personal | Personal | Superusuario |
| `ordenes` | Empleados activos | Personal | Personal; mecánico asignado con campos protegidos | Superusuario |
| `trabajos` | Empleados activos | Personal o mecánico | Personal | Superusuario |
| `repuestos` | Empleados activos | Personal | Personal | Superusuario |
| `orden_repuestos` | Empleados activos | Personal o mecánico | Personal | Superusuario |
| `pagos` | Personal | Personal | Superusuario | Superusuario |

**Locked/superusuario** significa regla `null`, no una cadena vacía. **Regla vacía** significaría público: no usarla en los datos del taller.

### Ejemplos textuales

Leer como usuario activo:

```text
@request.auth.id != "" && @request.auth.activo = true
```

Crear o editar como dueño o recepcionista:

```text
@request.auth.id != "" && @request.auth.activo = true &&
(@request.auth.rol = "dueno" || @request.auth.rol = "recepcionista")
```

Actualizar una orden propia (los mecánicos no pueden modificar matrícula/vehículo, asignación, fechas de entrada o entrega, kilometraje ni problema):

```text
(@request.auth.id != "" && @request.auth.activo = true &&
 (@request.auth.rol = "dueno" || @request.auth.rol = "recepcionista"))
||
(@request.auth.id != "" && @request.auth.activo = true &&
 @request.auth.rol = "mecanico" && mecanico = @request.auth.id &&
 @request.body.vehiculo:changed = false &&
 @request.body.mecanico:changed = false &&
 @request.body.fecha_ingreso:changed = false &&
 @request.body.kilometraje_ingreso:changed = false &&
 @request.body.problema:changed = false &&
 @request.body.fecha_entrega:changed = false)
```

## Limitaciones explícitas de las reglas

1. El mecánico puede crear nuevas líneas de trabajo y consumo referenciando cualquier orden si llama directamente a la API. La interfaz filtrará las órdenes asignadas, pero esta restricción **no es una garantía del servidor**. Para obtenerla habrá que validar una regla cruzada con pruebas o ampliar el servidor.
2. Los mecánicos pueden solicitar algunos cambios de estado improcedentes en sus órdenes; la transición secuencial es validación del frontend.
3. El personal puede modificar `unidades_recibidas` y el importe de los trabajos; no hay auditoría ni cierre contable.
4. El servidor no ejecuta una transacción que abarque más de una solicitud SDK.
5. Ninguna cuenta del frontend debe autenticarse como `_superusers`. Las reglas se omiten para los superusuarios.

Este diseño es adecuado como ejercicio local y debe presentarse con estas salvedades, no como un modelo de producción seguro.

## Pruebas manuales mínimas

- Sin iniciar sesión, listar clientes debe devolver lista vacía y los detalles no deben ser accesibles.
- Un mecánico no puede crear clientes, vehículos, repuestos ni pagos.
- Un mecánico no puede editar una orden asignada a otra persona.
- Un mecánico no puede reasignarse una orden cambiando `mecanico`.
- Un mecánico puede agregar un trabajo y un consumo en el frontend en una orden que tiene asignada.
- El dueño y recepción pueden crear órdenes y registrar pagos.
- Un usuario `activo = false` no puede autenticarse ni utilizar la API con su token antiguo.
- Un consumo reduce el *stock calculado* y el total pendiente cambia tras agregar un pago.
