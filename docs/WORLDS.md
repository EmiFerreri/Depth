# Atlas de DEPTH · mundos, personajes y progresión

El catálogo ejecutable está en `src/content/Catalog.js`. Relaciona cinco mundos,
diez capítulos, cien cámaras, personajes, capacidades, obstáculos y recompensas.
`Memories.js` contiene veinte escenas opcionales escritas para esta versión.
El atlas del juego y la API leen esos mismos datos.

## El descenso

| Mundo | Cámaras | Aprendizaje | Entorno jugable | Insignia por sus 20 cámaras |
|---|---|---|---|---|
| El Vestíbulo | 001–020 | Secuencias y espejos | Arcos, resortes, peligros en el suelo | Cartógrafo de las huellas |
| Jardines del Espejismo | 021–040 | Dirección y voces auténticas | Ramas, barreras pulsantes y anillos falsos | Oído del jardín |
| Archivos Suspendidos | 041–060 | Quietud y orden temporal | Estantes, puentes frágiles y corrientes | Custodio del tiempo |
| Nexo de Cristal | 061–080 | Cooperación e interruptores | Puentes, centinelas y soportes frágiles | Dos lados, un camino |
| Corazón de PRISMA | 081–100 | Silencio y combinación | Anillos, barreras pulsantes y centinelas | Nadie despierta solo |

Historia recorre los mundos en orden. El atlas permite explorar cualquiera en una
expedición ajustable. Al seleccionar un mundo, sus dos familias de acertijos se
alternan. Con «Todos», se conserva la mezcla de diez familias por cada diez cámaras.
Los motivos arquitectónicos y colores acompañan a las reglas y obstáculos reales.

El arco narrativo pasa de reconocer una ausencia a demostrar la manipulación,
reconstruir lo sucedido, colaborar con Luma y dejar que ella elija su salida.
En la cámara 100, Nox puede sostener la salida, pero la llegada final requiere a Luma.

## Personajes y capacidades

| Personaje | Función | Capacidad v5 |
|---|---|---|
| Nox | Explorador; disponible en todas las cámaras | **Ancla**, F: frena, reduce la velocidad vertical y protege 0,65 s; recarga 6 s |
| Luma | Jugable en cooperación y despertar (061–070 y 091–100, y sus familias de expedición) | **Velo**, F: gravedad reducida durante 2,4 s, protección inicial 0,35 s; recarga 8 s |
| PRISMA | Antagonista narrativo; sus defensas son las reglas y obstáculos | No es un personaje jugable ni un jefe con combate separado |

Ambos jugadores saltan repetidamente con Espacio y usan dash con Shift. Q alterna
cuando la cámara permite cooperación. Cada personaje conserva posición y recarga;
el personaje inactivo queda suspendido hasta volver a él. Pausa y diario detienen
los tiempos. Las capacidades protegen del daño, pero no resuelven acertijos ni
atraviesan sellos cerrados. La energía reduce tres segundos de recarga del activo.

## Obstáculos legibles

- **Fragmentos cortantes:** daño fijo a nivel del suelo; la trayectoria alta los evita.
- **Barrera pulsante:** 2,1 s libre, 0,6 s de aviso y 1,5 s activa. Texto, contorno y
  color indican el estado. Tiene espacio por arriba; no cubre toda la cámara.
- **Centinela:** patrulla lateral con periodo de 3,8 s. Su trayectoria es determinista.
- **Puente frágil:** soporte opcional que cede tras 0,7 s de contacto continuo y vuelve
  dos segundos después. No sustituye una huella obligatoria del acertijo.
- **Resorte:** impulsa hacia arriba al aterrizar desde el aire sobre su base.
- **Corriente:** reduce la aceleración descendente en su zona marcada con flechas.

La primera cámara presenta movimiento, pista, secuencia y reliquia sin nuevos
corredores de obstáculos. Las demás mantienen huellas y reglas obligatorias, con
rutas opcionales de exploración. La dificultad sigue limitada: mínimo de 94 unidades
por plataforma, máximo de cinco huellas y ocho pasos, y ventanas de silencio de al
menos 1,6 s. No hay un límite de tiempo total para terminar Historia.

## Recompensas y archivo de recuerdos

Los fragmentos descubren escenas breves: la mesa torcida, las flores con su voz,
la cinta sin cortar, la promesa nueva y el miedo de PRISMA, entre otras. Puedes leer
cada escena en ECOS durante el intento. Al completar la cámara, queda en el atlas
y en tu copia de progreso. Hay cuatro escenas por mundo; las dos familias del mundo
permiten encontrar todas incluso en intensidad Aprendiz. La API enumera el catálogo
completo; el atlas mantiene oculto el texto de lo todavía no descubierto.

Las 300 estrellas son independientes y acumulables: completar, precisión sin daño
ni errores en estándar, y reliquia. Las cinco insignias se obtienen al completar las
veinte cámaras de Historia de cada mundo. Ninguna exige compras, cuentas o puntos
mínimos para continuar.

| Fuente | Puntos v5 |
|---|---|
| Nueva distancia máxima | 0,05 por unidad |
| Fragmento | 40 × combo y escena opcional |
| Energía | 80 × combo y recarga reducida |
| Reliquia | 300 × combo y estrella al completar |
| Resolver el acertijo | (500 + 500 × dificultad) × combo |
| Completar | 500 + redondeo(250 × dificultad) + máx(0, objetivo − tiempo) × 2 |
| Impacto | Resta hasta 150; reinicia combo |

El combo aumenta al recoger o resolver, hasta ×12, y expira a los 3,4 s sin recompensa.
Distancia y cierre no lo multiplican. Cada recogible, acertijo y cierre paga una vez
por intento. El resultado muestra el desglose por fuente; el total visible es entero.
El arcade y las rutas v4 conservan sus valores anteriores.

## Historial y copias

**Mis trayectorias** conserva hasta 200 intentos, ordenados por fecha: completado,
reiniciado o regreso al menú. Cada fila incluye mundo, cámara, versión, código,
intensidad, longitud, práctica/estándar, tiempo, puntos, impactos, errores, capacidades,
reliquia y estrellas de ese intento. Se puede volver a jugar su configuración.
Las insignias y mejores estrellas usan los logros acumulados, no el último intento.

No se reconstruyen intentos anteriores a esta versión. Cerrar directamente la pestaña
no registra una partida incompleta. El historial es un registro de resultados, no
una grabación de controles. Exportar e importar conserva escenas, historial, estrellas
y expedición activa; combina duplicados por ID y limita el historial a los 200 más
recientes. No incluye todo el estado físico ni todos los ajustes del navegador.

Para ampliar contenido, conserva los identificadores del catálogo, añade las escenas
en `Memories.js` y verifica sus referencias. Los cambios que alteren rutas compartidas
requieren una nueva versión del generador y una decisión explícita sobre compatibilidad.
Consulta [arquitectura](ARCHITECTURE.md), [API](api/README.md) y [playtest](PLAYTEST.md).
