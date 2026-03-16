# Desktop Application Packaging (Windows .exe)

The desktop app runs as a single .exe: Electron starts the backend (Flask packaged with PyInstaller) and opens the React UI. Data (DB, uploads) is stored in the app's user data directory.

## Build Order

1. **Build backend** (creates `WebQuizBackend.exe` and copies it to `front-end/backend/`):

   ```powershell
   cd ..\back-end
   .\build_backend.ps1
   ```

   Requires: Python, `pip install -r requirements.txt`, `pip install pyinstaller`.

2. **Build Electron** (creates installer/portable in `dist/`):

   ```powershell
   cd front-end
   npm run dist:win
   ```

   Or **a single command** (from the `front-end` directory):

   ```powershell
   npm run build:desktop:win
   ```

   This script runs `build_backend.ps1` then executes `dist:win`.

## Output

- `dist/` contains the portable file (.exe) or MSI.
- Users install/run a single .exe; the backend runs automatically with `USER_DATA_PATH` = user data directory (e.g., `%AppData%/com.n-ziermann.front-end`).

## Notes

- The `front-end/backend/` directory must exist (containing `WebQuizBackend.exe`) when running `dist:win`; if the backend hasn't been built yet, run `build_backend.ps1` first.
- Dev mode (`npm run dev`): does not spawn the backend; you need to run `python app.py` in `back-end` separately.
