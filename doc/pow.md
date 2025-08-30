# Prueba de Trabajo (PoW)

ADONAI utiliza BLAKE3 como función hash de Prueba de Trabajo. A partir de esta versión,
la dificultad se ajusta en cada bloque usando el algoritmo **Linearly Weighted Moving Average (LWMA)**.

## LWMA por bloque

El objetivo es mantener un intervalo medio constante entre bloques. Para ello se toman los
últimos *N* bloques (ventana) y se calcula un promedio ponderado de sus tiempos de resolución.
Cada bloque más reciente recibe un peso mayor. El nuevo objetivo de dificultad se deriva de:

```
next_target = (avg_target * weighted_times) / k
```

donde `avg_target` es el promedio de los objetivos anteriores,
`weighted_times` la suma de tiempos ponderados y `k = N*(N+1)*T/2`, siendo `T`
el tiempo objetivo entre bloques.

Este esquema reacciona de forma más rápida ante cambios bruscos de hashrate y evita
oscilaciones asociadas a los reajustes por intervalos largos.

