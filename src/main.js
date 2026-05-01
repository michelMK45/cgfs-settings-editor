import './style.css'

// ============================================================
// STATE
// ============================================================
const GBD_TYPES = {
  stadium: {
    name: 'Stadiums',
    path: 'StadiumGBD',
    section: 'stadium',
    iniSection: 'stadium',
    defaultSuffix: ',4,0,0',
    suffixEditable: true,
    suffixPlaceholder: ',police,pitch,net',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)(,\d+,\d+,\d+)?\s*(?:;.*)?$/,
    suffixColumns: [
      { label: 'Police', placeholder: 'e.g. 4', type: 'spinner', min: 0, max: 9 },
      { label: 'Pitch', placeholder: 'e.g. 0', type: 'spinner', min: 0, max: 9 },
      { label: 'Net', placeholder: 'e.g. 0', type: 'spinner', min: 0, max: 9 },
    ],
  },
  scoreboard: {
    name: 'Scoreboards',
    path: 'ScoreBoardGBD',
    section: 'scoreboard',
    iniSection: 'scoreboard',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
  },
  movies: {
    name: 'Movies',
    path: 'MoviesGBD',
    section: 'movies',
    iniSection: 'movies',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
  },
  tvlogo: {
    name: 'TV Logos',
    path: 'TVLogoGBD',
    section: 'tvlogo',
    iniSection: 'tvlogo',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
  },
  chantsid: {
    name: 'Chants IDs',
    rawOnly: false,
    rawWithPanel: true,
    path: 'FSW/Chants',
    section: 'chantsid',
    iniSection: 'chantsid',
    defaultSuffix: ',0.12,0.15,0.10,0.05,0.15,0.13',
    suffixEditable: true,
    suffixPlaceholder: ',vol,win,lose1,lose2,lose3,goal',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)((?:,[\d.]+)+)?\s*(?:;.*)?$/,
    hint: 'Chants IDs - double-click a folder on the left to insert it in raw mode.',
    suffixColumns: [
      { label: 'Default', placeholder: 'e.g. 0.12' },
      { label: 'Winning', placeholder: 'e.g. 0.15' },
      { label: 'Losing -1', placeholder: 'e.g. 0.10' },
      { label: 'Losing -2', placeholder: 'e.g. 0.05' },
      { label: 'Losing -3 (Protest)', placeholder: 'e.g. 0.15' },
      { label: 'Goal Song', placeholder: 'e.g. 0.13' },
    ],
  },
  stadiumnetname: {
    name: 'Stadium Net Names',
    rawOnly: false,
    rawWithPanel: true,
    path: 'StadiumGBD',
    section: 'stadiumnetname',
    iniSection: 'stadiumnetname',
    defaultSuffix: ',1092494011,1068038976,0,0',
    suffixEditable: true,
    suffixPlaceholder: ',downDeep,highDeep,rig,shape',
    suffixRegex: /^(.+?)=,?([\d,]*)\s*(?:;.*)?$/,
    hint: 'Stadium Net Names - double-click a folder on the left to insert it in raw mode.',
    hasID: false,
    suffixColumns: [
      { label: 'Down Deep', placeholder: 'e.g. 1092494011' },
      { label: 'High Deep', placeholder: 'e.g. 1068038976' },
      { label: 'Rig', placeholder: 'e.g. 0-5', type: 'spinner', min: 0, max: 5 },
      { label: 'Shape', placeholder: '0=Rectangle 1=Triangle', type: 'select', options: [{ label: 'Rectangle', value: '0' }, { label: 'Triangle', value: '1' }] },
    ],
  },
  stadiumnetid: {
    name: 'Stadium Net IDs',
    rawOnly: false,
    path: 'FSW',
    section: 'stadiumnetid',
    iniSection: 'stadiumnetid',
    defaultSuffix: ',1086199011,1087199011,4,0',
    suffixEditable: true,
    suffixPlaceholder: ',downDeep,highDeep,rig,shape',
    suffixRegex: /^(\d+|\?\?\?)=(\d+)((?:,\d+)*)\s*(?:;.*)?$/,
    hint: 'Stadium Net IDs - double-click a folder on the left to insert it in raw mode.',
    suffixColumns: [
      { label: 'Down Deep', placeholder: 'e.g. 1086199011' },
      { label: 'High Deep', placeholder: 'e.g. 1087199011' },
      { label: 'Rig', placeholder: 'e.g. 4', type: 'spinner', min: 0, max: 5 },
      { label: 'Shape', placeholder: '0=Rectangle 1=Triangle', type: 'select', options: [{ label: 'Rectangle', value: '0' }, { label: 'Triangle', value: '1' }] },
    ],
  },
  scoreboardstdname: {
    name: 'Scoreboard Stadium Names',
    rawOnly: false,
    rawWithPanel: true,
    path: 'StadiumGBD',
    section: 'scoreboardstdname',
    iniSection: 'scoreboardstdname',
    defaultSuffix: '',
    suffixEditable: true,
    suffixPlaceholder: 'stadiumName',
    suffixRegex: /^(.+?)=(.+?)\s*(?:,[01])?\s*(?:;.*)?$/,
    hint: 'Scoreboard Stadium Names - the stadium name displayed on scoreboards at match start.',
    hasID: false,
    isScoreboardStdName: true,
    suffixColumns: [
      { label: 'Stadium Name', placeholder: 'Display name for scoreboard' },
    ],
  },
}

const state = {
  rootHandle: null,
  iniHandle: null,
  iniContent: '',
  gbdFolders: {},
  sections: {},
  currentType: 'stadium',
  currentSection: 'stadium',
  rawSection: null,
  viewMode: 'visual',
  scoreboardStdSectionsLinked: true,
  unsaved: false,
  selectedItems: {},
  db: {
    teams: [],
    filteredTeams: [],
    search: '',
    collapsed: true,
    loading: false,
    gameRootPath: '',
  },
}

const isDesktopApp = !!window.electronAPI?.isDesktop
const SCOREBOARD_STD_SECTIONS = ['scoreboardstdname', 'scoreboardstdnamem']

function isScoreboardStdSection(secName) {
  return SCOREBOARD_STD_SECTIONS.includes(secName)
}

function getTypeSections(typeKey) {
  if (typeKey === 'scoreboardstdname') return SCOREBOARD_STD_SECTIONS
  return [GBD_TYPES[typeKey].iniSection]
}

function getDefaultSectionForType(typeKey) {
  return getTypeSections(typeKey)[0]
}

function getLinkedScoreboardStdSection(secName) {
  if (!isScoreboardStdSection(secName)) return null
  return secName === 'scoreboardstdname' ? 'scoreboardstdnamem' : 'scoreboardstdname'
}

function syncLinkedScoreboardSection(sourceSection) {
  if (!state.scoreboardStdSectionsLinked || !isScoreboardStdSection(sourceSection)) return false

  const targetSection = getLinkedScoreboardStdSection(sourceSection)
  if (!targetSection) return false

  const sourceLines = [...(state.sections[sourceSection] || [])]
  const targetLines = state.sections[targetSection] || []
  const targetBefore = targetLines.join('\n')
  const sourceNow = sourceLines.join('\n')

  if (targetBefore === sourceNow) return false

  state.sections[targetSection] = sourceLines
  return true
}

function setDbStatus(message, type = '') {
  const statusEl = document.getElementById('db-status')
  if (!statusEl) return
  statusEl.textContent = message
  statusEl.className = 'panel-db-status' + (type ? ' ' + type : '')
}

function persistDbPanelState() {
  try {
    localStorage.setItem('dbPanelCollapsed', state.db.collapsed ? '1' : '0')
  } catch (e) {
    // ignore storage errors
  }
}

function loadDbPanelState() {
  try {
    const saved = localStorage.getItem('dbPanelCollapsed')
    // Default to collapsed when there is no previous user preference.
    state.db.collapsed = saved === null ? true : saved === '1'
  } catch (e) {
    state.db.collapsed = true
  }
}

function syncDbPanelLayout() {
  const layout = document.querySelector('.main-layout')
  const panel = document.getElementById('panel-db')
  const toggleBtn = document.getElementById('db-toggle')
  if (!layout || !panel || !toggleBtn) return

  layout.classList.toggle('db-collapsed', state.db.collapsed)
  panel.classList.toggle('collapsed', state.db.collapsed)
  toggleBtn.textContent = state.db.collapsed ? '◀DB' : '▶'
  toggleBtn.title = state.db.collapsed ? 'Expand panel' : 'Collapse panel'
  toggleBtn.setAttribute('aria-label', toggleBtn.title)
}

