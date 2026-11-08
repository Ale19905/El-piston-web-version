# SDK de PocketBase

`pocketbase.es.mjs` es la biblioteca JavaScript utilizada para las peticiones a PocketBase. Se carga como módulo desde `../js/app.js`. La versión incorporada al proyecto corresponde al SDK v0.28.1 y está formateada para consulta del código.

No es necesario modificar el SDK al cambiar formularios, permisos o cálculos de El Pistón; esos cambios pertenecen a `client/js/app.js` o a las migraciones del servidor.

Si el archivo no está disponible, desde `client/` ejecutar:

- Windows: `./instalar-sdk.ps1` (PowerShell).
- macOS/Linux: `sh instalar-sdk.sh`.

La descarga oficial puede estar minificada y reemplazará el formato legible existente.
