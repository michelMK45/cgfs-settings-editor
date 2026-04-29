const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const devUrl = process.env.ELECTRON_START_URL

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0e0f12',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