function applyDbFilter() {
  const q = (state.db.search || '').trim().toLowerCase()
  if (!q) {
    state.db.filteredTeams = [...state.db.teams]
    return
  }
  state.db.filteredTeams = state.db.teams.filter((team) => String(team.id).includes(q) || team.name.toLowerCase().includes(q))
}

function getDraggedTeamId(dataTransfer) {
  if (!dataTransfer) return ''
  return dataTransfer.getData('application/x-cgfs-team-id') || dataTransfer.getData('text/plain') || ''
}

function renderDbTeams() {
  const body = document.getElementById('db-teams-body')
  const countEl = document.getElementById('db-teams-count')
  if (!body || !countEl) return

  const rows = state.db.filteredTeams
  countEl.textContent = String(rows.length)
  body.innerHTML = ''

  if (!rows.length) {
    const tr = document.createElement('tr')
    tr.innerHTML = '<td colspan="2" class="db-empty">No teams found.</td>'
    body.appendChild(tr)
    return
  }

  rows.forEach((team) => {
    const tr = document.createElement('tr')
    tr.className = 'db-team-row'
    tr.draggable = true
    tr.title = 'Drag this team ID to an ID field in the editor'
    tr.innerHTML = `<td>${team.id}</td><td title="${team.name}">${team.name}</td>`

    tr.addEventListener('dragstart', (e) => {
      const idText = String(team.id)
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-cgfs-team-id', idText)
      e.dataTransfer.setData('text/plain', idText)
      tr.classList.add('dragging')
    })

    tr.addEventListener('dragend', () => {
      tr.classList.remove('dragging')
    })

    body.appendChild(tr)
  })
}

async function loadDbTeams(explicitRootPath = '') {
  if (!isDesktopApp || !window.electronAPI?.db?.getTeams) {
    setDbStatus('DB panel is available only in Desktop (Electron).', 'err')
    return
  }

  state.db.loading = true
  setDbStatus('Loading teams from FIFA DB...')

  try {
    const result = await window.electronAPI.db.getTeams(explicitRootPath || state.db.gameRootPath || undefined)
    state.db.teams = Array.isArray(result?.teams) ? result.teams : []
    state.db.gameRootPath = result?.gameRootPath || state.db.gameRootPath
    applyDbFilter()
    renderDbTeams()
    setDbStatus('Loaded ' + state.db.teams.length + ' teams from database, drag a team to the ID field in the editor.', 'ok')
  } catch (e) {
    state.db.teams = []
    applyDbFilter()
    renderDbTeams()
    setDbStatus('DB load failed: ' + (e?.message || e), 'err')
  } finally {
    state.db.loading = false
  }
}

async function pickGameRootForDb() {
  if (!isDesktopApp || !window.electronAPI?.pickGameRoot) {
    setDbStatus('Desktop-only feature: use Electron app build.', 'err')
    return
  }

  try {
    const picked = await window.electronAPI.pickGameRoot()
    if (!picked || picked.canceled) return
    state.db.gameRootPath = picked.gameRootPath || ''
    await window.electronAPI.db.setGameRoot(state.db.gameRootPath)
    await loadDbTeams(state.db.gameRootPath)
  } catch (e) {
    setDbStatus('Could not select game root: ' + (e?.message || e), 'err')
  }
}

async function initDbPanel() {
  loadDbPanelState()
  syncDbPanelLayout()

  const toggleBtn = document.getElementById('db-toggle')
  const refreshBtn = document.getElementById('db-refresh')
  const pickRootBtn = document.getElementById('db-pick-root')
  const searchInput = document.getElementById('db-search')

  toggleBtn?.addEventListener('click', () => {
    state.db.collapsed = !state.db.collapsed
    persistDbPanelState()
    syncDbPanelLayout()
  })

  refreshBtn?.addEventListener('click', () => {
    loadDbTeams()
  })

  pickRootBtn?.addEventListener('click', () => {
    pickGameRootForDb()
  })

  searchInput?.addEventListener('input', (e) => {
    state.db.search = e.target.value || ''
    applyDbFilter()
    renderDbTeams()
  })

  if (!isDesktopApp || !window.electronAPI?.db?.clearGameRoot) {
    setDbStatus('DB panel is available only in Desktop (Electron).', 'err')
    return
  }

  try {
    state.db.gameRootPath = ''
    state.db.teams = []
    applyDbFilter()
    renderDbTeams()
    await window.electronAPI.db.clearGameRoot?.()
    setDbStatus('Desktop DB reader ready. Select your FIFA 16 root folder.')
  } catch (e) {
    setDbStatus('Could not initialize DB reader: ' + (e?.message || e), 'err')
  }
}

async function resetDbPanelState(statusMessage = 'DB reset. Select your FIFA 16 root folder for database teams.') {
  state.db.gameRootPath = ''
  state.db.teams = []
  state.db.search = ''

  const searchInput = document.getElementById('db-search')
  if (searchInput) searchInput.value = ''

  applyDbFilter()
  renderDbTeams()
  setDbStatus(statusMessage)

  if (isDesktopApp && window.electronAPI?.db?.clearGameRoot) {
    try {
      await window.electronAPI.db.clearGameRoot()
    } catch (e) {
      // keep UI reset even if IPC cleanup fails
    }
  }
}

// ============================================================
// LOCALSTORAGE + INDEXEDDB PERSISTENCE
// ============================================================
function saveLastPath(pathString) {
  try {
    localStorage.setItem('lastGamePath', pathString)
  } catch (e) {
    console.warn('Could not save path to localStorage:', e)
  }
}

function getLastPath() {
  try {
    return localStorage.getItem('lastGamePath')
  } catch (e) {
    console.warn('Could not read path from localStorage:', e)
    return null
  }
}

function clearLastPath() {
  try {
    localStorage.removeItem('lastGamePath')
  } catch (e) {
    console.warn('Could not clear path from localStorage:', e)
  }
}

let db = null
function initIndexedDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open('CgfsEditorDB', 1)
    req.onerror = () => {
      console.warn('Could not open IndexedDB')
      resolve(null)
    }
    req.onupgradeneeded = (e) => {
      const database = e.target.result
      if (!database.objectStoreNames.contains('handles')) {
        database.createObjectStore('handles')
      }
    }
    req.onsuccess = () => {
      db = req.result
      resolve(db)
    }
  })
}

async function saveDirectoryHandle(handle) {
  if (!db) return false
  return new Promise((resolve) => {
    const tx = db.transaction('handles', 'readwrite')
    const store = tx.objectStore('handles')
    const req = store.put(handle, 'lastRootHandle')
    req.onsuccess = () => resolve(true)
    req.onerror = () => {
      console.warn('Could not save handle to IndexedDB')
      resolve(false)
    }
  })
}

async function getDirectoryHandle() {
  if (!db) return null
  return new Promise((resolve) => {
    const tx = db.transaction('handles', 'readonly')
    const store = tx.objectStore('handles')
    const req = store.get('lastRootHandle')
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => resolve(null)
  })
}

async function requestHandlePermission(handle) {
  if (!handle) return null
  try {
    const perm = await handle.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return handle
    const requested = await handle.requestPermission({ mode: 'readwrite' })
    return requested === 'granted' ? handle : null
  } catch (e) {
    return null
  }
}

function showLastPathSuggestion() {
  const lastPath = getLastPath()
  const suggestionEl = document.getElementById('last-path-suggestion')
  if (!lastPath || !suggestionEl) return

  suggestionEl.classList.add('show')
  document.getElementById('suggestion-path-text').textContent = lastPath
}

// ============================================================
// UTILS
// ============================================================
function toast(msg, type = '') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = 'show ' + type
  clearTimeout(el._t)
  el._t = setTimeout(() => {
    el.className = ''
  }, 2800)
}

function setUnsaved(val) {
  state.unsaved = val
  document.getElementById('unsaved-dot').classList.toggle('show', val)
}

function updateStatusBar(text, ok = false) {
  document.getElementById('status-text').textContent = text
  document.getElementById('status-dot').className = 'status-dot' + (ok ? ' ok' : '')
}

function normalizeStadiumItemName(name) {
  return name.replace(/\.(zip|rar)$/i, '')
}

function usesPackedStadiumItems(typeKey) {
  return typeKey === 'stadium' || typeKey === 'scoreboardstdname' || typeKey === 'stadiumnetname'
}

function getComparableItemName(typeKey, itemName) {
  if (usesPackedStadiumItems(typeKey)) {
    return normalizeStadiumItemName(itemName)
  }
  return itemName
}

// ============================================================
// SETUP / PATH UI
// ============================================================
document.getElementById('root-path').addEventListener('input', () => {
  updatePreviews()
  const pathValue = document.getElementById('root-path').value.trim()
  if (pathValue && pathValue.length > 2) {
    saveLastPath(pathValue)
  }
})

