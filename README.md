# DEPTH / ECOS DE TI

**Si un día no me reconoces, busca lo que todavía sentimos.**

Nox entra en DEPTH para encontrar a Luma, su esposa, cuyos recuerdos fueron alterados
por PRISMA. Ella todavía deja señales. Para llegar hasta ella debes entenderlas,
coordinar movimientos y aprender a distinguir los recuerdos de las órdenes.

**Versión 0.4.0:** 100 cámaras jugables, diez familias de acertijos, progresión guardada,
300 estrellas y expediciones reproducibles por código. JavaScript nativo, Canvas 2D,
Web Audio y simulación a 120 Hz. Sin servicios de pago ni dependencias de producción.

## Jugar

Con Node.js 20 o posterior, abre una terminal en el repositorio:

```powershell
npm start
```

Abre **http://127.0.0.1:8000**. Elige **HISTORIA** para empezar o continuar; usa
**EXPEDICIÓN** para configurar una ruta. El juego y la validación básica no necesitan
`npm install`, cuentas ni claves. Los prototipos originales siguen en `game/`.

## Una campaña más larga, con dificultad por etapas

| Cámaras | Capítulo | Regla jugable |
|---|---|---|
| 001–010 | La huella | Reconstruir secuencias de aterrizajes |
| 011–020 | La casa imposible | Descifrar el orden que muestra un espejo |
| 021–030 | Nuestra órbita | Aterrizar moviéndote en la dirección indicada |
| 031–040 | El jardín de las voces | Elegir las huellas auténticas entre anillos falsos |
| 041–050 | El peso del miedo | Sostener cada plataforma durante su carga |
| 051–060 | El archivo roto | Ordenar fragmentos por su hora, no por su número |
| 061–070 | Dos lados del cristal | Alternar Nox/Luma; cada uno conserva su posición |
| 071–080 | La falsa libertad | Apagar una red: cada interruptor cambia su luz y la siguiente |
| 081–090 | La canción enterrada | Aterrizar durante las ventanas de silencio visibles |
| 091–100 | El derecho a despertar | Combinar personajes, dirección, quietud y ritmo; salir con Luma |

Las cámaras se construyen con reglas, geometría y semillas deterministas. No son
100 escenarios dibujados individualmente ni la implementación literal de todas las
escenas del [guion](docs/story-bible.md). Sus nombres y contexto vienen del
[diseño narrativo](docs/100-level-outline.md).

La precisión aumenta: plataformas de 180 a 94 unidades, hasta cinco huellas,
secuencias de hasta ocho pasos, alturas variables y obstáculos entre plataformas.
Cada capítulo introduce una regla antes de exigir sus variantes más largas.
Los bloques de tres pasos se conservan en secuencias avanzadas. El modo Historia
no impone un tiempo máximo para terminar.

## Motivos para volver

- **300 estrellas acumulables:** completar, resolver sin errores ni daño en estándar,
  y recoger la reliquia opcional. No necesitas todas para avanzar.
- **Mapa de 100 cámaras:** se desbloquean en orden; puedes repetir cualquiera ya abierta.
- **Marcas y tiempos objetivo:** mejora tu recorrido después de entender el acertijo.
- **Expediciones:** códigos propios, código del día o de la semana (UTC), cinco intensidades
  y recorridos de 12, 36 o hasta 100 000 cámaras en Abismo.
- **Mezcla de reglas:** cada bloque de diez cámaras de expedición contiene las diez
  familias y termina con una prueba combinada. Su orden intermedio cambia por código.
- **Experto y Maestro:** añaden un plazo entre recuerdos; perderlo conserva el último
  bloque completo. Las pausas y el diario detienen ese plazo.
- **Memoria acotada:** solo se carga la cámara actual, también en recorridos largos.

Para compartir una expedición, comparte **código + intensidad + longitud + versión
0.4**. Esa combinación reproduce la misma ruta. La dificultad alcanza un límite:
no reduce indefinidamente las plataformas ni los intervalos de reacción.

