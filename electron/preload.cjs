const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  pickGameRoot: () => ipcRenderer.invoke('app:pickGameRoot'),
  openPath: (targetPath) => ipcRenderer.invoke('app:openPath', targetPath),
  db: {
    setGameRoot: (gameRootPath) => ipcRenderer.invoke('db:setGameRoot', gameRootPath),
    clearGameRoot: () => ipcRenderer.invoke('db:clearGameRoot'),
    getState: () => ipcRenderer.invoke('db:getState'),
    getTeams: (gameRootPath) => ipcRenderer.invoke('db:getTeams', gameRootPath),
  },
})