function updatePreviews() {
  const root = document.getElementById('root-path').value.trim().replace(/[/\\]+$/, '')
  document.getElementById('preview-ini').textContent = root ? root + '\\FSW\\settings.ini' : '- not set -'
  document.getElementById('preview-stadiums').textContent = root ? root + '\\StadiumGBD' : '- not set -'
}
updatePreviews()

document.getElementById('browse-root').addEventListener('click', async () => {
  if (!window.showDirectoryPicker) {
    toast('File System Access API not supported. Please use Chrome or Edge.', 'error')
    return
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    state.rootHandle = handle
    document.getElementById('root-path').value = handle.name
    document.getElementById('root-path').classList.add('ok')
    document.getElementById('root-status').textContent = 'Folder selected: ' + handle.name
    document.getElementById('root-status').className = 'path-status ok'
    updatePreviews()
    saveLastPath(handle.name)
    await saveDirectoryHandle(handle)
    await resetDbPanelState('Game folder changed. Select DB root again to load teams.')
    toast('Root folder selected: ' + handle.name, 'success')
  } catch (e) {
    if (e.name !== 'AbortError') toast('Could not open folder: ' + e.message, 'error')
  }
})

document.getElementById('load-btn').addEventListener('click', async () => {
  if (state.rootHandle) {
    await loadFromHandle(state.rootHandle)
  } else {
    toast('Please select a folder first using the Browse button', 'error')
  }
})

async function loadFromHandle(rootHandle) {
  try {
    let fswDir
    let iniHandle
    try {
      fswDir = await rootHandle.getDirectoryHandle('FSW')
      iniHandle = await fswDir.getFileHandle('settings.ini')
    } catch (e) {
      toast('Could not find FSW\\settings.ini in the selected folder', 'error')
      return
    }

    const file = await iniHandle.getFile()
    state.iniContent = await file.text()
    state.iniHandle = iniHandle
    parseIni(state.iniContent)

    state.gbdFolders = {}
    let totalLoaded = 0

    async function loadFoldersRecursive(dir, prefix = '') {
      const items = []
      try {
        for await (const entry of dir.values()) {
          if (entry.kind === 'directory') {
            const fullPath = prefix ? prefix + '/' + entry.name : entry.name
            const subfolder = await dir.getDirectoryHandle(entry.name)
            const subItems = await loadFoldersRecursive(subfolder, fullPath)
            if (subItems.length === 0) {
              items.push(fullPath)
            } else {
              items.push(...subItems)
            }
          }
        }
      } catch (e) {
        // ignore read errors inside subfolders
      }
      return items
    }

    for (const [typeKey, typeConfig] of Object.entries(GBD_TYPES)) {
      try {
        const pathParts = typeConfig.path.split('/')
        let dir = rootHandle
        for (const part of pathParts) {
          dir = await dir.getDirectoryHandle(part)
        }

        let folders = []
        if (typeKey === 'chantsid' || typeKey === 'stadiumnetid') {
          folders = await loadFoldersRecursive(dir)
        } else {
          for await (const entry of dir.values()) {
            if (entry.kind === 'directory') {
              folders.push(entry.name)
              continue
            }
            if (usesPackedStadiumItems(typeKey) && entry.kind === 'file' && /\.(zip|rar)$/i.test(entry.name)) {
              folders.push(entry.name)
            }
          }
        }
        folders.sort()
        state.gbdFolders[typeKey] = folders
        totalLoaded += folders.length
      } catch (e) {
        state.gbdFolders[typeKey] = []
      }
    }

    for (const typeKey of Object.keys(GBD_TYPES)) {
      state.selectedItems[typeKey] = new Set()
    }

    showApp()
    renderAll()
    toast('Loaded ' + totalLoaded + ' items - settings.ini ready', 'success')
  } catch (e) {
    toast('Error loading: ' + e.message, 'error')
    console.error(e)
  }
}

function showApp() {
  document.getElementById('setup-screen').style.display = 'none'
  document.getElementById('app-screen').classList.add('visible')
  updateStatusBar(state.rootHandle ? 'Loaded: ' + state.rootHandle.name : 'Demo mode', true)
  document.getElementById('footer-file').textContent = (state.rootHandle?.name || 'Unknown') + '\\FSW\\settings.ini'
}

document.getElementById('btn-reset-paths').addEventListener('click', () => {
  if (state.unsaved && !confirm('You have unsaved changes. Go back anyway?')) return
  document.getElementById('app-screen').classList.remove('visible')
  document.getElementById('setup-screen').style.display = 'flex'
  updateStatusBar('No file loaded', false)
})

// ============================================================
// INI PARSER
// ============================================================
function parseIni(content) {
  const lines = content.split('\n')
  const sections = {}
  let current = '__header__'
  sections[current] = []

  for (const line of lines) {
    const m = line.match(/^\[(.+?)\]/)
    if (m) {
      current = m[1].toLowerCase()
      if (!sections[current]) sections[current] = []
    } else {
      sections[current].push(line)
    }
  }
  state.sections = sections
}

function buildIni() {
  let out = ''
  if (state.sections.__header__) {
    out += state.sections.__header__.join('\n')
  }
  const sectionOrder = ['scoreboard', 'scoreboardstdname', 'scoreboardstdnamem', 'tvlogo', 'movies', 'teammovies', 'stadiumnetid', 'stadiumnetname', 'chantsid', 'modules', 'stadium']
  const written = new Set()
  for (const sec of sectionOrder) {
    if (state.sections[sec] !== undefined) {
      out += '\n[' + getSectionName(sec) + ']\n'
      out += state.sections[sec].join('\n')
      written.add(sec)
    }
  }
  for (const [sec, lines] of Object.entries(state.sections)) {
    if (sec === '__header__' || written.has(sec)) continue
    out += '\n[' + getSectionName(sec) + ']\n'
    out += lines.join('\n')
  }
  return out
}

function getSectionName(sec) {
  const map = {
    tvlogo: 'TVLogo',
    stadiumnetid: 'stadiumnetid',
    stadiumnetname: 'stadiumnetname',
    chantsid: 'chantsid',
    movies: 'movies',
    scoreboard: 'scoreboard',
    scoreboardstdname: 'scoreboardstdname',
    scoreboardstdnamem: 'scoreboardstdnamem',
    stadium: 'stadium',
    teammovies: 'TeamMovies',
    modules: 'modules',
  }
  return map[sec] || sec
}

function getSectionLines(sec) {
  return state.sections[sec] || []
}

function getSectionConfig(secName) {
  if (secName === 'scoreboardstdnamem') {
    return GBD_TYPES.scoreboardstdname
  }
  return (
    Object.values(GBD_TYPES).find((t) => t.iniSection === secName) || {
      suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
      defaultSuffix: '',
      suffixEditable: false,
    }
  )
}

function parseSection(secName) {
  const lines = getSectionLines(secName)
  const config = getSectionConfig(secName)
  const hasID = config.hasID !== false
  const entries = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      entries.push({ type: 'comment', raw: line })
      continue
    }
    if (!trimmed.includes('=')) {
      entries.push({ type: 'label', raw: line })
      continue
    }
    const m = trimmed.match(config.suffixRegex)
    if (m) {
      const fullVal = trimmed.slice(trimmed.indexOf('=') + 1).replace(/\s*;.*$/, '').trim()

      let folder
      let suffix
      let entryComment = ''

      if (secName === 'stadiumnetid') {
        folder = ''
        suffix = ',' + m[2] + (m[3] || '')
        const commentMatch = trimmed.match(/;\s*(.+)$/)
        if (commentMatch) entryComment = commentMatch[1].trim()
      } else if (secName === 'stadiumnetname') {
        folder = ''
        const raw2 = m[2] || ''
        suffix = raw2.startsWith(',') ? raw2 : raw2 ? ',' + raw2 : config.defaultSuffix
      } else if (config.isScoreboardStdName) {
        folder = m[1]
        suffix = (m[2] || '').replace(/,[01]$/, '')
      } else {
        const suffixMatch = fullVal.match(/(,[\d.,]+)$/)
        suffix = suffixMatch ? suffixMatch[1] : ''
        folder = suffix ? fullVal.slice(0, fullVal.length - suffix.length).trim() : fullVal
      }

      entries.push({
        type: 'entry',
        id: hasID ? m[1] : '',
        folder: hasID ? folder : m[1],
        suffix: suffix || config.defaultSuffix,
        comment: entryComment,
        raw: line,
      })
    } else if (trimmed) {
      entries.push({ type: 'raw', raw: line })
    }
  }
  return entries
}

