# CGFS Settings Editor

This project is a migration of the original HTML file `cgfs-settings-editor.html` into a modern application based on Vite and Electron.

The main goal of this migration is to simplify maintenance and allow development to continue in a more organized, modular, and scalable way.

## Migration Goal

The original HTML worked as a complete functional prototype, but everything was concentrated in a single file. By migrating it to this structure:

- The code is separated by responsibility (UI, logic, and styles).
- Adding new features is easier.
- Debugging and refactoring are more straightforward.
- Packaging as a Windows desktop application is enabled.

## Stack actual

- Vite: frontend development and build environment.
- Electron: desktop shell to run the app as an EXE.
- electron-builder: packaging for distributable versions (Portable and Setup).

## Current Stack

## Project Structure

- `index.html`: base web application file.
- `src/main.js`: main editor logic.
- `src/style.css`: interface styling.
- `electron/main.cjs`: Electron main process.
- `vite.config.js`: build configuration (includes `base: './'` for `file://` compatibility).

## Available Scripts

- `npm run dev`: starts Vite in development mode (web).
- `npm run build`: creates a production build in `dist/`.
- `npm run desktop`: builds and opens the app with Electron.
- `npm run dev:desktop`: runs Vite + Electron in development.
- `npm run dist:win`: generates a Windows Portable binary.
- `npm run dist:setup`: generates a Windows Setup installer (NSIS).

## Distribution

Artifacts are generated in the `release/` folder.

Recommended files to upload to GitHub Releases:

- `CGFS Settings Editor-Portable-<version>.exe` for the portable version.
- `CGFS-Settings-Editor-Setup-<version>.exe` for the traditional installer.

## Note

This repository represents the continuation of the original HTML-based project, now migrated to an architecture that is easier to evolve.
