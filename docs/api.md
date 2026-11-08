# API HTTP y uso del SDK de PocketBase

## Base de la API

```text
http://127.0.0.1:8090/api
```

El proyecto utiliza la **API REST generada por PocketBase** sobre ocho colecciones. No hay endpoints de negocio propios ni un servidor Express. Las peticiones normales del frontend se realizan mediante `client/vendor/pocketbase.es.mjs`.

## Autenticación

**Endpoint:** `POST /api/collections/users/auth-with-password`

**Solicitud JSON:**

```json
{
  "identity": "dueno@elpiston.local",
  "password": "CONTRASENA_DEL_USUARIO"
}
```

**Respuesta exitosa (estructura abreviada):**

```json
{
  "token": "TOKEN_JWT",
  "record": {
    "id": "ID_USUARIO",
    "email": "dueno@elpiston.local",
    "nombre": "Responsable del taller",
    "rol": "dueno",
    "activo": true
  }
}
```

Para llamar endpoints protegidos, adjuntar el token tal como lo espera PocketBase:

```http
Authorization: TOKEN_JWT
Content-Type: application/json
```

El SDK gestiona la cabecera de autorización a partir de `pb.authStore`. En el frontend se usa:

```javascript
await pb.collection('users').authWithPassword(email, password);
const empleado = pb.authStore.record;
// cerrar sesión:
pb.authStore.clear();
```

Para renovar una sesión existente se invoca `pb.collection('users').authRefresh()`.

## Endpoints de registros

`{coleccion}` se sustituye por `clientes`, `vehiculos`, `ordenes`, `trabajos`, `repuestos`, `orden_repuestos`, `pagos` o `users`.

| Método | Ruta | Operación SDK | Uso |
|---|---|---|---|
| `GET` | `/api/collections/{coleccion}/records` | `getList()` / `getFullList()` | Listar registros con filtros, paginación y orden. |
| `GET` | `/api/collections/{coleccion}/records/{id}` | `getOne()` | Consultar registro individual. |
| `POST` | `/api/collections/{coleccion}/records` | `create(payload)` | Crear un registro. |
| `PATCH` | `/api/collections/{coleccion}/records/{id}` | `update(id, payload)` | Actualizar un registro. |
| `DELETE` | `/api/collections/{coleccion}/records/{id}` | `delete(id)` | Endpoint nativo; las reglas del proyecto reservan el borrado al superusuario. |

**Nota de autorización:** la disponibilidad efectiva depende de las API Rules. Por ejemplo, `pagos` admite creación por dueño/recepción, pero el cambio o eliminación de pagos está reservado al superusuario. Los empleados no pueden crear registros en `users`.

### Consulta con paginación y orden

```http
GET /api/collections/clientes/records?page=1&perPage=20&sort=-created
Authorization: TOKEN_JWT
```

**Respuesta típica de lista vacía:**

```json
{
  "page": 1,
  "perPage": 20,
  "totalItems": 0,
  "totalPages": 0,
  "items": []
}
```

El cliente actual llama `getFullList({ sort: '-created' })` para cargar los registros disponibles y realizar los cálculos del dashboard y reportes.

### Filtros y relaciones

**HTTP (ejemplo):**

```http
GET /api/collections/ordenes/records?filter=(estado="reparacion")&sort=-created
```

**SDK (preferido; escapa los valores del filtro):**

```javascript
const ordenes = await pb.collection('ordenes').getFullList({
  filter: pb.filter('mecanico = {:id}', { id: mecanicoId }),
  sort: '-created'
});

const pagos = await pb.collection('pagos').getFullList({
  filter: pb.filter('orden = {:id}', { id: ordenId })
});
```

También se puede solicitar expansión de relaciones en consultas individuales cuando resulta útil:

```javascript
const orden = await pb.collection('ordenes').getOne(ordenId, {
  expand: 'vehiculo,mecanico'
});
```

En la implementación actual, el frontend carga las colecciones y resuelve la mayoría de relaciones por ID en memoria.

## Contrato por colección

Los ejemplos muestran cuerpos JSON orientativos para creación. Las restricciones exactas de cada campo y los permisos están en [modelo-datos.md](modelo-datos.md) y [permisos.md](permisos.md). Sustituir los identificadores de ejemplo por IDs reales.

### `clientes`

```http
POST /api/collections/clientes/records
```

```json
{ "nombre": "Laura Gómez", "telefono": "099123456", "direccion": "Calle Central 120" }
```

**Acciones:** listar/ver (empleado activo), crear/editar (dueño/recepción).

### `vehiculos`

```http
POST /api/collections/vehiculos/records
```

```json
{
  "cliente": "ID_CLIENTE",
  "matricula": "ABC1234",
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio": 2018,
  "kilometraje_ultimo": 86500
}
```

`matricula` tiene índice único. La relación `cliente` es obligatoria.

### `ordenes`

```http
POST /api/collections/ordenes/records
```