function entriesToLines(entries, secName = null) {
  const config = secName ? getSectionConfig(secName) : null
  const hasID = !secName || config.hasID !== false
  return entries.map((e) => {
    if (e.type === 'entry') {
      if (config?.isScoreboardStdName) {
        return e.folder + '=' + e.suffix
      }
      if (hasID) {
        if (secName === 'stadiumnetid') {
          const suffixToWrite = e.suffix.startsWith(',') ? e.suffix.slice(1) : e.suffix
          const commentPart = e.comment ? ' ; ' + e.comment : ''
          return e.id + '=' + suffixToWrite + commentPart
        }
        return e.id + '=' + e.folder + e.suffix
      }
      const suffixToWrite = e.suffix.startsWith(',') ? e.suffix.slice(1) : e.suffix
      return e.folder + '=' + suffixToWrite
    }
    return e.raw
  })
}

// ============================================================
// RENDER
// ============================================================
function renderAll() {
  renderGBDTypeTabs()
  renderItemList(state.currentType)
  renderEditor()
  updateCounts()
}

function renderGBDTypeTabs() {
  const container = document.querySelector('.gbd-type-tabs > div')
  container.innerHTML = ''

  for (const [typeKey, typeConfig] of Object.entries(GBD_TYPES)) {
    const tab = document.createElement('button')
    tab.className = 'btn' + (typeKey === state.currentType ? ' active' : '')
    tab.style.display = 'flex'
    tab.style.alignItems = 'center'
    tab.style.gap = '4px'
    if (typeKey === state.currentType) {
      tab.style.color = 'var(--accent)'
      tab.style.borderColor = 'var(--accent)'
    }
    tab.innerHTML = `${typeConfig.name} <span style="font-size:9px;color:var(--text3);">(${state.gbdFolders[typeKey]?.length || 0})</span>`

    tab.addEventListener('click', () => {
      state.currentType = typeKey
      state.currentSection = getDefaultSectionForType(typeKey)
      state.viewMode = 'visual'
      renderAll()
      updateEditorHint(typeKey)
    })

    container.appendChild(tab)
  }

  const modTab = document.createElement('button')
  modTab.className = 'btn' + (state.currentType === 'modules' ? ' active' : '')
  modTab.style.display = 'flex'
  modTab.style.alignItems = 'center'
  modTab.style.gap = '4px'
  if (state.currentType === 'modules') {
    modTab.style.color = 'var(--accent)'
    modTab.style.borderColor = 'var(--accent)'
  }
  const modCount = (state.sections.modules || []).filter((l) => l.trim() && !l.trim().startsWith(';') && l.includes('=')).length
  modTab.innerHTML = `Modules <span style="font-size:9px;color:var(--text3);">(${modCount})</span>`
  modTab.addEventListener('click', () => {
    state.currentType = 'modules'
    state.currentSection = 'modules'
    state.viewMode = 'visual'
    renderAll()
  })
  container.appendChild(modTab)
}

function updateEditorHint(typeKey) {
  const cfg = GBD_TYPES[typeKey]
  const hints = {
    stadium: 'Add stadium folders here. Set the Team ID for each entry.',
    scoreboard: 'Add scoreboard folders. Map to scoreboard IDs.',
    scoreboardstdname: 'Scoreboard stadium names: use [scoreboardstdname] and [scoreboardstdnamem]. Enable link to mirror edits in both sections.',
    movies: 'Add movie folders for intro/outro sequences.',
    tvlogo: 'Add TV logo folders.',
    stadiumnetid: 'Editor for stadium net IDs. Format: stadiumID=downDeep,highDeep,rig,shape',
    chantsid: cfg?.hint || 'Raw editor for chant/goal song IDs.',
    stadiumnetname: cfg?.hint || 'Raw editor for stadium net names.',
  }
  document.getElementById('editor-hint').textContent = hints[typeKey] || 'Edit entries for this section.'
}

function getAddedItems(typeKey, sectionOverride = null) {
  const iniSec = sectionOverride || GBD_TYPES[typeKey].iniSection
  const lines = getSectionLines(iniSec)
  const cfg = getSectionConfig(iniSec)
  const hasID = cfg.hasID !== false
  const added = new Set()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    let folderName
    if (hasID) {
      const match = trimmed.match(/^(?:\d+|\?\?\?)=([^,;]+)/)
      if (match && match[1]) {
        folderName = match[1].trim()
        added.add(folderName)
        if (usesPackedStadiumItems(typeKey)) {
          const normalized = normalizeStadiumItemName(folderName)
          added.add(normalized)
          added.add(normalized + '.zip')
          added.add(normalized + '.rar')
        }
      }
    } else {
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex > 0) {
        folderName = trimmed.substring(0, eqIndex).trim()
        added.add(folderName)
        if (usesPackedStadiumItems(typeKey)) {
          const normalized = normalizeStadiumItemName(folderName)
          added.add(normalized)
          added.add(normalized + '.zip')
          added.add(normalized + '.rar')
        }
      }
    }
  }

  return added
}

function renderItemList(typeKey) {
  if (typeKey === 'modules') return
  const typeConfig = GBD_TYPES[typeKey]
  const items = state.gbdFolders[typeKey] || []
  const added = getAddedItems(typeKey)

  if (typeKey === 'chantsid' || typeKey === 'stadiumnetid') {
    renderItemListTree(typeKey, items, added)
    return
  }

  const search = document.getElementById('search-items').value.toLowerCase()
  const activeFilter = document.querySelector('.filter-tab.active')?.dataset.filter || 'ALL'

  const addedCount = added.size
  document.getElementById('left-panel-title').textContent = typeConfig.name + ' folder' + (addedCount > 0 ? ` (${addedCount} added)` : '')

  const prefixes = new Set(['ALL'])
  items.forEach((item) => {
    const p = item.split(' - ')[0].trim()
    if (p) prefixes.add(p)
  })

  const tabsEl = document.getElementById('filter-tabs')
  const currentTabs = Array.from(tabsEl.querySelectorAll('.filter-tab')).map((t) => t.dataset.filter)
  const newPrefixes = Array.from(prefixes).sort((a, b) => (a === 'ALL' ? -1 : b === 'ALL' ? 1 : a.localeCompare(b)))

  const prevType = tabsEl.dataset.builtForType
  const needsRebuild = prevType !== typeKey || JSON.stringify(currentTabs) !== JSON.stringify(newPrefixes)
  const effectiveFilter = prevType !== typeKey ? 'ALL' : activeFilter

  if (needsRebuild) {
    tabsEl.innerHTML = ''
    tabsEl.dataset.builtForType = typeKey
    newPrefixes.forEach((p) => {
      const btn = document.createElement('button')
      btn.className = 'filter-tab' + (p === effectiveFilter ? ' active' : '')
      btn.dataset.filter = p
      btn.textContent = p
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'))
        btn.classList.add('active')
        renderItemList(typeKey)
      })
      tabsEl.appendChild(btn)
    })
  }

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.toLowerCase().includes(search)
    const matchFilter = activeFilter === 'ALL' || item.startsWith(activeFilter + ' -') || item.startsWith(activeFilter + '-')
    return matchSearch && matchFilter
  })

  document.getElementById('item-count').textContent = filtered.length
  document.getElementById('footer-stadiums-loaded').textContent = items.length + ' folders'

  const list = document.getElementById('item-list')
  list.innerHTML = ''

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No items match your search.</p></div>'
    return
  }

  filtered.forEach((item) => {
    const isAdded = added.has(item)
    const isSelected = state.selectedItems[typeKey].has(item)

    const itemEl = document.createElement('div')
    itemEl.className = 'item' + (isAdded ? ' added' : '') + (isSelected ? ' selected' : '')
    itemEl.dataset.item = item

    itemEl.innerHTML = `
      <span class="item-name" title="${item}">${item}</span>
      ${isAdded ? '<div class="check-icon">✓</div>' : ''}
    `

    itemEl.addEventListener('click', (e) => {
      if (isAdded) return
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        state.selectedItems[typeKey].has(item) ? state.selectedItems[typeKey].delete(item) : state.selectedItems[typeKey].add(item)
      } else {
        state.selectedItems[typeKey].clear()
        state.selectedItems[typeKey].add(item)
      }
      renderItemList(typeKey)
    })

    itemEl.addEventListener('dblclick', () => {
      if (isAdded) return
      const cfg = GBD_TYPES[typeKey]
      if (state.viewMode === 'visual') {
        addItemsToSection(typeKey, [item])
      } else if (cfg.rawWithPanel) {
        insertTextAtRawCursor(item)
      } else if (!isAdded) {
        addItemsToSection(typeKey, [item])
      }
    })

    list.appendChild(itemEl)
  })
}

