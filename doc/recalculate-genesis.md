# Recalcular bloque génesis tras cambiar `nBits`

Cuando se modifica el objetivo de dificultad inicial (`nBits`) en `src/kernel/chainparams.cpp`, es necesario recalcular el bloque génesis y actualizar su `hashGenesisBlock`.

1. **Ajusta los parámetros.**
   - Cambia `nBits` y, si procede, `powLimit` en `src/kernel/chainparams.cpp`.
2. **Compila el proyecto.**
   - Usa CMake para construir:
     ```bash
     cmake -S . -B build
     cmake --build build
     ```
3. **Minar el nuevo génesis.**
   - Ejecuta el binario con `-minegenesis` para que busque un nonce válido y muestre los asserts necesarios:
     ```bash
     ./build/src/bitcoind -minegenesis -printtoconsole
     ```
   - El proceso imprimirá el `nNonce`, `nTime`, `nBits`, el hash del bloque y la raíz de Merkle.
4. **Actualizar asserts.**
   - Copia los valores mostrados y reemplaza los asserts en `chainparams.cpp`.
   - Actualiza cualquier documentación relacionada, como `GENESIS.adonai.txt`.
5. **Verificar.**
   - Vuelve a compilar y ejecutar sin `-minegenesis` para asegurarte de que el nodo arranca correctamente.

Con esto, el bloque génesis quedará alineado con el nuevo nivel de dificultad.
