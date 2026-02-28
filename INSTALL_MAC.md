# Instalar NOVA Display Player en macOS (sin firma)
1. Construye la app: `npm run dist` (genera `*.dmg` en `dist/`).
2. Abre el Finder y **control-clic** sobre el `.dmg`, luego selecciona **Abrir**.
3. Si macOS bloquea la aplicación, ve a **Preferencias del Sistema > Seguridad y privacidad > General** y haz clic en **Permitir igualmente** o **Abrir de todas formas** para `NOVA Display Player`.
4. También puedes ejecutar en Terminal si necesitas quitar la cuarentena:
   ```bash
   xattr -dr com.apple.quarantine /Applications/NOVA\ Display\ Player.app
   ```
5. La próxima vez elige abrir normalmente: macOS recordará que permitiste la app.
