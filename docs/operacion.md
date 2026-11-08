# Procesos de negocio

## 1. Alta de cliente y vehículo

La recepcionista o el dueño registra el cliente con nombre, teléfono y dirección opcional. Al dar de alta un vehículo, selecciona un cliente existente e informa matrícula, marca, modelo, año y kilometraje.

- **Colecciones:** `clientes`, `vehiculos`.
- **Relación:** `vehiculos.cliente → clientes.id`.
- **Historial:** las órdenes referencian al vehículo, de modo que sus visitas se conservan por separado.

## 2. Apertura de una orden

1. Seleccionar el vehículo registrado.
2. Elegir un mecánico activo (`users.rol = mecanico`).
3. Informar fecha, kilometraje de entrada y problema reportado.
4. Crear la orden con `estado = recibida`.
5. Actualizar el kilometraje más reciente del vehículo.

Las escrituras de la orden y del kilometraje del vehículo se ejecutan mediante operaciones SDK independientes. El campo `ordenes.mecanico` es obligatorio en el esquema.

## 3. Progresión de estados

```text
recibida → diagnostico → reparacion → lista → entregada
     └────────────────→ cancelada (según acción de recepción/dueño)
```

| Estado | Significado |
|---|---|
| `recibida` | Vehículo registrado en recepción. |
| `diagnostico` | Revisión y diagnóstico en curso. |
| `reparacion` | Trabajos técnicos en curso. |
| `lista` | Servicio finalizado, pendiente de entrega. |
| `entregada` | Vehículo entregado; se registra `fecha_entrega`. |
| `cancelada` | Orden cancelada. |

La interfaz ofrece la transición al siguiente estado. La entrega y la cancelación se gestionan por dueño/recepción. La pantalla incluye una comprobación de abonos antes de confirmar entrega; los pagos se almacenan como registros independientes y el saldo se mantiene disponible para consulta después de la entrega.

La acción de cancelar se presenta en la interfaz cuando la orden está abierta y no tiene trabajos, consumos ni pagos asociados.

## 4. Trabajos y repuestos

**Trabajos:** cada intervención se agrega a `trabajos` con descripción y precio de mano de obra. Es posible añadir varias líneas a una orden.

**Consumos:** cada repuesto utilizado se registra en `orden_repuestos` con la cantidad y el precio unitario aplicable a la orden. Los importes quedan almacenados en centavos.

**Inventario:** al registrar un repuesto, se informa `unidades_recibidas`; las reposiciones aumentan ese acumulado mediante el modificador de suma del SDK (`'unidades_recibidas+'`).

```text
Existencias disponibles = unidades_recibidas
                         − suma(cantidad de orden_repuestos)
```

Cuando el artículo está activo y el stock disponible es menor o igual a `stock_minimo`, la interfaz lo identifica con un aviso ámbar. Antes de crear un consumo, el cliente consulta el repuesto y sus consumos registrados para calcular las unidades disponibles.

## 5. Importe de la orden y pagos

Los importes monetarios se guardan como enteros:

```text
Mano de obra = Σ trabajos.precio_centavos
Repuestos   = Σ (cantidad × precio_unitario_centavos)
Total       = Mano de obra + Repuestos
Pagado      = Σ pagos.monto_centavos
Saldo       = Total − Pagado
```

La aplicación admite varios abonos sobre una misma orden. Al registrar un pago se informa monto, fecha, medio (`efectivo`, `tarjeta` o `transferencia`) y observaciones opcionales. Antes de crear el registro, el cliente vuelve a consultar trabajos, consumos y pagos para calcular el saldo actualizado.

Los cobros solo son visibles para dueño y recepcionista en la interfaz; también están restringidos a esos roles por las API Rules de `pagos`.

## 6. Indicadores y reportes

- **Órdenes abiertas:** estados `recibida`, `diagnostico`, `reparacion`, `lista`.
- **Carga por mecánico:** cantidad de órdenes abiertas asignadas a cada empleado con rol `mecanico`.
- **Historial:** órdenes del vehículo; desde cliente, se agregan las de todos sus vehículos.
- **Stock bajo:** repuestos activos con `stock_disponible <= stock_minimo`.
- **Saldo pendiente por cliente:** suma de saldos positivos de órdenes `entregada` correspondientes a sus vehículos.
- **Facturado en período:** suma de totales de las órdenes `entregada` cuyo `fecha_entrega` cae dentro de las fechas seleccionadas.
- **Cobrado en período:** suma de pagos cuya `fecha_pago` cae dentro del mismo intervalo.

La pantalla de reportes presenta la facturación y los cobros como métricas distintas; son indicadores operativos del taller.

## 7. Flujo recomendado en la interfaz

```text
Clientes → Vehículos → Inventario → Órdenes
                                ├→ Diagnóstico
                                ├→ Trabajos
                                ├→ Repuestos utilizados
                                ├→ Pagos
                                └→ Entrega → Reportes
```

Para detalles del esquema ver [modelo-datos.md](modelo-datos.md) y para operaciones API ver [api.md](api.md).