function renderItemListTree(typeKey, items, added) {
  const typeConfig = GBD_TYPES[typeKey]
  const search = document.getElementById('search-items').value.toLowerCase()

  const addedCount = added.size
  document.getElementById('left-panel-title').textContent = typeConfig.name + ' folder' + (addedCount > 0 ? ` (${addedCount} added)` : '')

  document.getElementById('filter-tabs').innerHTML = ''
  document.getElementById('item-count').textContent = items.length
  document.getElementById('footer-stadiums-loaded').textContent = items.length + ' items'

  const list = document.getElementById('item-list')
  list.innerHTML = ''

  const tree = {}
  items.forEach((item) => {
    const parts = item.split('/')
    let current = tree
    for (let i = 0; i < parts.length; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {}
      }
      current = current[parts[i]]
    }
    current.__fullPath = item
  })

  const nodeHasMatch = (node, nodeFullPath) => {
    if (!search) return true
    if (nodeFullPath.toLowerCase().includes(search)) return true
    return Object.keys(node).some((k) => {
      if (k === '__fullPath') return false
      const childFullPath = nodeFullPath ? nodeFullPath + '/' + k : k
      const childNode = node[k]
      return nodeHasMatch(childNode, childFullPath)
    })
  }

  const renderNode = (nodeTree, depth = 0, parentPath = '', targetList = null) => {
    if (!targetList) targetList = list

    const keys = Object.keys(nodeTree)
      .filter((k) => k !== '__fullPath')
      .sort()

    keys.forEach((key) => {
      const node = nodeTree[key]
      const hasChildren = Object.keys(node).some((k) => k !== '__fullPath')
      const isLeaf = !hasChildren
      const currentPath = parentPath ? parentPath + '/' + key : key
      const fullPath = isLeaf ? node.__fullPath : currentPath

      if (!nodeHasMatch(node, currentPath)) {
        return
      }

      const isAdded = added.has(fullPath)
      const isSelected = state.selectedItems[typeKey].has(fullPath)

      if (isLeaf) {
        const itemEl = document.createElement('div')
        itemEl.className = 'item tree-item' + (isAdded ? ' added' : '') + (isSelected ? ' selected' : '')
        itemEl.style.marginLeft = depth * 16 + 'px'
        itemEl.dataset.item = fullPath

        itemEl.innerHTML = `
              <span class="item-name" title="${fullPath}">${key}</span>
              ${isAdded ? '<div class="check-icon">✓</div>' : ''}
            `

        itemEl.addEventListener('click', (e) => {
          e.stopPropagation()
          if (isAdded) return
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            state.selectedItems[typeKey].has(fullPath) ? state.selectedItems[typeKey].delete(fullPath) : state.selectedItems[typeKey].add(fullPath)
          } else {
            state.selectedItems[typeKey].clear()
            state.selectedItems[typeKey].add(fullPath)
          }
          document.querySelectorAll('.tree-item').forEach((el) => {
            el.classList.remove('selected')
          })
          if (state.selectedItems[typeKey].has(fullPath)) {
            itemEl.classList.add('selected')
          }
        })

        itemEl.addEventListener('dblclick', () => {
          const cfg = GBD_TYPES[typeKey]
          if (isAdded) return
          if (state.viewMode === 'visual') {
            addItemsToSection(typeKey, [fullPath])
          } else if (cfg.rawWithPanel) {
            insertTextAtRawCursor(fullPath)
          }
        })

        targetList.appendChild(itemEl)
      } else {
        const folderEl = document.createElement('div')
        folderEl.className = 'tree-folder'
        folderEl.style.marginLeft = depth * 16 + 'px'
        folderEl.innerHTML = `
              <span class="tree-toggle">▼</span>
              <span class="tree-folder-name">${key}</span>
            `

        const childrenEl = document.createElement('div')
        childrenEl.className = 'tree-children'
        childrenEl.style.display = 'none'

        folderEl.addEventListener('click', (e) => {
          e.stopPropagation()
          const isHidden = childrenEl.style.display === 'none'
          childrenEl.style.display = isHidden ? '' : 'none'
          const toggle = folderEl.querySelector('.tree-toggle')
          toggle.textContent = isHidden ? '▼' : '▶'
        })

        targetList.appendChild(folderEl)
        targetList.appendChild(childrenEl)

        renderNode(node, depth + 1, currentPath, childrenEl)

        folderEl.querySelector('.tree-toggle').textContent = '▶'
      }
    })
  }

  renderNode(tree)
}

function renderEditor() {
  if (state.currentType === 'modules') {
    renderModulesEditor()
    return
  }

  const typeConfig = GBD_TYPES[state.currentType]
  const sectionsForType = getTypeSections(state.currentType)
  if (!sectionsForType.includes(state.currentSection)) {
    state.currentSection = sectionsForType[0]
  }
  const iniSec = state.currentSection

  const isRawOnly = !!typeConfig.rawOnly
  const hidePanel = state.currentType === 'stadiumnetid'
  const hasPanel = !hidePanel && (!isRawOnly || !!typeConfig.rawWithPanel)
  document.querySelector('.panel-left').style.display = hasPanel ? '' : 'none'
  document.getElementById('btn-visual-view').style.display = isRawOnly ? 'none' : ''
  document.getElementById('btn-raw-view').style.display = isRawOnly ? 'none' : ''
  document.getElementById('btn-full-raw').style.display = isRawOnly ? 'none' : ''
  document.getElementById('btn-add-selected').style.display = hasPanel ? '' : 'none'
  document.getElementById('btn-add-all').style.display = hasPanel ? '' : 'none'
  document.getElementById('btn-add-entry').style.display = hidePanel ? '' : 'none'
  const hideSortBtn = isRawOnly || state.currentType === 'stadiumnetname' || state.currentType === 'scoreboardstdname'
  document.getElementById('btn-sort').style.display = hideSortBtn ? 'none' : ''
  const layout = document.querySelector('.main-layout')
  if (layout) {
    layout.classList.toggle('left-hidden', !hasPanel)
  }

  const tabsContainer = document.getElementById('section-tabs')
  tabsContainer.innerHTML = ''
  const createSectionTab = (sectionName) => {
    const tab = document.createElement('div')
    tab.className = 'section-tab' + (sectionName === state.currentSection ? ' active' : '')
    tab.dataset.section = sectionName
    const count = parseSection(sectionName).filter((e) => e.type === 'entry').length
    tab.innerHTML = `[${sectionName}] <span class="tab-count">${count}</span>`
    tab.addEventListener('click', () => {
      if (state.currentSection === sectionName) return
      state.currentSection = sectionName
      renderEditor()
    })
    tabsContainer.appendChild(tab)
  }

  if (state.currentType === 'scoreboardstdname') {
    createSectionTab('scoreboardstdname')

    const linkBtn = document.createElement('button')
    linkBtn.type = 'button'
    linkBtn.className = 'section-tab-link-toggle' + (state.scoreboardStdSectionsLinked ? ' linked' : '')
    linkBtn.innerHTML = state.scoreboardStdSectionsLinked
      ? '<i class="fa-solid fa-link" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-link-slash" aria-hidden="true"></i>'
    linkBtn.setAttribute('aria-label', state.scoreboardStdSectionsLinked ? 'Linked tabs' : 'Unlinked tabs')
    linkBtn.title = state.scoreboardStdSectionsLinked
      ? 'Unlink tabs: each section can be edited independently.'
      : 'Link tabs: changes in one section are mirrored to the other.'
    linkBtn.addEventListener('click', () => {
      state.scoreboardStdSectionsLinked = !state.scoreboardStdSectionsLinked
      if (state.scoreboardStdSectionsLinked) {
        const changed = syncLinkedScoreboardSection(state.currentSection)
        if (changed) {
          setUnsaved(true)
          toast('Tabs linked. Current section copied to the other tab.', 'success')
        } else {
          toast('Tabs linked.', 'success')
        }
      } else {
        toast('Tabs unlinked.', 'info')
      }
      renderEditor()
    })
    tabsContainer.appendChild(linkBtn)

    createSectionTab('scoreboardstdnamem')
  } else {
    createSectionTab(iniSec)
  }

  if (isRawOnly) {
    state.viewMode = 'raw'
  } else if (!isRawOnly && state.viewMode === 'full-raw') {
    // keep full-raw mode
  } else if (!isRawOnly) {
    state.viewMode = 'visual'
  }

  syncViewButtons()

  if (isRawOnly || state.viewMode === 'raw') {
    renderRaw(iniSec)
  } else if (state.viewMode === 'full-raw') {
    renderRaw(null)
  } else {
    renderSectionVisual(iniSec)
  }
}

