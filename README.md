# VANTYR Blood Codex

Private Android character helper for Vantyr (Blood Hunter / Vampire). Source code is HTML, CSS and JavaScript embedded in an Android WebView.

## Initial project upload

The repository currently includes the Android APK build workflow. To put the app source here, use the **existing Android Studio project folder** that has already built successfully:

1. Open that project in Android Studio.
2. From the project's root directory, open the Terminal panel.
3. Run:
   ```bash
   git init
   git remote add origin https://github.com/Vegesotos/Vantyr-Blood-Codex.git
   git fetch origin
   git checkout -b main --track origin/main
   git add app build.gradle settings.gradle gradle.properties
   git commit -m "Add Vantyr Android app v3.0"
   git push origin main
   ```
   If the checkout reports untracked-file conflicts, use the safer alternative in the instructions below rather than forcing or deleting files.

### Safer upload using a fresh clone

If you prefer not to alter the project folder, from a terminal outside that folder run:
```bash
git clone https://github.com/Vegesotos/Vantyr-Blood-Codex.git
```
Copy the project's `app/`, `build.gradle`, `settings.gradle` and `gradle.properties` into the new `Vantyr-Blood-Codex` clone, keeping the existing `.github/`, `.gitignore`, and this README. Then run inside the clone:
```bash
git add .
git commit -m "Add Vantyr Android app v3.0"
git push origin main
```

## Automated APK builds

The workflow in `.github/workflows/build-apk.yml` runs on pushes to `main`, or manually in **Actions → Build VANTYR Android APK → Run workflow**.

When the build finishes, open the workflow run and download the `Vantyr-Blood-Codex-debug-APK` artifact ZIP. Extract `app-debug.apk` and install it on Android. A debug APK is for personal testing; public distribution requires a separately signed release build.

## Updating in Android Studio

Use Git **Pull** to receive future source changes, then rebuild the APK or use the downloaded GitHub Actions build. APK installation is a separate step from source code updates.

## Save data

Character progress is stored locally in the app; it is not synchronized through GitHub. Back up your phone's app data before uninstalling/reinstalling or changing the package identifier.
