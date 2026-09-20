# Auditoría de DEPTH 0.5 · Mundos que recuerdan

Base revisada: `b4cc2400bec93faaa542878853e6a100cd0e3085` (0.4).
La base tenía cien cámaras, diez reglas y expediciones. Faltaban un catálogo común,
selección de mundos, capacidades de personaje, obstáculos móviles/temporales,
historial por intento y un contrato de generación reutilizable por HTTP.

## Cambios y evidencia

| Hallazgo | Implementación | Verificación |
|---|---|---|
| Organización centrada en capítulos sueltos | Cinco mundos, cien IDs de cámara y atlas común | Cobertura única de cien cámaras y relaciones con diez capítulos |
| Ambientación sin mecánicas propias por mundo | Seis tipos de obstáculos/ayudas, geometría y motivos por mundo | Fases, barrido de centinelas, derrumbe/recuperación, resorte y corriente |
| Personajes con la misma capacidad de movimiento | Ancla de Nox, Velo de Luma y energía | Recarga independiente, protección, reinicio y sello infranqueable |
| Pocos motivos narrativos para explorar | Veinte escenas escritas, fragmentos y archivo persistente | Las veinte están disponibles en Aprendiz; se guardan solo tras completar |
| Puntos sin explicación y sin registro de intentos | Libro de puntuación, resultados e historial de 200 intentos | Suma de fuentes, pago único, truncado, tipos y fusión de copias |
| Cambiar el generador rompería códigos anteriores | v4 preservada; v5 explícita y migración de checkpoint | Fuentes contrastadas con la base y dos fixtures SHA-256 de geometría v4 |
| Sin API local | Generar, lotes, validar y consultar catálogo | Igualdad HTTP/JS/juego, errores de contrato, límites y ejemplo ejecutable |
| Servidor destinado solo a archivos | API con loopback, origen exacto, 64 KiB y lotes de 20 | Origen/Host, traversal, métodos, JSON, tamaño fijo y chunked |

## Resultado local

`npm run validate`: **PASS**.

- **58 pruebas**: regresiones de motor y entradas, reglas, mundo, progreso, API HTTP y compatibilidad.
- **71 comprobaciones de sintaxis**, además de lectura de JSON y contrato OpenAPI.
- **146 recorridos completos mediante controles**: 100 de Historia, 36 de expedición
  mixta en Maestro y 10 de mundos seleccionados, con reliquias en esos diez.
- Generación estructural y determinista en 100 cámaras por versión y 250 combinaciones
  de mundo, intensidad y profundidad, incluyendo la cámara 100000.
- Comprobación estática adicional de IDs HTML únicos y referencias literales de la interfaz.
- Informes reproducibles: `build/validation/report.md`, `report.json`, `levels.md`, `levels.json`.

Las pruebas y ejemplos se ejecutaron con Node en el entorno de desarrollo disponible.
El ejemplo PowerShell está documentado; no se ejecutó una sesión de PowerShell nativa.
Navegador real, audio, tacto y revisión visual: **no ejecutados** en este entorno.
Se amplió `tests/browser-smoke.mjs` y el checklist para hacer esas pruebas localmente.
No se lanzaron GitHub Actions ni se desplegó un servicio público.

## Límites del resultado

Las cámaras reutilizan diez familias; no son cien escenas ilustradas individualmente.
Los veinte nuevos textos sí están escritos y conectados a objetos recogibles. PRISMA
actúa a través del relato y defensas; no se añadió un combate de jefe separado.
Las versiones antiguas conservan geometría y valores; los nuevos obstáculos y
capacidades pertenecen a v5. Los logros históricos se mantienen, no se recalculan.

La API comprueba estructura en cada generación; no ejecuta un piloto por petición.
`reachability: "not-run"` evita confundir esa comprobación con una solución física.
Los recorridos automatizados conocen las respuestas y no miden descubrimiento,
pacing humano ni interés durante años. El siguiente criterio de aceptación debe
ser el playtest de los cinco mundos, lectura de avisos y ergonomía de F/Q en móvil.
