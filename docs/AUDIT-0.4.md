# Auditoría y expansión de DEPTH 0.4

Fecha: 2026-09-19. Base auditada: `52174038aa0025997c615916dc0d6ae5ebd67720` (0.3).
Alcance: código, progresión, solvencia de cámaras y regresiones locales. No es una
auditoría de seguridad externa ni una certificación de calidad comercial.

## Hallazgos y decisiones

| Hallazgo | Impacto | Resolución |
|---|---|---|
| Historia terminaba después de una secuencia de tres plataformas | No había una campaña larga | 100 cámaras construidas a partir de diez familias de reglas |
| Los cien sectores arcade repetían cuatro patrones | El número de sectores no equivalía a variedad sostenida | Se conserva ese modo; las nuevas expediciones mezclan las reglas narrativas |
| No existía avance entre cámaras | Una campaña larga carecía de continuidad | Guardado por cámara, mapa, selección y reanudación |
| Diario, ayuda y resultado asumían siempre el mismo acertijo | El resto de contenido no podía integrarse correctamente | Textos y reglas derivados de la especificación de cada cámara |
| No había objetivos posteriores a completar | Repetir solo cambiaba una marca | Reliquias, 300 estrellas y tiempos objetivo, sin bloquear el siguiente nivel |
| Guardar solo en el navegador era frágil para meses de juego | Borrar datos podía destruir el avance | Exportación e importación JSON con validación y fusión de logros |
| Un recorrido enorme podría crecer en memoria | Riesgo de costes crecientes por duración | Generación de una sola cámara; progreso de historia acotado a cien registros |
| Alternar personajes reactivaba una plataforma ocupada durante la ampliación | Rompía secuencias sin un salto nuevo | Se conserva el contacto al volver a un personaje apoyado |
| El renderizador colocaba FINISH en el límite fijo del arcade | Confundía la salida en cámaras más largas | Salida dibujada en el extremo real del nivel narrativo |
| No había una comprobación reproducible de toda la campaña | Riesgo de prometer niveles no completables | Piloto mediante controles y comando local con informes |

## Dificultad implementada

La dificultad usa `d = (nivel - 1) / 99` en Historia. Las reglas se introducen por
capítulos; la longitud crece por bloques dentro de cada capítulo, con alivio al
aprender una regla nueva. La progresión es por etapas, no una obligación de que
cada segundo sea más difícil que el anterior.

| Parámetro | Inicio | Límite avanzado |
|---|---:|---:|
| Huellas auténticas | 3 | 5 |
| Ancho de plataforma | 180 unidades | 94 unidades |
| Pasos de secuencia | 3 | 8 |
| Velocidad manual | 270 unidades/s | 320 unidades/s |
| Ventana de silencio | 2,8 s en reglas de ritmo a dificultad baja | 1,6 s |
| Tiempo de quietud | 0,75 s a dificultad baja | 2 s |
| Plazo entre recuerdos | Sin plazo en Historia | 24–30 s en expediciones Experto/Maestro |

Los valores bajos de quietud/ritmo son límites del generador; la campaña introduce
esas reglas en capítulos posteriores, con la dificultad correspondiente. Los
obstáculos de suelo y las alturas variables aparecen gradualmente. Los saltos
infinitos permiten buscar rutas alternativas, pero no atravesar un sello sin resolverlo.

## Evidencia ejecutada

- `npm run validate`: PASS.
- 36 pruebas de regresión: PASS.
- 56 comprobaciones de sintaxis y lectura de JSON: PASS.
- 29 recursos del juego servidos por HTTP con estado 200; referencias DOM y ausencia
  de identificadores duplicados comprobadas.
- Piloto que completa 100/100 cámaras narrativas: PASS.
- Piloto que completa 36/36 cámaras de la expedición `VALIDACION`, intensidad 5,
  longitud 36: PASS.
- Ambos recorridos terminan sin errores de acertijo ni impactos en esta ejecución.
- Reliquias verificadas mediante controles en las cámaras 1, 10, 50 y 100.
- Todas las configuraciones binarias no vacías de interruptores de 3–5 luces
  se resuelven en un máximo de una activación por interruptor.
- Semillas reproducibles, límites UTC del día/semana y geometría acotada probados,
  incluyendo muestras en profundidades de expedición próximas al límite de 100 000.
- Migración del nivel 001 de 0.3, persistencia, importación, fusión y bloqueo de
  almacenamiento cubiertos por pruebas.

El piloto solo introduce movimiento, salto y cambio de personaje. Usa las soluciones
y calcula cuándo caer en las ventanas de silencio. Sus aproximadamente 39 minutos
de tiempo simulado para toda Historia **no estiman la duración humana**: no lee,
no explora, no duda y conoce el motor. Tampoco demuestran que alguien disfrutará el juego.
Los informes completos se regeneran en `build/validation/` y no se suben al repositorio.

## Límites abiertos

1. **Navegador real pendiente.** El ejecutable local de Chromium no está instalado. No se ha firmado la composición visual, el audio,
   el rendimiento de Canvas ni la interacción física táctil en este entorno. El smoke
   opcional cubre ahora completar el primer nivel, continuar, mapa, expedición,
   importación y cambio a Luma, pero no se declara ejecutado.
2. **Dificultad humana pendiente.** Las cifras son una primera curva de diseño.
   Deben medirse errores, comprensión, frustración y ganas de repetir con personas.
3. **Variedad finita.** Cien cámaras y muchos códigos reutilizan diez familias.
   Ninguna cantidad de semillas demuestra cinco años de interés.
4. **Narrativa representada por reglas.** Las casas, jardines y archivos del guion
   no son todavía escenas ilustradas independientes. Algunos acertijos específicos
   del esquema original siguen siendo propuestas para futuras rutas diseñadas a mano.
5. **Reanudación por cámara.** No se recupera la posición exacta ni un acertijo parcial.
   Los personajes inactivos conservan su estado mientras juegas con el otro.
6. **Registros locales.** No existe validación competitiva, sincronización ni nube.
   Las copias guardan la campaña y expedición activa, no todas las marcas arcade.
7. **Accesibilidad parcial.** Hay apoyos visuales al sonido, movimiento reducido,
   pausa y ayuda. Faltan remapeo, mando y una experiencia completamente no visual.

## Decisión de salida

La campaña ampliada es resoluble en simulación y tiene regresiones locales.
Está lista para playtest, no para prometer retención, duración humana o compatibilidad
con todos los dispositivos. Siguiente puerta: probar las cámaras 1, 10, 21, 41, 61,
71, 81 y 100 en Windows y móvil siguiendo [PLAYTEST.md](PLAYTEST.md).
