# API procedural de DEPTH · v1

Con Node.js 20 o posterior, ejecuta `npm start` en la raíz del repositorio. El mismo
proceso sirve el juego y la API en `http://127.0.0.1:8000`. `npm run api` es un alias.
No hace falta instalar dependencias, crear una cuenta ni obtener una clave.

El generador está en `src/generation/Generator.js`: puedes importarlo directamente
en JavaScript. HTTP es un adaptador del mismo generador que construye las cámaras
del juego. No utiliza IA externa. Esta entrega incluye un servidor **local**; no
publica una API remota. Un alojamiento de archivos estáticos puede servir el juego,
pero necesita ejecutar este servidor para usar los endpoints.

## Contrato

[OpenAPI 3.1](openapi.json), también disponible en `/docs/api/openapi.json` al iniciar
el servidor. Base de las siguientes rutas: `/api/v1`.

| Método y ruta | Resultado |
|---|---|
| `GET /health` | Estado y versiones del generador |
| `GET /catalog` | Mundos, capítulos, cien niveles, personajes, capacidades, obstáculos, recompensas y veinte escenas |
| `GET /worlds` | Los cinco mundos con sus identificadores y reglas |
| `GET /characters` | Nox, Luma y PRISMA |
| `GET /chapters` | Los diez capítulos y sus relaciones |
| `GET /abilities`, `/obstacles`, `/rewards`, `/memories` | Secciones del catálogo |
| `GET /levels/generate` | Una cámara; parámetros en la URL |
| `POST /levels/generate` | Una cámara; parámetros JSON |
| `POST /levels/batch` | De 1 a 20 cámaras consecutivas |
| `POST /levels/validate` | Comprobación estructural de `{ "world": ... }` |

| Parámetro | Valores | Predeterminado |
|---|---|---|
| `mode` | `story`, `expedition` | `expedition` |
| `seed` | 1–48 letras ASCII, números, `_` o `-`; se convierte a mayúsculas | `LUMA` |
| `level` | Historia: 1–100. Expedición: 1–100000 y dentro de `length` | 1 |
| `intensity` | Entero 1–5 | 1 |
| `length` | 12, 36 o 0; 0 es Abismo, máximo 100000 | 12 |
| `worldId` | `vestibule`, `gardens`, `archives`, `nexus`, `core`; omitir o `null` mezcla mundos | `null` |
| `generatorVersion` | 4 o 5 | 5 |
| `count` | Entero 1–20; solo para lotes | 1 |

Historia determina su propio mundo y normaliza semilla, intensidad y longitud.
Seleccionar un mundo explícito requiere `expedition` y versión 5. En GET omite
`worldId` para mezclar mundos; la cadena literal `null` no es un identificador.
Los campos desconocidos, parámetros GET repetidos, tipos incorrectos y límites
inválidos se rechazan. No se truncan silenciosamente los lotes fuera de recorrido.

## Ejemplo en PowerShell

En una terminal ejecuta `npm start`; en otra:

```powershell
$depthApi = 'http://127.0.0.1:8000/api/v1'
$depthRequest = @{
  mode = 'expedition'
  seed = 'LUMA-RECUERDA'
  level = 1
  intensity = 3
  length = 36
  worldId = 'archives'
  generatorVersion = 5
} | ConvertTo-Json

$depthLevel = Invoke-RestMethod -Method Post -Uri "$depthApi/levels/generate" `
  -ContentType 'application/json' -Body $depthRequest
$depthLevel.id
$depthLevel.validation
$depthLevel | ConvertTo-Json -Depth 30 | Set-Content -Encoding utf8 depth-ruta.json

# El validador recibe el objeto world del resultado.
$depthValidation = @{ world = $depthLevel.world } | ConvertTo-Json -Depth 30
Invoke-RestMethod -Method Post -Uri "$depthApi/levels/validate" `
  -ContentType 'application/json' -Body $depthValidation

# Tres cámaras consecutivas del mismo mundo y código.
$depthBatch = @{
  seed = 'LUMA-RECUERDA'; worldId = 'archives'; level = 1
  intensity = 3; length = 36; generatorVersion = 5; count = 3
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$depthApi/levels/batch" `
  -ContentType 'application/json' -Body $depthBatch
```

`PORT` permite cambiar el puerto: `$env:PORT = '8080'; npm start` en PowerShell.

## JavaScript y uso desde el juego

```javascript
import { generateLevel } from './src/generation/Generator.js';
const route = generateLevel({ seed: 'LUMA-RECUERDA', worldId: 'archives', intensity: 3 });
console.log(route.id, route.world.levelInfo.rules.name);
```

El [ejemplo HTTP ejecutable](../../examples/generate-level.mjs) imprime un resultado
completo: `node examples/generate-level.mjs`. La variable `DEPTH_API_URL` cambia su
base, si usas otro puerto.

Dentro del juego: **EXPEDICIÓN → Preparar y compartir una cámara → PREPARAR RUTA**.
El juego comprueba que el resultado del servidor coincide con el generado localmente.
Después permite jugar esa cámara o descargar su JSON. El botón de inicio normal
sigue funcionando con generación en el navegador, también en alojamiento estático.

## Respuestas, versiones y límites

Una respuesta de generación contiene:

```json
{
  "schemaVersion": 1,
  "generatorVersion": 5,
  "id": "exp-v5:LUMA-RECUERDA:3:36:1:archives",
  "parameters": {},
  "world": {},
  "validation": { "valid": true, "errors": [], "reachability": "not-run" }
}
```

`parameters` y `world` se muestran abreviados arriba. El resultado real incluye
los parámetros normalizados, geometría, reglas, pistas, personajes disponibles,
obstáculos, recompensas y estado inicial de la cámara. `world` cambia durante una
partida; para reproducirla vuelve a generar desde `parameters`.

Comparte **versión del generador + semilla + mundo elegido o mezcla + intensidad +
longitud + cámara**. La versión 4 conserva los generadores anteriores en
`src/generation/v4/`; no añade los nuevos obstáculos ni capacidades. Los guardados
antiguos de expedición se interpretan como v4. La versión 5 es la predeterminada.

Validar estructura comprueba tamaños, números finitos, referencias a huellas,
reglas, recompensas y sellos. `reachability: "not-run"` significa que **esa llamada
no ejecutó un recorrido físico**. La prueba de recorridos está en
`npm run audit:levels`. La API no es un editor ni un mecanismo para importar y
confiar en mundos arbitrarios: la interfaz juega parámetros reproducibles cuya
geometría coincide con el generador local.

Los errores usan `{ "error": { "status": 400, "message": "..." } }`:
400 solicitud inválida; 403 origen/Host no permitido; 404 ruta inexistente;
405 método no admitido; 413 cuerpo mayor de 64 KiB; 415 formato distinto de JSON;
500 error interno. Una estructura de mundo inválida devuelve 200 con `valid: false`.

El servidor escucha en loopback, admite el origen exacto de su página o scripts
locales sin Origin, limita cuerpos y lotes, no escribe datos y no permite rutas
hacia archivos fuera del proyecto. No tiene autenticación, cuotas por usuario,
base de datos ni infraestructura para exponerlo como servicio público.