```json
{
  "vehiculo": "ID_VEHICULO",
  "mecanico": "ID_USUARIO_MECANICO",
  "fecha_ingreso": "2026-11-08T14:00:00.000Z",
  "kilometraje_ingreso": 86500,
  "problema": "Ruido al frenar",
  "estado": "recibida"
}
```

El servidor exige `vehiculo`, `mecanico`, `fecha_ingreso`, `problema` y `estado`. Los valores de estado son `recibida`, `diagnostico`, `reparacion`, `lista`, `entregada`, `cancelada`.

Actualizar diagnóstico:

```javascript
await pb.collection('ordenes').update(ordenId, {
  diagnostico: 'Desgaste de pastillas',
  observaciones: 'Se recomienda revisión adicional'
});
```

Registrar entrega desde el SDK (requiere rol autorizado por las API Rules):

```javascript
await pb.collection('ordenes').update(ordenId, {
  estado: 'entregada',
  fecha_entrega: new Date().toISOString()
});
```

La validación de pasos y el control de abonos de la pantalla de órdenes se implementan en el cliente web; las API Rules controlan qué rol puede modificar el registro.

### `trabajos`

```json
{ "orden": "ID_ORDEN", "descripcion": "Cambio de pastillas", "precio_centavos": 4500 }
```

```javascript
await pb.collection('trabajos').create({
  orden: ordenId,
  descripcion: 'Cambio de pastillas',
  precio_centavos: 4500
});
```

### `repuestos`

```json
{
  "codigo": "FILTRO-01",
  "nombre": "Filtro de aceite",
  "precio_venta_centavos": 1500,
  "unidades_recibidas": 10,
  "stock_minimo": 3,
  "activo": true
}
```

Para registrar una reposición se incrementa el acumulado, sin sustituir el precio histórico de los consumos anteriores:

```javascript
await pb.collection('repuestos').update(repuestoId, {
  'unidades_recibidas+': 5
});
```

El inventario se calcula a partir de `unidades_recibidas` y de las líneas en `orden_repuestos`.

### `orden_repuestos`

```json
{
  "orden": "ID_ORDEN",
  "repuesto": "ID_REPUESTO",
  "cantidad": 2,
  "precio_unitario_centavos": 1500
}
```

```javascript
await pb.collection('orden_repuestos').create({
  orden: ordenId,
  repuesto: repuestoId,
  cantidad: 2,
  precio_unitario_centavos: 1500
});
```

El precio guardado en esta colección se toma del artículo al momento del consumo y permite calcular correctamente el valor histórico de la orden.

### `pagos`

```json
{
  "orden": "ID_ORDEN",
  "monto_centavos": 3000,
  "fecha_pago": "2026-11-08T16:00:00.000Z",
  "medio_pago": "efectivo",
  "observaciones": "Primer abono"
}
```

**Acciones:** listar, ver y crear solamente como dueño/recepción. `monto_centavos` se interpreta como entero; `3000` equivale a $30,00.

### `users`

Es una colección `Auth`. Se utiliza para la autenticación y lectura de empleados. La creación, edición y eliminación de empleados se realiza desde el panel de PocketBase usando una sesión de superusuario.

## Respuestas HTTP y manejo de errores

| Respuesta | Interpretación habitual |
|---|---|
| `200` | Consulta, creación o actualización completada. |
| `204` | Eliminación completada. |
| `400` | Datos inválidos, filtro incorrecto o regla de creación no satisfecha. |
| `403` | Recurso con regla bloqueada para el usuario ordinario. |
| `404` | Registro no visible o regla de vista/edición no satisfecha. |

En consultas de **lista**, una regla de acceso no satisfecha puede resultar en una lista vacía con código `200`, debido al filtrado incorporado de PocketBase.

Para inspeccionar errores con el SDK:

```javascript
try {
  await pb.collection('clientes').getFullList();
} catch (error) {
  console.error('Código:', error.status);
  console.error('Detalle:', error.response);
}
```

## Pruebas directas con PowerShell

**1. Autenticación** (solicita credenciales sin guardarlas en un archivo):

```powershell
$cred = Get-Credential
$body = @{
  identity = $cred.UserName
  password = $cred.GetNetworkCredential().Password
} | ConvertTo-Json
$auth = Invoke-RestMethod `
  -Method POST `
  -Uri 'http://127.0.0.1:8090/api/collections/users/auth-with-password' `
  -ContentType 'application/json' `
  -Body $body
```

**2. Lista de clientes:**

```powershell
$headers = @{ Authorization = $auth.token }
Invoke-RestMethod `
  -Uri 'http://127.0.0.1:8090/api/collections/clientes/records?page=1&perPage=10&sort=-created' `
  -Headers $headers
```

**3. Comprobación de salud:**

```powershell
Invoke-RestMethod 'http://127.0.0.1:8090/api/health'
```

No incluir tokens o contraseñas reales en capturas ni en los archivos del repositorio.

## Referencias

- [Documentación PocketBase de registros](https://pocketbase.io/docs/api-records/)
- [Reglas y filtros](https://pocketbase.io/docs/api-rules-and-filters/)
- [Colecciones](https://pocketbase.io/docs/collections/)
