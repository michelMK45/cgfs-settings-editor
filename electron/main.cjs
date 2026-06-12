const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFile } = require('node:child_process')
const AdmZip = require('adm-zip')
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

  // Open external links in the default browser instead of inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const appUrl = devUrl || `file://${path.join(__dirname, '..', 'dist', 'index.html')}`
    if (!url.startsWith(appUrl)) {
      event.preventDefault()
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url)
      }
    }
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

ipcMain.handle('app:openPath', async (_event, maybeTargetPath) => {
  if (typeof maybeTargetPath !== 'string' || !maybeTargetPath.trim()) {
    throw new Error('Invalid path to open.')
  }

  const targetPath = path.normalize(maybeTargetPath.trim())
  if (!fs.existsSync(targetPath)) {
    throw new Error('Path not found: ' + targetPath)
  }

  const stats = fs.lstatSync(targetPath)
  if (stats.isDirectory()) {
    const openErr = await shell.openPath(targetPath)
    if (openErr) {
      throw new Error(openErr)
    }
  } else {
    shell.showItemInFolder(targetPath)
  }

  return { ok: true, targetPath }
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

// ============================================================
// GAMEPLAYCAM — ZIP / RAR helpers
// ============================================================
const GAMEPLAY_CAM_DIR = 'GameplayCamGBD'
const GAMEPLAY_FILES = { '176': 'bcgameplay_176.dat', '261': 'bcgameplay_261.dat' }

function execFileAsync(bin, args) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve(stdout)
    })
  })
}

// Reads the first 8 bytes to detect actual archive format regardless of extension.
// Returns 'zip', 'rar', or 'unknown'.
function detectArchiveType(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(8)
    fs.readSync(fd, buf, 0, 8, 0)
    fs.closeSync(fd)
    if (buf[0] === 0x50 && buf[1] === 0x4B) return 'zip'                        // PK (ZIP)
    if (buf[0] === 0x52 && buf[1] === 0x61 && buf[2] === 0x72 && buf[3] === 0x21) return 'rar' // Rar!
    return 'unknown'
  } catch (_) { return 'unknown' }
}

// Returns all available extraction tools in priority order.
function findAllExtractors() {
  const bundled = app.isPackaged
    ? path.join(process.resourcesPath, 'bin', '7za.exe')
    : path.join(__dirname, '..', 'bin', '7za.exe')
  return [
    { path: 'C:\\Program Files\\7-Zip\\7z.exe',          type: '7zip'   },
    { path: 'C:\\Program Files (x86)\\7-Zip\\7z.exe',    type: '7zip'   },
    { path: bundled,                                       type: '7zip'   },
    { path: 'C:\\Program Files\\7-Zip\\7za.exe',          type: '7zip'   },
    { path: 'C:\\Program Files (x86)\\7-Zip\\7za.exe',    type: '7zip'   },
    { path: 'C:\\Program Files\\WinRAR\\Rar.exe',         type: 'winrar' },
    { path: 'C:\\Program Files (x86)\\WinRAR\\Rar.exe',   type: 'winrar' },
    { path: 'C:\\Program Files\\WinRAR\\UnRAR.exe',       type: 'unrar'  },
    { path: 'C:\\Program Files (x86)\\WinRAR\\UnRAR.exe', type: 'unrar'  },
  ].filter((c) => fs.existsSync(c.path))
}

function findExtractor() {
  return findAllExtractors()[0] || null
}

// Extracts a RAR (or any archive 7-Zip/WinRAR can read) into outputDir.
async function extractArchive(extractor, archivePath, outputDir) {
  if (extractor.type === '7zip') {
    await execFileAsync(extractor.path, ['x', archivePath, '-o' + outputDir, '-y'])
  } else {
    // winrar / unrar: x -y archive outputDir\
    await execFileAsync(extractor.path, ['x', '-y', archivePath, outputDir + '\\'])
  }
}

// Lists contents of an archive via stdout using any extractor.
async function listArchive(extractor, archivePath) {
  return execFileAsync(extractor.path, ['l', archivePath])
}

// Tries all available extractors in sequence; RAR5 may require full 7-Zip or WinRAR.
async function extractArchiveWithFallbacks(archivePath, outputDir) {
  const all = findAllExtractors()
  if (all.length === 0) throw new Error('No extraction tool found. Install 7-Zip or WinRAR.')
  let lastError
  for (const ext of all) {
    try { await extractArchive(ext, archivePath, outputDir); return }
    catch (e) { lastError = e }
  }
  throw lastError
}