function renderSectionVisual(secName) {
  document.getElementById('raw-editor').classList.remove('visible')
  const editorEl = document.getElementById('item-editor')
  editorEl.style.display = 'flex'
  editorEl.style.flexDirection = 'column'
  editorEl.style.overflow = 'auto'

  const entries = parseSection(secName)
  const dataEntries = entries.filter((e) => e.type === 'entry')

  document.getElementById('footer-entries').textContent = dataEntries.length + ' entries'

  if (dataEntries.length === 0) {
    editorEl.innerHTML = '<div class="empty-state"><p>No entries yet.<br>Double-click an item on the left or use <strong>Add Selected</strong>.</p></div>'
    return
  }

  editorEl.innerHTML = ''

  const secConfig = getSectionConfig(secName)
  const hasID = secConfig.hasID !== false
  const hasSuffixColumns = !!secConfig.suffixColumns
  const hideFolder = secName === 'stadiumnetid'
  const isScoreboardStdName = !!secConfig.isScoreboardStdName

  let cols
  if (hasSuffixColumns) {
    const numSuffixCols = secConfig.suffixColumns.length
    const suffixWidth = numSuffixCols > 4 ? '90px' : numSuffixCols === 2 ? '150px' : '120px'
    const suffixCols = Array(numSuffixCols).fill(suffixWidth).join(' ')

    if (hideFolder) {
      cols = `75px ${suffixCols} 1fr 24px`
    } else if (isScoreboardStdName) {
        cols = '1fr 1fr 24px'
    } else if (hasID) {
      cols = `75px 1fr ${suffixCols} 24px`
    } else {
      cols = `1fr ${suffixCols} 24px`
    }
  } else {
    cols = hasID ? (secConfig.suffixEditable ? '70px 1fr 160px 24px' : '70px 1fr 24px') : secConfig.suffixEditable ? '1fr 160px 24px' : '1fr 24px'
  }

  const header = document.createElement('div')
  header.style.cssText = `display:grid;grid-template-columns:${cols};gap:6px;padding:4px 0 8px;border-bottom:1px solid var(--border);margin-bottom:4px;`

  let headerHTML = ''
  if (hasID) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">ID</span>'
  }
  if (isScoreboardStdName) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Stadium Folder</span>'
  } else if (!hideFolder) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Name</span>'
  }

  if (hasSuffixColumns) {
    secConfig.suffixColumns.forEach((col) => {
      headerHTML += `<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">${col.label}</span>`
    })
  } else if (secConfig.suffixEditable) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Suffix</span>'
  }
  if (hideFolder) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Comment</span>'
  }
  headerHTML += '<span></span>'

  header.innerHTML = headerHTML
  editorEl.appendChild(header)

  let visualIdx = 0
  entries.forEach((entry) => {
    if (entry.type === 'comment' || entry.type === 'raw' || entry.type === 'label') return
    const myVisualIdx = visualIdx++

    const row = document.createElement('div')
    row.className = 'entry-row'
    row.style.gridTemplateColumns = cols
    row.dataset.idx = myVisualIdx
    row.dataset.section = secName

    let idInput = null
    if (hasID) {
      const idHasValue = entry.id && entry.id !== '???'
      idInput = document.createElement('input')
      idInput.type = 'text'
      idInput.className = 'entry-id ' + (idHasValue ? 'has-id' : 'no-id')
      idInput.value = idHasValue ? entry.id : ''
      idInput.placeholder = 'ID'

      const updateIdClass = () => {
        idInput.className = 'entry-id ' + (idInput.value.trim() ? 'has-id' : 'no-id')
      }

      idInput.addEventListener('input', updateIdClass)
      idInput.addEventListener('change', () => {
        updateIdClass()
        let sv = ''
        if (hasSuffixColumns) {
          sv = ',' + suffixInputs.map((inp) => inp.value.trim()).join(',')
        } else if (suffixInput) {
          sv = suffixInput.value.trim()
        } else {
          sv = entry.suffix
        }
        const currentComment = commentInput ? commentInput.value.trim() : undefined
        updateEntryLine(secName, myVisualIdx, idInput.value.trim(), sv, currentComment)
      })

      idInput.addEventListener('dragover', (e) => {
        const droppedId = getDraggedTeamId(e.dataTransfer)
        if (!droppedId) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        idInput.classList.add('drag-over')
      })

      idInput.addEventListener('dragleave', () => {
        idInput.classList.remove('drag-over')
      })

      idInput.addEventListener('drop', (e) => {
        e.preventDefault()
        idInput.classList.remove('drag-over')
        const droppedId = getDraggedTeamId(e.dataTransfer).trim()
        if (!/^\d+$/.test(droppedId)) {
          toast('Dropped value is not a valid numeric ID.', 'error')
          return
        }

        idInput.value = droppedId
        updateIdClass()
        idInput.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }

    let folderEl = null
    if (!hideFolder || isScoreboardStdName) {
      folderEl = document.createElement('div')
      folderEl.className = 'entry-folder'
      let folderDisplay = entry.folder
      if (entry.folder.includes('/')) {
        folderDisplay = entry.folder.split('/').join(' · ')
      } else if (entry.folder.includes(' - ')) {
        const fparts = entry.folder.split(' - ')
        folderDisplay = '<span class="entry-folder-prefix">' + fparts[0] + '</span> · ' + fparts.slice(1).join(' - ')
      }
      folderEl.innerHTML = folderDisplay
      folderEl.title = entry.folder
      if (isScoreboardStdName) {
        folderEl.style.whiteSpace = 'nowrap'
        folderEl.style.overflow = 'hidden'
        folderEl.style.textOverflow = 'ellipsis'
        folderEl.style.minWidth = '0'
      }
    }

    let suffixInput = null
    let suffixInputs = []
    let commentInput = null

    if (secConfig.suffixEditable) {
      if (hasSuffixColumns) {
        const suffixStr = entry.suffix || secConfig.defaultSuffix

        let suffixParts
        if (secConfig.isScoreboardStdName) {
          suffixParts = [suffixStr]
        } else {
          suffixParts = suffixStr.split(',').filter((_, i) => i > 0)
        }

        secConfig.suffixColumns.forEach((col, idx) => {
          let control

          if (col.type === 'spinner') {
            control = document.createElement('input')
            control.type = 'number'
            control.className = 'entry-suffix-input'
            control.value = suffixParts[idx] || ''
            control.min = col.min
            control.max = col.max
            control.placeholder = col.placeholder
          } else if (col.type === 'select') {
            control = document.createElement('select')
            control.className = 'entry-suffix-input'
            col.options.forEach((opt) => {
              const option = document.createElement('option')
              option.value = opt.value
              option.textContent = opt.label
              control.appendChild(option)
            })
            control.value = suffixParts[idx] || ''
          } else {
            control = document.createElement('input')
            control.type = 'text'
            control.className = 'entry-suffix-input'
            control.value = suffixParts[idx] || ''
            control.placeholder = col.placeholder
          }

          control.addEventListener('change', () => {
            let newSuffix
            if (secConfig.isScoreboardStdName) {
              const stadiumName = suffixInputs[0].value.trim()
              newSuffix = stadiumName
            } else {
              const values = suffixInputs.map((inp) => inp.value.trim())
              newSuffix = ',' + values.join(',')
            }
            const currentComment = commentInput ? commentInput.value.trim() : undefined
            if (hasID) {
              updateEntryLine(secName, myVisualIdx, idInput ? idInput.value.trim() : '', newSuffix, currentComment)
            } else {
              updateEntryLine(secName, myVisualIdx, '', newSuffix, currentComment)
            }
          })
          suffixInputs.push(control)
        })
      } else {
        suffixInput = document.createElement('input')
        suffixInput.type = 'text'
        suffixInput.className = 'entry-suffix-input'
        suffixInput.value = entry.suffix || secConfig.defaultSuffix
        suffixInput.placeholder = secConfig.suffixPlaceholder
        suffixInput.addEventListener('change', () => {
          if (hasID) {
            updateEntryLine(secName, myVisualIdx, idInput ? idInput.value.trim() : '', suffixInput.value.trim())
          } else {
            updateEntryLine(secName, myVisualIdx, '', suffixInput.value.trim())
          }
        })
      }
    }

    const delBtn = document.createElement('button')
    delBtn.className = 'entry-del'
    delBtn.innerHTML = '×'
    delBtn.title = 'Remove entry'
    delBtn.addEventListener('click', () => {
      removeEntry(secName, myVisualIdx)
    })

    if (hideFolder) {
      commentInput = document.createElement('input')
      commentInput.type = 'text'
      commentInput.className = 'entry-comment-input'
      commentInput.value = entry.comment || ''
      commentInput.placeholder = 'e.g. Estadio Mestalla'
      commentInput.addEventListener('change', () => {
        const sv = ',' + suffixInputs.map((inp) => inp.value.trim()).join(',')
        updateEntryLine(secName, myVisualIdx, idInput ? idInput.value.trim() : '', sv, commentInput.value.trim())
      })
    }

    if (idInput) row.appendChild(idInput)
    if (folderEl) row.appendChild(folderEl)
    if (hasSuffixColumns && suffixInputs.length) {
      suffixInputs.forEach((input) => row.appendChild(input))
    } else if (suffixInput) {
      row.appendChild(suffixInput)
    }
    if (commentInput) row.appendChild(commentInput)
    row.appendChild(delBtn)
    editorEl.appendChild(row)
  })

  updateCounts()
}

function updateEntryLine(secName, visualIdx, newId, newSuffix, newComment) {
  const lines = state.sections[secName]
  const entries = parseSection(secName)
  const dataEntries = entries.filter((e) => e.type === 'entry')
  const targetEntry = dataEntries[visualIdx]

  if (!targetEntry) return

  const cfg = getSectionConfig(secName)
  const hasID = cfg.hasID !== false

  let dataCount = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    if (hasID && !trimmed.startsWith('???') && !trimmed.match(/^\d+=/)) continue

    if (dataCount === visualIdx) {
      const suffix = newSuffix !== undefined && newSuffix !== null ? newSuffix : targetEntry.suffix || cfg.defaultSuffix
      if (cfg.isScoreboardStdName) {
        lines[i] = targetEntry.folder + '=' + suffix
      } else if (hasID) {
        const id = newId || '???'
        if (secName === 'stadiumnetid') {
          const suffixToWrite = suffix.startsWith(',') ? suffix.slice(1) : suffix
          const commentToWrite = (newComment !== undefined ? newComment : targetEntry.comment) || ''
          lines[i] = id + '=' + suffixToWrite + (commentToWrite ? ' ; ' + commentToWrite : '')
        } else {
          lines[i] = id + '=' + targetEntry.folder + suffix
        }
      } else {
        lines[i] = targetEntry.folder + '=' + suffix
      }
      setUnsaved(true)
      syncLinkedScoreboardSection(secName)
      break
    }
    dataCount++
  }
}

