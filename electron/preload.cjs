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
  // File access scoped to the saved game root (paths are relative to it).
  fs: {
    stat:      (rel) => ipcRenderer.invoke('fs:stat', rel),
    list:      (rel) => ipcRenderer.invoke('fs:list', rel),
    mkdir:     (rel) => ipcRenderer.invoke('fs:mkdir', rel),
    readFile:  (rel) => ipcRenderer.invoke('fs:readFile', rel),
    writeFile: (rel, data) => ipcRenderer.invoke('fs:writeFile', rel, data),
    remove:    (rel) => ipcRenderer.invoke('fs:remove', rel),
  },
  gameplay: {
    scanZip: (zipPath) => ipcRenderer.invoke('gameplay:scanZip', zipPath),
    writeToZip: (zipPath, fileType, buf) => ipcRenderer.invoke('gameplay:writeToZip', zipPath, fileType, buf),
    removeFromZip: (zipPath, fileType) => ipcRenderer.invoke('gameplay:removeFromZip', zipPath, fileType),
    scanRar: (rarPath) => ipcRenderer.invoke('gameplay:scanRar', rarPath),
    writeToRar: (rarPath, fileType, buf) => ipcRenderer.invoke('gameplay:writeToRar', rarPath, fileType, buf),
    removeFromRar: (rarPath, fileType) => ipcRenderer.invoke('gameplay:removeFromRar', rarPath, fileType),
  },
  stadiumAssets: {
    scanZip:       (p) => ipcRenderer.invoke('stadiumAssets:scanZip', p),
    scanRar:       (p) => ipcRenderer.invoke('stadiumAssets:scanRar', p),
    writeToZip:    (p, cat, key, buf) => ipcRenderer.invoke('stadiumAssets:writeToZip', p, cat, key, buf),
    removeFromZip: (p, cat, key) => ipcRenderer.invoke('stadiumAssets:removeFromZip', p, cat, key),
    writeToRar:      (p, cat, key, buf) => ipcRenderer.invoke('stadiumAssets:writeToRar', p, cat, key, buf),
    removeFromRar:   (p, cat, key) => ipcRenderer.invoke('stadiumAssets:removeFromRar', p, cat, key),
    convertRarToZip: (p) => ipcRenderer.invoke('stadiumAssets:convertRarToZip', p),
  },
})