async function listArchiveWithFallbacks(archivePath) {
  const all = findAllExtractors()
  if (all.length === 0) throw new Error('No extraction tool found. Install 7-Zip or WinRAR.')
  let lastError
  for (const ext of all) {
    try { return await listArchive(ext, archivePath) }
    catch (e) { lastError = e }
  }
  throw lastError
}

// Recursively adds all files from dirPath into zip under the given prefix.
function addDirToZip(zip, dirPath, prefix) {
  for (const entry of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry)
    const entryName = (prefix ? prefix + '/' + entry : entry).replace(/\\/g, '/')
    if (fs.statSync(fullPath).isDirectory()) {
      addDirToZip(zip, fullPath, entryName)
    } else {
      zip.addFile(entryName, fs.readFileSync(fullPath))
    }
  }
}

// Returns the common root prefix inside a ZIP (e.g. "ARG - Boca Juniors/") or "" if none.
// Archives often wrap everything inside a single top-level folder.
function detectZipInternalRoot(zip) {
  const roots = new Set()
  for (const entry of zip.getEntries()) {
    const normalized = entry.entryName.replace(/\\/g, '/')
    const firstSlash = normalized.indexOf('/')
    if (firstSlash > 0) roots.add(normalized.slice(0, firstSlash + 1))
  }
  // Only treat it as a wrapper folder when every entry shares the same root
  if (roots.size === 1) return roots.values().next().value
  return ''
}

// After extracting a RAR/ZIP to tmpDir, find the actual content root.
// If there is exactly one subdirectory (and nothing else), that dir is the internal root.
function getExtractionRoot(tmpDir) {
  const entries = fs.readdirSync(tmpDir)
  if (entries.length === 1) {
    const candidate = path.join(tmpDir, entries[0])
    if (fs.statSync(candidate).isDirectory()) return candidate
  }
  return tmpDir
}

ipcMain.handle('gameplay:scanZip', async (_event, zipPath) => {
  try {
    const zip = new AdmZip(zipPath)
    const names = zip.getEntries().map((e) => e.entryName.replace(/\\/g, '/').toLowerCase())
    const suffix176 = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES['176']).toLowerCase()
    const suffix261 = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES['261']).toLowerCase()
    return {
      has176: names.some((n) => n.endsWith(suffix176)),
      has261: names.some((n) => n.endsWith(suffix261)),
    }
  } catch (e) {
    return { has176: false, has261: false, error: e.message }
  }
})

ipcMain.handle('gameplay:writeToZip', async (_event, zipPath, fileType, fileBufferArray) => {
  const fileName = GAMEPLAY_FILES[fileType]
  if (!fileName) throw new Error('Unknown file type: ' + fileType)
  const zip = new AdmZip(zipPath)
  const internalRoot = detectZipInternalRoot(zip)
  const entryName = internalRoot + GAMEPLAY_CAM_DIR + '/' + fileName
  // Remove any existing entry for this file (regardless of prior path)
  const suffix = (GAMEPLAY_CAM_DIR + '/' + fileName).toLowerCase()
  const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
  if (existing) zip.deleteFile(existing.entryName)
  zip.addFile(entryName, Buffer.from(fileBufferArray))
  zip.writeZip(zipPath)
  return { ok: true }
})

ipcMain.handle('gameplay:removeFromZip', async (_event, zipPath, fileType) => {
  const fileName = GAMEPLAY_FILES[fileType]
  if (!fileName) throw new Error('Unknown file type: ' + fileType)
  const zip = new AdmZip(zipPath)
  const suffix = (GAMEPLAY_CAM_DIR + '/' + fileName).toLowerCase()
  const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
  if (existing) zip.deleteFile(existing.entryName)
  zip.writeZip(zipPath)
  return { ok: true }
})