// ============================================================
// ADD / REMOVE ITEMS
// ============================================================
function addItemsToSection(typeKey, items) {
  if (!items.length) {
    toast('No items selected', '')
    return
  }

  const typeConfig = GBD_TYPES[typeKey]
  const iniSec = typeKey === 'scoreboardstdname' && isScoreboardStdSection(state.currentSection) ? state.currentSection : typeConfig.iniSection
  const added = getAddedItems(typeKey, iniSec)
  const toAdd = items.filter((item) => {
    const comparable = getComparableItemName(typeKey, item)
    return !added.has(item) && !added.has(comparable)
  })

  if (!toAdd.length) {
    toast('All selected items are already in [' + iniSec + ']', '')
    return
  }

  if (!state.sections[iniSec]) state.sections[iniSec] = []

  const defaultSuffix = typeConfig.defaultSuffix || ''
  const hasID = typeConfig.hasID !== false

  toAdd.forEach((item) => {
    const itemToWrite = getComparableItemName(typeKey, item)
    if (typeConfig.isScoreboardStdName) {
      state.sections[iniSec].push(itemToWrite + '=' + itemToWrite + defaultSuffix)
    } else if (hasID) {
      if (iniSec === 'stadiumnetid') {
        const suffixToWrite = defaultSuffix.startsWith(',') ? defaultSuffix.slice(1) : defaultSuffix
        state.sections[iniSec].push('???=' + suffixToWrite)
      } else {
        state.sections[iniSec].push('???=' + itemToWrite + defaultSuffix)
      }
    } else {
      const suffixNoComma = defaultSuffix.startsWith(',') ? defaultSuffix.slice(1) : defaultSuffix
      state.sections[iniSec].push(itemToWrite + '=' + suffixNoComma)
    }
  })

  state.selectedItems[typeKey].clear()
  syncLinkedScoreboardSection(iniSec)
  setUnsaved(true)
  renderAll()
  toast('Added ' + toAdd.length + ' item' + (toAdd.length > 1 ? 's' : ''), 'success')

  setTimeout(() => {
    const ed = document.getElementById('item-editor')
    ed.scrollTop = ed.scrollHeight
  }, 50)
}

function removeEntry(secName, visualIdx) {
  const entries = parseSection(secName)
  const dataEntries = entries.filter((e) => e.type === 'entry')
  const targetEntry = dataEntries[visualIdx]
  if (!targetEntry) return

  const lines = state.sections[secName]
  const cfg = getSectionConfig(secName)
  const hasID = cfg.hasID !== false
  let dataCount = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    if (hasID && !trimmed.match(/^(\d+|\?\?\?)=.+/)) continue

    if (dataCount === visualIdx) {
      state.sections[secName].splice(i, 1)
      break
    }
    dataCount++
  }

  setUnsaved(true)
  syncLinkedScoreboardSection(secName)
  renderAll()
}

function renderModulesEditor() {
  document.getElementById('raw-editor').classList.remove('visible')
  document.querySelector('.panel-left').style.display = 'none'
  const layout = document.querySelector('.main-layout')
  if (layout) {
    layout.classList.add('left-hidden')
  }
  document.getElementById('btn-add-selected').style.display = 'none'
  document.getElementById('btn-add-all').style.display = 'none'
  document.getElementById('btn-add-entry').style.display = 'none'
  document.getElementById('btn-sort').style.display = 'none'
  document.getElementById('btn-visual-view').style.display = ''
  document.getElementById('btn-raw-view').style.display = ''
  document.getElementById('btn-full-raw').style.display = ''

  const tabsContainer = document.getElementById('section-tabs')
  tabsContainer.innerHTML = ''
  const tab = document.createElement('div')
  tab.className = 'section-tab active'
  const modLines = (state.sections.modules || []).filter((l) => l.trim() && !l.trim().startsWith(';') && l.includes('='))
  tab.innerHTML = `[modules] <span class="tab-count">${modLines.length}</span>`
  tabsContainer.appendChild(tab)

  const editorEl = document.getElementById('item-editor')
  editorEl.style.display = 'block'
  editorEl.style.overflow = 'hidden'
  editorEl.innerHTML = ''

  const lines = state.sections.modules || []

  if (lines.length === 0) {
    editorEl.innerHTML = '<div class="empty-state"><p>No [modules] section found in settings.ini.</p></div>'
    document.getElementById('footer-entries').textContent = '0 entries'
    return
  }

  const wrap = document.createElement('div')
  wrap.className = 'modules-wrap'

  const grid = document.createElement('div')
  grid.className = 'modules-grid'
  wrap.appendChild(grid)

  let count = 0
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) return
    const eqIdx = trimmed.indexOf('=')
    const key = trimmed.substring(0, eqIdx).trim()
    const val = trimmed.substring(eqIdx + 1).trim()
    const isEnabled = val === '1'
    count++

    const card = document.createElement('div')
    card.className = 'module-card' + (isEnabled ? ' enabled' : '')

    const info = document.createElement('div')
    info.className = 'module-info'
    info.innerHTML = `<div class="module-name">${key}</div>`

    const label = document.createElement('label')
    label.className = 'toggle'
    label.title = isEnabled ? 'Enabled - click to disable' : 'Disabled - click to enable'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = isEnabled

    const slider = document.createElement('span')
    slider.className = 'toggle-slider'

    label.appendChild(checkbox)
    label.appendChild(slider)

    checkbox.addEventListener('change', () => {
      const newVal = checkbox.checked ? '1' : '0'
      const secLines = state.sections.modules
      for (let i = 0; i < secLines.length; i++) {
        const t = secLines[i].trim()
        if (!t.includes('=')) continue
        const k = t.substring(0, t.indexOf('=')).trim()
        if (k === key) {
          secLines[i] = key + '=' + newVal
          break
        }
      }
      card.classList.toggle('enabled', checkbox.checked)
      label.title = checkbox.checked ? 'Enabled - click to disable' : 'Disabled - click to enable'
      setUnsaved(true)
      renderGBDTypeTabs()
    })

    card.appendChild(info)
    card.appendChild(label)
    grid.appendChild(card)
  })

  editorEl.appendChild(wrap)
  document.getElementById('footer-entries').textContent = count + ' modules'
}

function renderRaw(section = null) {
  document.getElementById('item-editor').style.display = 'none'
  const rawEl = document.getElementById('raw-editor')
  rawEl.classList.add('visible')

  state.rawSection = section || null
  const content = section ? '[' + getSectionName(section) + ']\n' + getSectionLines(section).join('\n') : buildIni()

  rawEl.value = content
  rawEl.focus()
}

