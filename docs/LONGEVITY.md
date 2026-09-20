# Diseñar DEPTH para volver durante años

## Objetivo verificable

No podemos garantizar «cinco años sin aburrirse». Podemos construir sesiones que
ofrezcan decisiones nuevas y comprobar si las personas quieren repetir voluntariamente.
Más niveles, más velocidad o más premios no equivalen por sí solos a más diversión.

## Lo que existe hoy

| Horizonte de juego | Motivo para volver | Implementación 0.5 |
|---|---|---|
| Una sesión | Entender una regla y abrir la siguiente cámara | Pistas, ayuda, feedback reversible, guardado por cámara |
| Varias sesiones | Seguir la historia y aprender reglas nuevas | 100 cámaras, diez capítulos, mapa y Luma controlable |
| Repetir una cámara | Dominar una trayectoria | Tres estrellas independientes, reliquia opcional y mejor tiempo |
| Otra semana | Resolver otra combinación | Semillas del día/semana calculadas en UTC, sin servicio programado |
| Recorrido largo | Mantener consistencia bajo reglas mezcladas | Expediciones 12/36/100 000, cinco intensidades y dificultad limitada |
| Cambiar de equipo | Conservar el camino recorrido | Copias JSON locales importables |

El código diario no da premios por mantener una racha y no bloquea otros códigos.
No hay energía que comprar, esperas obligatorias, compras aleatorias ni castigo por
pasar días sin jugar. Los retos se sostienen en las decisiones y en el movimiento.

## Cómo medir si funciona, sin analítica remota

Registrar manualmente observaciones de playtest con consentimiento. Separar a quien
nunca ha jugado de quien conoce las soluciones. Empezar con una pequeña ronda de
personas y usar los resultados para encontrar problemas, no para sacar conclusiones
estadísticas sobre toda una audiencia.

| Pregunta | Qué observar | Qué cambiar si falla |
|---|---|---|
| ¿Entiende la regla? | Puede explicar el siguiente paso después de leer la pista | Texto, símbolos y una cámara introductoria más clara |
| ¿Sabe por qué falló? | Distingue orden, dirección, personaje y tiempo | Feedback específico y visualización del estado |
| ¿La dificultad exige aprender? | El segundo intento mejora por una decisión consciente | Quitar castigos opacos y obstáculos sin función |
| ¿La reliquia crea una elección? | Decide cuándo desviarse y cómo volver | Altura, ubicación y riesgo de la ruta opcional |
| ¿Quiere repetir? | Elige otra cámara o reto sin que se le pida | Añadir decisiones nuevas antes que más repeticiones |
| ¿Es viable una sesión corta? | Termina una cámara y sabe que su progreso quedó guardado | Longitud de cámara, puntos de guardado y texto de cierre |

Medir por separado comprensión y ejecución. Un acertijo opaco y un salto preciso
pueden producir el mismo número de intentos por motivos completamente distintos.

## Iteraciones siguientes

1. **Validación visual y de control.** Ejecutar el smoke, probar Windows y móvil,
   corregir oclusiones, tamaño de objetivos, ritmo sonoro y orientación de pantalla.
2. **Afinar la curva con personas.** Ajustar anchos, alturas, tiempos y longitud de
   secuencias por familia. Congelar una versión del generador antes de comparar marcas.
3. **Rutas diseñadas individualmente.** Crear unas pocas cámaras excelentes que usen
   cada regla en situaciones espaciales nuevas: habitaciones, puentes, sombras y órbitas.
4. **Creación y comunidad opcional.** Editor local de cámaras con validación de archivos,
   importación de rutas y formato versionado. Compartir archivos antes de operar una nube.
5. **Nuevas reglas y combinaciones.** Añadir módulos con sus propios tests y recorridos
   de ejemplo. Evaluar cada incorporación por las decisiones que aporta, no por contarla.
6. **Producción avanzada.** Mando, remapeo, sonido espacial, traducciones, replays y
   fantasmas personales; solo después, estudiar si una clasificación online aporta valor.

Estas iteraciones no están implementadas ni se ejecutan automáticamente. No requieren
contratar infraestructura para probar su utilidad inicial. Un calendario de contenido
para varios años debe decidirse después de conocer el coste real de crear y validar
cada regla o cámara, y la respuesta de quienes juegan.

## Contrato de una nueva regla

- Entrada: contacto, dirección, personaje, tiempo simulado y configuración versionada.
- Salida: estado visible, avance, error explicable y resolución.
- La pista permite deducir una solución sin conocimiento externo.
- Sonido y color tienen equivalentes en formas, números o texto.
- Debe haber una recuperación clara tras un error y un límite de dificultad utilizable.
- Un piloto demuestra al menos una solución; un playtest verifica que es comprensible.
- No cambiar silenciosamente rutas compartidas: incrementar la versión y definir
  cómo se migran progreso y marcas.

La siguiente acción concreta es jugar una cámara de cada familia con una persona
que no conozca el guion y anotar dónde deja de comprender lo que el juego pide.

La versión 0.5 incorpora cinco mundos seleccionables, veinte escenas opcionales,
insignias, capacidades, obstáculos temporales, historial y una API procedural local.
Es una base para crear y evaluar rutas; el editor visual y la validación humana de
retención siguen pendientes. Véanse [mundos](WORLDS.md) y [API](api/README.md).
