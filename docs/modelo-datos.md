# Modelo de datos y diccionario de colecciones

## Convenciones

- `id` identifica cada registro. PocketBase lo asigna automáticamente.
- `created` y `updated` son campos de fecha automáticos presentes en las ocho colecciones. Para las siete colecciones Base se agregan mediante `20261108000000_agregar_fechas.js`.
- Las relaciones tienen un solo destino (`maxSelect: 1`), salvo que se especifique lo contrario.
- Los campos `*_centavos` almacenan enteros en unidades monetarias mínimas: **$45,50 → 4550**.
- En la columna **Obligatorio**, «No» significa que el esquema no marca `required: true`; el formulario puede requerir el dato para determinadas operaciones.

## 1. `users` (Auth)

Personal del taller; proviene de la colección de autenticación de PocketBase y recibe tres campos personalizados.

| Campo | Tipo | Obligatorio | Función |
|---|---|---|---|
| `nombre` | Text | Sí | Nombre del empleado; máximo 100 caracteres. |
| `rol` | Select | Sí | `dueno`, `recepcionista`, `mecanico`; un valor. |
| `activo` | Bool | No | Control de habilitación de la cuenta. |
| `email` | Email (sistema) | Sí | Identificador para el login. |
| `password` | Password (sistema) | Según Auth | Credencial gestionada por PocketBase. |
| `verified` | Bool (sistema) | No | Verificación de correo; diferente de `activo`. |

El `authRule` exige `activo = true`. El alta y administración de usuarios se realizan desde el panel de PocketBase.

## 2. `clientes` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `nombre` | Text | Sí | Máximo 120 caracteres. |
| `telefono` | Text | Sí | Máximo 40 caracteres. |
| `direccion` | Text | No | Máximo 250 caracteres. |

**Relación:** `clientes (1) → (N) vehiculos`.

## 3. `vehiculos` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `cliente` | Relation → `clientes` | Sí | Propietario asociado. |
| `matricula` | Text | Sí | Máximo 25 caracteres; **índice único**. |
| `marca` | Text | Sí | Máximo 60 caracteres. |
| `modelo` | Text | Sí | Máximo 60 caracteres. |
| `anio` | Number (entero) | No | Mínimo 1900; obligatorio en el formulario web. |
| `kilometraje_ultimo` | Number (entero) | No | Mínimo 0. |

**Índice:** `idx_vehiculos_matricula`. **Relaciones:** cada vehículo pertenece a un cliente y puede tener muchas órdenes.

## 4. `ordenes` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `vehiculo` | Relation → `vehiculos` | Sí | Vehículo atendido. |
| `mecanico` | Relation → `users` | **Sí** | Mecánico asignado; requerido desde la tercera migración. |
| `fecha_ingreso` | Date | Sí | Fecha de recepción. |
| `kilometraje_ingreso` | Number (entero) | No | Mínimo 0; dato de la visita. |
| `problema` | Text | Sí | Máximo 2000 caracteres. |
| `diagnostico` | Text | No | Máximo 2000 caracteres. |
| `estado` | Select | Sí | `recibida`, `diagnostico`, `reparacion`, `lista`, `entregada`, `cancelada`. |
| `fecha_entrega` | Date | No | Se completa cuando la interfaz registra la entrega. |
| `observaciones` | Text | No | Máximo 2000 caracteres. |

Una orden relaciona un vehículo con un empleado asignado y sirve como entidad principal de trabajos, consumos y pagos.

**Estados almacenados y etiquetas visibles:**

| Valor | Interfaz |
|---|---|
| `recibida` | Recibida |
| `diagnostico` | En diagnóstico |
| `reparacion` | En reparación |
| `lista` | Lista para entregar |
| `entregada` | Entregada |
| `cancelada` | Cancelada |

## 5. `trabajos` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `orden` | Relation → `ordenes` | Sí | Orden relacionada. |
| `descripcion` | Text | Sí | Máximo 350 caracteres. |
| `precio_centavos` | Number (entero) | No | Mínimo 0; formulario web lo solicita. |

Cada registro representa un trabajo de mano de obra en una orden.

## 6. `repuestos` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `codigo` | Text | Sí | Máximo 60 caracteres; **índice único**. |
| `nombre` | Text | Sí | Máximo 120 caracteres. |
| `precio_venta_centavos` | Number (entero) | No | Mínimo 0. |
| `unidades_recibidas` | Number (entero) | No | Mínimo 0; inicial + reposiciones. |
| `stock_minimo` | Number (entero) | No | Mínimo 0; umbral del aviso. |
| `activo` | Bool | No | Visibilidad del repuesto como activo. |

**Índice:** `idx_repuestos_codigo`. El stock disponible no es un campo persistido; se calcula a partir de sus consumos.

## 7. `orden_repuestos` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `orden` | Relation → `ordenes` | Sí | Orden que utiliza el repuesto. |
| `repuesto` | Relation → `repuestos` | Sí | Artículo consumido. |
| `cantidad` | Number (entero) | No | Mínimo 1; requerida en el formulario. |
| `precio_unitario_centavos` | Number (entero) | No | Mínimo 0; copia del precio al consumir. |

Esta colección representa la relación N:M entre órdenes y repuestos mediante líneas de consumo.

## 8. `pagos` (Base)

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `orden` | Relation → `ordenes` | Sí | Orden abonada. |
| `monto_centavos` | Number (entero) | No | Mínimo 1; requerido en el formulario. |
| `fecha_pago` | Date | Sí | Fecha de registro del cobro. |
| `medio_pago` | Select | Sí | `efectivo`, `tarjeta`, `transferencia`. |
| `observaciones` | Text | No | Máximo 250 caracteres. |

El historial de pagos admite múltiples registros para la misma orden. Los pagos se crean desde la aplicación; las reglas del esquema reservan modificación y borrado al superusuario.

## Resumen de integridad

- **Relaciones:** siete enlaces N:1, incluyendo ambas relaciones de `orden_repuestos`.
- **Unicidad:** `vehiculos.matricula`, `repuestos.codigo`.
- **Relaciones sin borrado en cascada:** las creadas en la migración usan `cascadeDelete: false`.
- **Campos temporales:** `created` y `updated` en colecciones Base y Auth.
- **Migraciones:** tres archivos en orden numérico; ver [configuración del servidor](configuracion-servidor.md).

## Consultas derivadas

```text
stock_disponible(repuesto) = unidades_recibidas - Σ orden_repuestos.cantidad
subtotal_mano_obra(orden) = Σ trabajos.precio_centavos
subtotal_repuestos(orden) = Σ (orden_repuestos.cantidad × orden_repuestos.precio_unitario_centavos)
total_orden = subtotal_mano_obra + subtotal_repuestos
abonado(orden) = Σ pagos.monto_centavos
saldo_pendiente(orden) = total_orden - abonado
```

Estas cifras son calculadas en el cliente web a partir de las colecciones relacionadas.
