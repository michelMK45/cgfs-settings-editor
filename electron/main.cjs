const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const { readTeamsFromGameRoot } = require('./db-reader.cjs')

const devUrl = process.env.ELECTRON_START_URL
const dbState = {
  gameRootPath: '',
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    icon: path.join(__dirname, '..', 'icon.ico'),
    backgroundColor: '#0e0f12',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (devUrl) {
    // Retry while Vite server boots up to avoid a blank desktop window.
    const tryLoad = () => {
      win.loadURL(devUrl).catch(() => {
        setTimeout(tryLoad, 500)
      })
    }
    tryLoad()
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function isValidRoot(gameRootPath) {
  return typeof gameRootPath === 'string' && gameRootPath.trim().length > 1
}

ipcMain.handle('app:pickGameRoot', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select FIFA 16 Root Folder',
  })

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true }
  }

  const selectedPath = result.filePaths[0]
  dbState.gameRootPath = selectedPath
  return { canceled: false, gameRootPath: selectedPath }
})

ipcMain.handle('db:setGameRoot', async (_event, gameRootPath) => {
  if (!isValidRoot(gameRootPath)) {
    throw new Error('Invalid game root path.')
  }

  dbState.gameRootPath = gameRootPath.trim()
  return { ok: true, gameRootPath: dbState.gameRootPath }
})

ipcMain.handle('db:getState', async () => {
  return {
    isDesktop: true,
    gameRootPath: dbState.gameRootPath,
    hasGameRoot: !!dbState.gameRootPath,
  }
})

ipcMain.handle('db:clearGameRoot', async () => {
  dbState.gameRootPath = ''
  return { ok: true }
})

ipcMain.handle('db:getTeams', async (_event, maybeGameRootPath) => {
  const gameRootPath = isValidRoot(maybeGameRootPath) ? maybeGameRootPath.trim() : dbState.gameRootPath

  if (!isValidRoot(gameRootPath)) {
    throw new Error('Game root path not set. Please select your FIFA 16 root folder first.')
  }

  dbState.gameRootPath = gameRootPath
  const teams = await readTeamsFromGameRoot(gameRootPath)
  return {
    ok: true,
    teams,
    gameRootPath,
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
