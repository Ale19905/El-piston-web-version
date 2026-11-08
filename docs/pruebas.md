# Plan de verificación funcional

## Preparación

1. Ejecutar PocketBase y el frontend en los puertos establecidos.
2. Crear cuentas con los roles `dueno`, `recepcionista` y `mecanico` (al menos uno de cada tipo), todas activas.
3. Iniciar sesión con el dueño.
4. Registrar al menos un cliente, su vehículo y un repuesto de prueba.

## Casos funcionales

| ID | Escenario | Resultado a comprobar |
|---|---|---|
| F-01 | Inicio de sesión de usuario activo | Se accede al panel y se muestra nombre y rol. |
| F-02 | Registro de cliente | Aparece en listado y se abre su ficha. |
| F-03 | Vehículo vinculado a cliente | Se muestra desde la ficha del propietario. |
| F-04 | Matrícula repetida | Se rechaza debido al índice único. |
| F-05 | Alta de orden | Requiere vehículo y mecánico, guarda estado `recibida`. |
| F-06 | Edición del diagnóstico | El texto queda asociado a la orden. |
| F-07 | Cambio de estados | La interfaz propone los estados operativos en secuencia. |
| F-08 | Añadir trabajo | El importe de mano de obra aparece en el total. |
| F-09 | Consumir repuesto | Se registra línea de consumo y disminuye el stock calculado. |
| F-10 | Reponer repuesto | Se incrementa `unidades_recibidas` y aumenta el stock disponible. |
| F-11 | Alerta de existencias | Un repuesto activo con stock igual o menor al mínimo aparece resaltado. |
| F-12 | Registrar pagos parciales | Se acumula el pagado y disminuye el saldo. |
| F-13 | Historial de vehículo y cliente | Se muestran las órdenes asociadas. |
| F-14 | Carga por mecánico | El dashboard refleja órdenes abiertas por mecánico. |
| F-15 | Informe de facturación | El período considera órdenes entregadas por fecha de entrega. |
| F-16 | Informe de cobros | El período utiliza `fecha_pago`, separado de la facturación. |
| F-17 | Reporte de deuda | Lista clientes con saldo positivo en órdenes entregadas. |

## Casos de autorización

| ID | Escenario | Resultado a comprobar |
|---|---|---|
| A-01 | Crear un cliente como mecánico | La API no permite la creación. |
| A-02 | Consultar pagos como mecánico | La API no entrega registros de pagos al rol. |
| A-03 | Modificar la asignación de una orden como mecánico | La API rechaza el cambio. |
| A-04 | Marcar una orden como `entregada` desde un token de mecánico | La API rechaza ese cambio de estado. |
| A-05 | Iniciar sesión con `activo = false` | La autenticación no devuelve sesión válida. |
| A-06 | Crear un empleado con token ordinario | La API rechaza la operación. |

## Casos directos de API

| ID | Solicitud | Resultado a comprobar |
|---|---|---|
| API-01 | `GET /api/health` | PocketBase responde con su estado. |
| API-02 | `POST /api/collections/users/auth-with-password` | Devuelve `record` y `token` con credenciales correctas. |
| API-03 | `GET /api/collections/clientes/records?sort=-created` | Devuelve una lista, también cuando está vacía. |
| API-04 | Crear vehículo con `matricula` duplicada | Devuelve validación de unicidad. |
| API-05 | Crear orden sin `mecanico` | Devuelve validación de campo requerido. |

## Datos sencillos para comprobar importes

1. Repuesto: filtro, precio $15,00, 10 unidades recibidas, mínimo 3.
2. Orden: un trabajo por $40,00.
3. Consumir dos filtros en la orden: subtotal repuestos $30,00; stock restante 8.
4. Total de la orden: $70,00.
5. Primer pago: $50,00; saldo pendiente: $20,00.
6. Segundo pago: $20,00; saldo pendiente: $0,00.

Los valores anteriores se expresan al usuario con dos decimales; en PocketBase son enteros en centavos (`4000`, `1500`, `5000` y `2000`).

## Verificación de interfaz

Comprobar en escritorio y en el modo dispositivo del navegador: acceso, navegación, tablas, formularios, botones, indicadores y modales. La carpeta `capturas/` del repositorio puede utilizarse para conservar imágenes de las pantallas operativas.