ipcMain.handle('gameplay:scanRar', async (_event, rarPath) => {
  if (detectArchiveType(rarPath) === 'zip') {
    try {
      const zip = new AdmZip(rarPath)
      const names = zip.getEntries().map((e) => e.entryName.replace(/\\/g, '/').toLowerCase())
      const sfx176 = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES['176']).toLowerCase()
      const sfx261 = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES['261']).toLowerCase()
      return { has176: names.some((n) => n.endsWith(sfx176)), has261: names.some((n) => n.endsWith(sfx261)) }
    } catch (e) { return { has176: false, has261: false, error: e.message } }
  }
  if (findAllExtractors().length === 0) return { has176: false, has261: false, noTool: true }
  try {
    const stdout = await listArchiveWithFallbacks(rarPath)
    const normalized = stdout.toLowerCase().replace(/\\/g, '/')
    const suffix176 = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES['176']).toLowerCase()
    const suffix261 = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES['261']).toLowerCase()
    return {
      has176: normalized.includes(suffix176),
      has261: normalized.includes(suffix261),
    }
  } catch (e) {
    return { has176: false, has261: false, error: e.message }
  }
})

async function rarToZip(rarPath, modifications) {
  const rarDir = path.dirname(rarPath)
  const rarBase = path.basename(rarPath, '.rar')
  const zipPath = path.join(rarDir, rarBase + '.zip')

  // If the file with .rar extension is actually a ZIP, handle it with AdmZip directly
  if (detectArchiveType(rarPath) === 'zip') {
    fs.renameSync(rarPath, zipPath)
    const zip = new AdmZip(zipPath)
    const internalRoot = detectZipInternalRoot(zip)
    for (const [fileType, buf] of Object.entries(modifications.add || {})) {
      const suffix = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES[fileType]).toLowerCase()
      const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
      if (existing) zip.deleteFile(existing.entryName)
      zip.addFile(internalRoot + GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES[fileType], Buffer.from(buf))
    }
    for (const fileType of modifications.remove || []) {
      const suffix = (GAMEPLAY_CAM_DIR + '/' + GAMEPLAY_FILES[fileType]).toLowerCase()
      const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
      if (existing) zip.deleteFile(existing.entryName)
    }
    zip.writeZip(zipPath)
    return { newName: rarBase + '.zip' }
  }

  if (findAllExtractors().length === 0) throw new Error('No extraction tool found. Install 7-Zip or WinRAR.')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cgfs-gcam-'))
  try {
    await extractArchiveWithFallbacks(rarPath, tmpDir)

    const contentRoot = getExtractionRoot(tmpDir)
    const camDir = path.join(contentRoot, GAMEPLAY_CAM_DIR)
    if (!fs.existsSync(camDir)) fs.mkdirSync(camDir, { recursive: true })

    for (const [fileType, buf] of Object.entries(modifications.add || {})) {
      fs.writeFileSync(path.join(camDir, GAMEPLAY_FILES[fileType]), Buffer.from(buf))
    }
    for (const fileType of modifications.remove || []) {
      const target = path.join(camDir, GAMEPLAY_FILES[fileType])
      if (fs.existsSync(target)) fs.unlinkSync(target)
    }

    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    const zip = new AdmZip()
    addDirToZip(zip, tmpDir, '')
    zip.writeZip(zipPath)
    fs.unlinkSync(rarPath)

    return { newName: rarBase + '.zip' }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (_) {}
  }
}

ipcMain.handle('gameplay:writeToRar', async (_event, rarPath, fileType, fileBufferArray) => {
  const result = await rarToZip(rarPath, { add: { [fileType]: fileBufferArray } })
  return { ok: true, convertedToZip: true, newName: result.newName }
})

ipcMain.handle('gameplay:removeFromRar', async (_event, rarPath, fileType) => {
  const result = await rarToZip(rarPath, { remove: [fileType] })
  return { ok: true, convertedToZip: true, newName: result.newName }
})

// ============================================================
// STADIUM ASSETS — ZIP / RAR helpers
// ============================================================
const STADIUM_ASSET_DIRS = {
  gameplay: 'GameplayCamGBD',
  goalpost: 'GoalpostGBD',
}
const STADIUM_ASSET_FILES = {
  gameplay: { '176': 'bcgameplay_176.dat', '261': 'bcgameplay_261.dat' },
  goalpost: {
    goalnet:    'specificgoalnet_0_0.rx3',
    goalpost:   'specificgoalpost_0_0.rx3',
    netsupport: 'specificnetsupportpost_0_0_textures.rx3',
  },
}

