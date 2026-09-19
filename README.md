# DEPTH / ECOS DE TI

**Si un día no me reconoces, busca lo que todavía sentimos.**

Nox entra en DEPTH para encontrar a Luma, su esposa, cuyos recuerdos fueron
alterados por PRISMA. Ella todavía deja señales: un anillo incompleto, tres luces,
un orden que solo cobra sentido cuando alguien se detiene a escuchar.

Un juego de plataformas, momentum y acertijos hecho con JavaScript nativo,
Canvas 2D y Web Audio. La versión **0.3.0** incorpora el primer nivel narrativo
jugable, **La huella**, junto con los modos arcade existentes.

## Jugar en tu equipo

Con Node.js 20 o posterior, abre una terminal en el repositorio:

```powershell
npm start
```

Abre **http://127.0.0.1:8000**, elige **HISTORIA** y pulsa **SEGUIR SU HUELLA**.
El juego y sus pruebas básicas no requieren `npm install`, cuentas, claves ni servicios.
El servidor solo escucha en tu equipo. Los módulos necesitan HTTP; los prototipos
originales de `game/` conservan su apertura directa como archivos.

## La huella

- Un prólogo presenta a Nox, Luma y PRISMA.
- Acércate al anillo incompleto para descubrir la pista de Luma.
- Tres plataformas responden al aterrizar con números, símbolos y pulsos sonoros.
- Reconstruye su secuencia para abrir la puerta y recuperar el primer eco.
- Consulta **ECOS / E** para releer los mensajes; el mundo se pausa mientras lees.
- Una ayuda desplegable explica la solución si te atascas. Puedes equivocarte y reintentar.

Historia usa movimiento manual y frenado más preciso. El diario y el acertijo se
reinician al comenzar otra partida; las mejores marcas se guardan en el navegador.

## Modos

| Modo | Contenido | Objetivo |
|---|---|---|
| Historia | 1 nivel diseñado: La huella | Interpretar la pista, abrir la puerta, recuperar el eco |
| Flow | 10 sectores | Descubrir el movimiento y encadenar recogidas |
| Sprint | 3 sectores | Mejorar el tiempo |
| Daily | 6 sectores, semilla diaria UTC | Repetir la misma ruta del día |
| 100 / Arcade | 100 sectores en 10 rondas | Mantener el flow en una ruta larga |

Los cien sectores arcade combinan cuatro patrones con variaciones deterministas.
La historia completa tiene diez capítulos y cien niveles **planificados**; solo el
primer nivel narrativo está implementado. Consulta el [guion](docs/story-bible.md)
y el [diseño de niveles](docs/100-level-outline.md). Daily se genera localmente.

## Controles

| Acción | Teclado / ratón | Táctil |
|---|---|---|
| Mover | A/D o flechas izquierda/derecha | Flechas |
| Saltar, también en el aire | Espacio / W / flecha arriba | Salto o tocar el mundo |
| Dash | Shift | Dash |
| Leer ecos, en Historia | E | Botón ECOS |
| Disparar, en arcade | J, o mantener el ratón para apuntar | Fuego |
| Caída rápida | S / flecha abajo | — |
| Pausar | P / Escape o botón de pausa | Pausa |
| Reiniciar | R durante la partida o menú de pausa | Reiniciar en pausa |

Autoavance está disponible en arcade. Práctica evita los reinicios por daño;
las marcas se separan por modo, semilla, práctica y movimiento manual/automático.
Movimiento reducido elimina partículas, estelas, sacudidas y oscilaciones decorativas.

## Validación local

```powershell
npm test
npm run check
```

**26 pruebas pasan**: física, generación, controles, persistencia, regresiones y
acertijo. Una simulación con controles normales descubre la pista, comete un error,
resuelve la secuencia y completa La huella. Otra completa los cuatro modos arcade.
**48 comprobaciones de sintaxis** pasan, junto con la lectura de JSON.

La revisión visual, sonora y de dispositivos en un navegador real sigue pendiente.
El [playtest y smoke de navegador](docs/PLAYTEST.md) permiten hacerla localmente.
Consulta la [validación de esta entrega](docs/STORY-VALIDATION-2026-09-19.md).

## Estructura

- `index.html`, `styles/`, `src/main.js`: menú, HUD, prólogo, diario y resultados.
- `src/story/`: canon textual, secuencia y progreso narrativo.
- `src/world/StoryLevel.js`: geometría del primer nivel.
- `src/core`, `physics`, `entities`, `render`, `audio`: motor modular a 120 Hz.
- `tests/`, `tools/`: pruebas y servidor local sin dependencias de producción.
- `game/`, `archive/`: prototipos y variantes históricas.
- `docs/`: guion, niveles, arquitectura, auditorías y próximos pasos.

## Próximos pasos

Probar Historia con jugadores en Windows y móvil, ajustar la lectura de las pistas
y construir el siguiente nivel. Quedan por desarrollar los demás acertijos,
el control alterno de Luma, los capítulos posteriores y su desenlace.
Las mejoras técnicas pendientes figuran en [la arquitectura](docs/ARCHITECTURE.md)
y el [roadmap](docs/technical-roadmap.md). Cambios: [CHANGELOG](CHANGELOG.md).

## Servicios y datos

Sin GitHub Actions, despliegue automático, analítica ni llamadas a APIs de pago.
Las marcas permanecen en tu navegador. El repositorio conserva su situación de
licencia; esta actualización no añade una licencia ni lo relicencia.
