# Descarga una única vez el SDK oficial. Luego el proyecto funciona sin CDN.
$ErrorActionPreference = "Stop"
$destino = Join-Path $PSScriptRoot "vendor\pocketbase.es.mjs"
$origen = "https://raw.githubusercontent.com/pocketbase/js-sdk/v0.28.1/dist/pocketbase.es.mjs"
New-Item -ItemType Directory -Force -Path (Split-Path $destino) | Out-Null
Invoke-WebRequest -Uri $origen -OutFile $destino
Write-Host "SDK de PocketBase v0.28.1 guardado en $destino"