Esto ofrece una base de rejugabilidad; no demuestra que alguien jugará cinco años.
La variedad generada reutiliza diez familias. Mantener el interés durante años
exige playtests y nuevas reglas, rutas y herramientas de creación. Véase el
[plan de longevidad](docs/LONGEVITY.md).

## Guardado y controles

Historia guarda la cámara desbloqueada, estrellas y mejores tiempos. Expedición
conserva el código y la cámara desde la que continuar. El punto de guardado es el
inicio de una cámara: salir a mitad de ella reinicia ese intento. Usa **Exportar
progreso** para guardar una copia JSON e **Importar copia** para combinarla conservando
los mejores logros. Borrar los datos del navegador borra su copia local.

| Acción | Teclado / ratón | Táctil |
|---|---|---|
| Mover | A/D o flechas | Flechas |
| Saltar, también en el aire | Espacio / W / arriba | Salto o tocar el mundo |
| Dash | Shift | Dash |
| Leer pistas y ayuda | E | ECOS |
| Alternar Nox/Luma, cuando esté disponible | Q | CAMBIAR |
| Disparar en arcade | J o mantener ratón para apuntar | Fuego |
| Caída rápida | S / abajo | — |
| Pausar | P / Escape | Pausa |
| Reiniciar la cámara | R durante la partida | Reiniciar en pausa |

Historia y Expedición usan movimiento manual. Leer ECOS pausa la simulación.
Los números, formas y textos acompañan a sonidos y colores. Hay práctica y movimiento
reducido. El juego todavía no ofrece navegación completamente no visual.

## Modos arcade conservados

Flow tiene 10 sectores, Sprint 3, Daily 6 y el modo 100 recorre cien sectores.
Su generador conserva los cuatro patrones originales. Tienen curvas, dash, disparos,
enemigos, escudos, gravedad ligera, combos y checkpoints. Son distintos de las nuevas
cámaras narrativas y de las expediciones de acertijos.

## Validar en tu equipo

```powershell
npm run validate
```

Genera `build/validation/report.md` y `report.json`, más el informe por cámara
`levels.md` y `levels.json`. Devuelve un código de error si una comprobación falla.
No ejecuta GitHub Actions, navegador ni servicios remotos.

- **36 pruebas pasan**, incluyendo regresiones del arcade y del primer nivel.
- **56 comprobaciones de sintaxis** pasan y los JSON se leen correctamente.
- Un piloto con controles completa **las 100 cámaras** y una expedición de **36**
  en intensidad Maestro. También se comprueban guardado, copias y reglas individuales.
- El piloto conoce las soluciones: mide viabilidad, no dificultad o diversión humana.

Comandos separados: `npm test`, `npm run check`, `npm run audit:levels`.
La validación visual, sonora y táctil en navegador real sigue pendiente. El
[playtest](docs/PLAYTEST.md) incluye una prueba opcional de Chromium.

## Repositorio

- `src/story/Campaign.js`: reglas, curva de dificultad, pistas y expediciones.
- `src/story/SequencePuzzle.js`, `SwitchPuzzle.js`: controladores independientes.
- `src/world/StoryLevel.js`: geometría y reliquias de la cámara actual.
- `src/core/Progress.js`: avance, estrellas, migración y copias locales.
- `src/core`, `physics`, `render`, `audio`: motor y presentación.
- `tests/`, `tools/`: regresiones, piloto y validación local.
- `game/`, `archive/`: prototipos y variantes anteriores.
- `docs/`: [auditoría 0.4](docs/AUDIT-0.4.md), [arquitectura](docs/ARCHITECTURE.md),
  guion, niveles y siguientes pasos. [Cambios](CHANGELOG.md).

Sin analítica, clasificación online, cuentas, llamadas de IA, despliegue automático
ni workflows de Actions. Las marcas son locales y editables por su propietario.
Esta actualización conserva la situación de licencia del repositorio.
