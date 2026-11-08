# Cliente web

Aplicación de una sola página elaborada en **HTML, CSS y JavaScript puro**. Utiliza el SDK de PocketBase directamente desde `vendor/pocketbase.es.mjs`.

## Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura del documento, nodo `#app`, modal y contenedor de notificaciones. |
| `css/styles.css` | Estilos, navegación, componentes responsive y paleta visual. |
| `js/app.js` | Sesión, lectura de registros, navegación, formularios y cálculos. |
| `vendor/pocketbase.es.mjs` | SDK oficial de PocketBase (copia formateada para consulta). |
| `instalar-sdk.ps1` / `instalar-sdk.sh` | Obtención del SDK cuando el archivo no está disponible. |

## Puesta en marcha

1. Confirmar que PocketBase funciona en `http://127.0.0.1:8090`.
2. Desde `client/` ejecutar:

   ```powershell
   py -m http.server 5500 --bind 127.0.0.1
   ```

3. Abrir <http://127.0.0.1:5500/>.
4. Iniciar sesión con un empleado activo registrado en `users`.

La constante `API_URL` de `js/app.js` controla el destino de las llamadas al servidor.

## SDK

La carpeta `vendor/` contiene `pocketbase.es.mjs`. El cliente lo importa como módulo ES desde `app.js`. Si fuera necesario instalar de nuevo la distribución oficial v0.28.1, se puede ejecutar `instalar-sdk.ps1` (Windows) o `instalar-sdk.sh` (macOS/Linux). La descarga oficial puede venir minificada; la copia incluida conserva formato legible.

Las reglas de negocio y la presentación están en `js/app.js`, no en las funciones internas del SDK.

## Secciones

- Inicio de sesión y panel general.
- Clientes y vehículos con fichas e historial.
- Órdenes con diagnóstico, trabajos, repuestos y pagos.
- Inventario y reposición de unidades.
- Informes de facturación, cobros y saldos.

Para el esquema del servidor y la documentación de llamadas ver [API](../docs/api.md) y [arquitectura](../docs/arquitectura.md).