function updateCounts() {
  for (const [typeKey, typeConfig] of Object.entries(GBD_TYPES)) {
    const sec = typeConfig.iniSection
    const lines = getSectionLines(sec)
    const count = lines.filter((l) => l.trim().match(/^(\d+|\?\?\?)=/)).length
    const badge = document.getElementById('cnt-' + sec)
    if (badge) badge.textContent = count
  }
  const currentCount = getSectionLines(state.currentSection).filter((l) => l.trim().match(/^(\d+|\?\?\?)=/)).length
  document.getElementById('footer-entries').textContent = currentCount + ' entries'
}

// ============================================================
// SAVE
// ============================================================
async function saveIni() {
  const content = buildIni()
  if (state.iniHandle) {
    try {
      const writable = await state.iniHandle.createWritable()
      await writable.write(content)
      await writable.close()
      state.iniContent = content
      setUnsaved(false)
      toast('settings.ini saved successfully', 'success')
      updateStatusBar('Saved: ' + (state.rootHandle?.name || 'file'), true)
    } catch (e) {
      toast('Save failed: ' + e.message, 'error')
    }
  } else {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'settings.ini'
    a.click()
    URL.revokeObjectURL(url)
    setUnsaved(false)
    toast('Downloaded settings.ini', 'success')
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
document.getElementById('btn-save').addEventListener('click', saveIni)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveIni()
  }
})

document.getElementById('btn-add-selected').addEventListener('click', () => {
  const typeKey = state.currentType
  addItemsToSection(typeKey, Array.from(state.selectedItems[typeKey] || []))
})

document.getElementById('btn-add-entry').addEventListener('click', () => {
  const iniSec = 'stadiumnetid'
  if (!state.sections[iniSec]) state.sections[iniSec] = []
  const cfg = GBD_TYPES.stadiumnetid
  const suffixToWrite = cfg.defaultSuffix.startsWith(',') ? cfg.defaultSuffix.slice(1) : cfg.defaultSuffix
  state.sections[iniSec].push('???=' + suffixToWrite)
  setUnsaved(true)
  renderAll()
  setTimeout(() => {
    const ed = document.getElementById('item-editor')
    ed.scrollTop = ed.scrollHeight
    const idInputs = ed.querySelectorAll('.entry-id')
    if (idInputs.length) idInputs[idInputs.length - 1].focus()
  }, 50)
})

document.getElementById('btn-add-all').addEventListener('click', () => {
  const typeKey = state.currentType
  const typeConfig = GBD_TYPES[typeKey]
  const targetSection = typeKey === 'scoreboardstdname' && isScoreboardStdSection(state.currentSection) ? state.currentSection : typeConfig.iniSection
  if (!confirm(`Add ALL ${typeConfig.name.toLowerCase()} to [${targetSection}]? You can remove unwanted ones after.`)) return
  addItemsToSection(typeKey, [...(state.gbdFolders[typeKey] || [])])
})

document.getElementById('btn-sort').addEventListener('click', () => {
  const secName = state.currentSection
  const lines = getSectionLines(secName)
  const dataLines = lines.filter((l) => l.trim().match(/^(\d+|\?\?\?)=/))
  const otherLines = lines.filter((l) => !l.trim().match(/^(\d+|\?\?\?)=/))
  dataLines.sort((a, b) => {
    const idA = parseInt(a.match(/^(\d+)/)?.[1] || '999999', 10)
    const idB = parseInt(b.match(/^(\d+)/)?.[1] || '999999', 10)
    return idA - idB
  })
  state.sections[secName] = [...otherLines.filter((l) => !l.trim()), ...dataLines]
  setUnsaved(true)
  renderEditor()
  toast('Sorted by ID', 'success')
})

function syncViewButtons() {
  const vm = state.viewMode
  const ids = {
    visual: 'btn-visual-view',
    raw: 'btn-raw-view',
    'full-raw': 'btn-full-raw',
  }
  for (const id of Object.values(ids)) {
    const el = document.getElementById(id)
    if (!el) continue
    el.style.color = ''
    el.style.borderColor = ''
  }
  const activeId = vm === 'full-raw' ? 'btn-full-raw' : vm === 'raw' ? 'btn-raw-view' : 'btn-visual-view'
  const activeEl = document.getElementById(activeId)
  if (activeEl && activeEl.style.display !== 'none') {
    activeEl.style.color = 'var(--accent)'
    activeEl.style.borderColor = 'var(--accent)'
  }
}

document.getElementById('btn-visual-view').addEventListener('click', () => {
  state.viewMode = 'visual'
  syncViewButtons()
  renderEditor()
})

document.getElementById('btn-raw-view').addEventListener('click', () => {
  state.viewMode = 'raw'
  syncViewButtons()
  renderRaw(state.currentSection)
})

document.getElementById('btn-full-raw').addEventListener('click', () => {
  state.viewMode = 'full-raw'
  syncViewButtons()
  renderRaw()
})

function commitRawContent() {
  const rawEditor = document.getElementById('raw-editor')
  if (!rawEditor.classList.contains('visible')) return
  const content = rawEditor.value
  if (state.rawSection) {
    const lines = content.split('\n')
    state.sections[state.rawSection] = lines.slice(1)
    syncLinkedScoreboardSection(state.rawSection)
  } else {
    parseIni(content)
  }
  updateCounts()
  renderItemList(state.currentType)
  renderGBDTypeTabs()
}

function insertTextAtRawCursor(text) {
  const el = document.getElementById('raw-editor')
  el.focus()

  if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
    const start = el.selectionStart
    const end = el.selectionEnd
    const prev = el.value
    el.value = prev.slice(0, start) + text + prev.slice(end)
    const pos = start + text.length
    el.selectionStart = pos
    el.selectionEnd = pos
  } else {
    el.value += text
  }

  commitRawContent()
  setUnsaved(true)
}

const rawEditor = document.getElementById('raw-editor')

rawEditor.addEventListener('input', () => {
  if (rawEditor.classList.contains('visible')) {
    const content = rawEditor.value
    if (state.rawSection) {
      const lines = content.split('\n')
      state.sections[state.rawSection] = lines.slice(1)
      syncLinkedScoreboardSection(state.rawSection)
    } else {
      parseIni(content)
    }
    updateCounts()
    renderItemList(state.currentType)
    renderGBDTypeTabs()
    setUnsaved(true)
  }
})

rawEditor.addEventListener('paste', () => {
  // textarea handles plain text paste by default
})

rawEditor.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
    e.preventDefault()
  }
})

document.getElementById('search-items').addEventListener('input', () => renderItemList(state.currentType))

document.addEventListener('DOMContentLoaded', async () => {
  await initIndexedDB()
  showLastPathSuggestion()
  await initDbPanel()
})

document.getElementById('btn-load-suggestion').addEventListener('click', async () => {
  const lastPath = getLastPath()
  if (!lastPath) {
    toast('Could not load previous path', 'error')
    return
  }

  const btnLoad = document.getElementById('btn-load-suggestion')
  btnLoad.textContent = 'Connecting...'
  btnLoad.disabled = true

  let handle = await getDirectoryHandle()
  if (handle) handle = await requestHandlePermission(handle)

  if (!handle && window.showDirectoryPicker) {
    try {
      handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      await saveDirectoryHandle(handle)
      saveLastPath(handle.name)
    } catch (e) {
      if (e.name !== 'AbortError') toast('Could not open folder: ' + e.message, 'error')
      btnLoad.textContent = 'Reconnect'
      btnLoad.disabled = false
      return
    }
  }

  btnLoad.textContent = 'Reconnect'
  btnLoad.disabled = false

  if (!handle) {
    toast('Could not get permission for the folder. Please try again.', 'error')
    return
  }

  state.rootHandle = handle
  document.getElementById('root-path').value = lastPath
  document.getElementById('root-path').classList.add('ok')
  document.getElementById('root-status').textContent = 'Folder loaded: ' + lastPath
  document.getElementById('root-status').className = 'path-status ok'
  updatePreviews()
  await resetDbPanelState('Game folder reconnected. Select DB root again to load teams.')
  await loadFromHandle(handle)
})

document.getElementById('btn-new-path').addEventListener('click', () => {
  document.getElementById('browse-root').click()
})

document.getElementById('btn-clear-suggestion').addEventListener('click', () => {
  clearLastPath()
  document.getElementById('last-path-suggestion').classList.remove('show')
  toast('Path suggestion cleared', 'info')
})

if (document.readyState !== 'loading') {
  initIndexedDB().then(showLastPathSuggestion)
}
