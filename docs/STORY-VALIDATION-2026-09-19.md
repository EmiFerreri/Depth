# Validación de Ecos de ti · 0.3.0 · 2026-09-19

## Entrega

Un nivel narrativo completo: prólogo → descubrimiento de pista → secuencia de
plataformas → puerta → primer eco → cierre. El diario pausa el mundo y conserva
los textos durante la partida. El resultado mantiene visible el mensaje de Luma.

El modo Historia usa la misma simulación fija del arcade, con un perfil de movimiento
más preciso. No añade dependencias de producción ni llamadas externas.

## Comprobaciones ejecutadas

| Comprobación | Resultado | Qué demuestra |
|---|---|---|
| `npm test` | 26/26 pasan | Motor, controles, persistencia, regresiones originales y siete pruebas narrativas |
| `npm run check` | 48 scripts válidos; JSON legible | Sintaxis de módulos, scripts y metadatos del repositorio |
| Servidor local | 25/25 recursos responden HTTP 200 | HTML, CSS, metadatos y módulos servidos con tipos MIME correctos |
| Secuencia y contacto | Pasa | 1 → 3 → 2 abre; estar quieto cuenta una vez; error permite reintentar |
| Recorrido mediante controles | Pasa | Un jugador simulado encuentra la pista, falla, resuelve, recupera el eco y termina |
| Puerta cerrada | Pasa | Bloquea dash a distintas alturas, incluyendo techo y suelo; impide completar sin resolver |
| Recompensas | Pasa | No se pueden acumular puntos saltando repetidamente sobre un acertijo resuelto |
| Pausa y nueva partida | Pasa | Pausa congela el progreso; otra partida reinicia pista, secuencia, eco y puerta |
| Regresiones arcade | Pasa | El jugador simulado completa Flow, Sprint, Daily y los 100 sectores |

El recorrido narrativo de integración utiliza `move` y `jump` a 120 Hz: no coloca
artificialmente al jugador sobre las plataformas para resolverlas. La prueba de
colisión sí coloca al jugador junto al sello para examinar sus límites por separado.

## Pendiente antes de considerar validada la experiencia completa

No se ejecutó la prueba en un navegador real en este entorno: el navegador local
no estaba disponible. No hay aprobación visual, de reproducción sonora ni de
interacción física con pantallas táctiles. Las pruebas del motor no garantizan
esas propiedades. El [playtest](PLAYTEST.md) incluye pasos reproducibles y el smoke
opcional de Chromium ahora contempla prólogo, diario, reinicio y vista móvil.

Las métricas guardadas son marcas locales editables por el propietario del navegador;
no hay clasificación online. El diario no conserva descubrimientos entre partidas.

## Alcance narrativo

Los diez capítulos, el desenlace y los cien niveles están escritos como diseño.
Solo el nivel 001 es jugable en Historia. El modo arcade de cien sectores mantiene
sus patrones anteriores. El control de Luma, las escenas posteriores y los futuros
acertijos no están implementados todavía.
