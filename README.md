# Vayxo Launcher

Descarga la última versión estable desde [Vayxo](https://vayxo.net/launcher) o desde [Releases](https://github.com/Calviero/Vayxo-Releases/releases/latest).

## Publicar una versión

1. Crea un borrador de GitHub Releases con la etiqueta `vX.Y.Z`. Adjunta el código del launcher como `vayxo-launcher-X.Y.Z-source.tar.gz`, con los archivos del proyecto en la raíz del archivo. Calcula su SHA-256.
2. Abre **Actions → Build and verify a release draft → Run workflow**. Introduce la versión sin la v, elige **all** y pega el SHA-256. Los equipos de compilación generan los instaladores y firman las actualizaciones con la clave de Vayxo.
3. Cuando las cuatro compilaciones terminen, abre **Actions → Finish verified release**. Puedes ejecutarlo con la casilla de publicación desmarcada para preparar el borrador y revisar sus archivos. Al marcarla, el flujo comprueba los paquetes, sus firmas y las sumas SHA-256 antes de publicar.
4. Comprueba la versión en [la web](https://vayxo.net/api/version) y el [canal de actualización](https://vayxo.net/api/launcher/update). Los clientes compatibles consultan ese canal desde Ajustes. La primera migración desde 2.0 requiere instalar una vez la versión con el actualizador integrado.

El flujo necesita el secreto de repositorio `TAURI_SIGNING_PRIVATE_KEY`. La clave pública de verificación está en `launcher.pub`.