ipcMain.handle('stadiumAssets:scanZip', async (_event, zipPath) => {
  try {
    const zip = new AdmZip(zipPath)
    const names = zip.getEntries().map((e) => e.entryName.replace(/\\/g, '/').toLowerCase())
    const sfx = (cat, key) => (STADIUM_ASSET_DIRS[cat] + '/' + STADIUM_ASSET_FILES[cat][key]).toLowerCase()
    return {
      gameplay: {
        has176: names.some((n) => n.endsWith(sfx('gameplay', '176'))),
        has261: names.some((n) => n.endsWith(sfx('gameplay', '261'))),
      },
      goalpost: {
        hasGoalnet:    names.some((n) => n.endsWith(sfx('goalpost', 'goalnet'))),
        hasGoalpost:   names.some((n) => n.endsWith(sfx('goalpost', 'goalpost'))),
        hasNetsupport: names.some((n) => n.endsWith(sfx('goalpost', 'netsupport'))),
      },
    }
  } catch (e) {
    return {
      gameplay: { has176: false, has261: false },
      goalpost: { hasGoalnet: false, hasGoalpost: false, hasNetsupport: false },
      error: e.message,
    }
  }
})

ipcMain.handle('stadiumAssets:scanRar', async (_event, rarPath) => {
  const empty = { gameplay: { has176: false, has261: false }, goalpost: { hasGoalnet: false, hasGoalpost: false, hasNetsupport: false } }
  if (detectArchiveType(rarPath) === 'zip') {
    try {
      const zip = new AdmZip(rarPath)
      const names = zip.getEntries().map((e) => e.entryName.replace(/\\/g, '/').toLowerCase())
      const has = (cat, key) => names.some((n) => n.endsWith((STADIUM_ASSET_DIRS[cat] + '/' + STADIUM_ASSET_FILES[cat][key]).toLowerCase()))
      return {
        gameplay: { has176: has('gameplay', '176'), has261: has('gameplay', '261') },
        goalpost: { hasGoalnet: has('goalpost', 'goalnet'), hasGoalpost: has('goalpost', 'goalpost'), hasNetsupport: has('goalpost', 'netsupport') },
      }
    } catch (e) { return { ...empty, error: e.message } }
  }
  if (findAllExtractors().length === 0) return { ...empty, noTool: true }
  try {
    const stdout = await listArchiveWithFallbacks(rarPath)
    const normalized = stdout.toLowerCase().replace(/\\/g, '/')
    const has = (cat, key) => normalized.includes((STADIUM_ASSET_DIRS[cat] + '/' + STADIUM_ASSET_FILES[cat][key]).toLowerCase())
    return {
      gameplay: { has176: has('gameplay', '176'), has261: has('gameplay', '261') },
      goalpost: { hasGoalnet: has('goalpost', 'goalnet'), hasGoalpost: has('goalpost', 'goalpost'), hasNetsupport: has('goalpost', 'netsupport') },
    }
  } catch (e) { return { ...empty, error: e.message } }
})

ipcMain.handle('stadiumAssets:writeToZip', async (_event, zipPath, category, fileKey, fileBufferArray) => {
  const dir = STADIUM_ASSET_DIRS[category]
  const fileName = STADIUM_ASSET_FILES[category]?.[fileKey]
  if (!dir || !fileName) throw new Error(`Unknown category/key: ${category}/${fileKey}`)
  if (!fs.existsSync(zipPath)) throw new Error(`Archive not found at:\n${zipPath}\n\nCheck that the Game root path in the DB panel matches the folder containing StadiumGBD.`)
  const zip = new AdmZip(zipPath)
  const internalRoot = detectZipInternalRoot(zip)
  const entryName = internalRoot + dir + '/' + fileName
  const suffix = (dir + '/' + fileName).toLowerCase()
  const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
  if (existing) zip.deleteFile(existing.entryName)
  zip.addFile(entryName, Buffer.from(fileBufferArray))
  zip.writeZip(zipPath)
  return { ok: true }
})

ipcMain.handle('stadiumAssets:removeFromZip', async (_event, zipPath, category, fileKey) => {
  const dir = STADIUM_ASSET_DIRS[category]
  const fileName = STADIUM_ASSET_FILES[category]?.[fileKey]
  if (!dir || !fileName) throw new Error(`Unknown category/key: ${category}/${fileKey}`)
  if (!fs.existsSync(zipPath)) throw new Error(`Archive not found at:\n${zipPath}\n\nCheck that the Game root path in the DB panel matches the folder containing StadiumGBD.`)
  const zip = new AdmZip(zipPath)
  const suffix = (dir + '/' + fileName).toLowerCase()
  const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
  if (existing) zip.deleteFile(existing.entryName)
  zip.writeZip(zipPath)
  return { ok: true }
})

async function rarToZipStadiumAssets(rarPath, modifications) {
  const rarDir = path.dirname(rarPath)
  const rarBase = path.basename(rarPath, '.rar')
  const zipPath = path.join(rarDir, rarBase + '.zip')

  if (detectArchiveType(rarPath) === 'zip') {
    fs.renameSync(rarPath, zipPath)
    const zip = new AdmZip(zipPath)
    const internalRoot = detectZipInternalRoot(zip)
    for (const [category, files] of Object.entries(modifications.add || {})) {
      const dir = STADIUM_ASSET_DIRS[category]
      if (!dir) continue
      for (const [fileKey, buf] of Object.entries(files)) {
        const fileName = STADIUM_ASSET_FILES[category]?.[fileKey]
        if (!fileName) continue
        const entryName = internalRoot + dir + '/' + fileName
        const suffix = (dir + '/' + fileName).toLowerCase()
        const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
        if (existing) zip.deleteFile(existing.entryName)
        zip.addFile(entryName, Buffer.from(buf))
      }
    }
    for (const [category, keys] of Object.entries(modifications.remove || {})) {
      const dir = STADIUM_ASSET_DIRS[category]
      if (!dir) continue
      for (const fileKey of keys) {
        const fileName = STADIUM_ASSET_FILES[category]?.[fileKey]
        if (!fileName) continue
        const suffix = (dir + '/' + fileName).toLowerCase()
        const existing = zip.getEntries().find((e) => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith(suffix))
        if (existing) zip.deleteFile(existing.entryName)
      }
    }
    zip.writeZip(zipPath)
    return { newName: rarBase + '.zip' }
  }

  if (findAllExtractors().length === 0) throw new Error('No extraction tool found. Install 7-Zip or WinRAR.')

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cgfs-sa-'))
  try {
    await extractArchiveWithFallbacks(rarPath, tmpDir)
    const contentRoot = getExtractionRoot(tmpDir)

    for (const [category, files] of Object.entries(modifications.add || {})) {
      const dir = STADIUM_ASSET_DIRS[category]
      if (!dir) continue
      const targetDir = path.join(contentRoot, dir)
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })
      for (const [fileKey, buf] of Object.entries(files)) {
        const fileName = STADIUM_ASSET_FILES[category]?.[fileKey]
        if (fileName) fs.writeFileSync(path.join(targetDir, fileName), Buffer.from(buf))
      }
    }
    for (const [category, keys] of Object.entries(modifications.remove || {})) {
      const dir = STADIUM_ASSET_DIRS[category]
      if (!dir) continue
      for (const fileKey of keys) {
        const fileName = STADIUM_ASSET_FILES[category]?.[fileKey]
        if (!fileName) continue
        const target = path.join(contentRoot, dir, fileName)
        if (fs.existsSync(target)) fs.unlinkSync(target)
      }
    }

    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    const zip = new AdmZip()
    addDirToZip(zip, tmpDir, '')
    zip.writeZip(zipPath)
    fs.unlinkSync(rarPath)

    return { newName: rarBase + '.zip' }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (_) {}
  }
}

ipcMain.handle('stadiumAssets:writeToRar', async (_event, rarPath, category, fileKey, fileBufferArray) => {
  const result = await rarToZipStadiumAssets(rarPath, { add: { [category]: { [fileKey]: fileBufferArray } } })
  return { ok: true, convertedToZip: true, newName: result.newName }
})

ipcMain.handle('stadiumAssets:removeFromRar', async (_event, rarPath, category, fileKey) => {
  const result = await rarToZipStadiumAssets(rarPath, { remove: { [category]: [fileKey] } })
  return { ok: true, convertedToZip: true, newName: result.newName }
})

ipcMain.handle('stadiumAssets:convertRarToZip', async (_event, rarPath) => {
  const result = await rarToZipStadiumAssets(rarPath, {})
  return { newName: result.newName }
})

// ============================================================
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
