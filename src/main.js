import './style.css'
import { openParamPicker } from './paramPicker.js'
import { initCompetitions, loadCompetitions, resetCompetitions, getActiveDbTab } from './competitions.js'
import { createDesktopRootHandle } from './desktopFs.js'
import { renderMarkdown } from './markdown.js'

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
    subSections: ['stadiumgoalpost', 'stadiumgoalposttexture', 'stadiumentrancecam'],
    suffixColumns: [
      { label: 'Police', placeholder: 'e.g. 4', type: 'spinner', min: 0, pickerKind: 'police' },
      { label: 'Pitch', placeholder: 'e.g. 0', type: 'spinner', min: 0, pickerKind: 'pitch' },
      { label: 'Net', placeholder: 'e.g. 0', type: 'spinner', min: 0, pickerKind: 'net' },
    ],
  },
  stadiumgoalpost: {
    isSubSection: true,
    name: 'Goalposts',
    tabLabel: 'Model',
    path: 'StadiumGBD',
    packPath: 'FSW/Goalpost/GoalpostModel',
    section: 'stadiumgoalpost',
    iniSection: 'stadiumgoalpost',
    defaultSuffix: '',
    suffixEditable: true,
    suffixPlaceholder: 'goalpost model',
    suffixRegex: /^(.+?)=(.*?)\s*(?:;.*)?$/,
    hint: 'Goalposts - link a stadium to a Goalpost Model pack ([stadiumgoalpost], FSW/Goalpost/GoalpostModel) and/or a Texture pack ([stadiumgoalposttexture], FSW/Goalpost/GoalpostColor). Both are independent and can be mixed.',
    hasID: false,
    isScoreboardStdName: true,
    suffixColumns: [{ label: 'Goalpost Model', placeholder: 'Model pack folder', pickerKind: 'goalpostModel' }],
  },
  stadiumgoalposttexture: {
    isSubSection: true,
    name: 'Goalpost Textures',
    tabLabel: 'Texture',
    path: 'StadiumGBD',
    packPath: 'FSW/Goalpost/GoalpostColor',
    section: 'stadiumgoalposttexture',
    iniSection: 'stadiumgoalposttexture',
    defaultSuffix: '',
    suffixEditable: true,
    suffixPlaceholder: 'goalpost texture',
    suffixRegex: /^(.+?)=(.*?)\s*(?:;.*)?$/,
    hasID: false,
    isScoreboardStdName: true,
    suffixColumns: [{ label: 'Goalpost Texture', placeholder: 'Texture pack folder', pickerKind: 'goalpostTexture' }],
  },
  stadiumentrancecam: {
    isSubSection: true,
    name: 'Entrance Cameras',
    tabLabel: 'Entrance Camera',
    path: 'StadiumGBD',
    packPath: 'FSW/Camera/EntranceScene',
    section: 'stadiumentrancecam',
    iniSection: 'stadiumentrancecam',
    defaultSuffix: '',
    suffixEditable: true,
    suffixPlaceholder: 'entrance camera pack',
    suffixRegex: /^(.+?)=(.*?)\s*(?:;.*)?$/,
    hint: 'Entrance Camera - link a stadium to a shared pack in FSW/Camera/EntranceScene (bcstadiumcams_176/261.dat). Used only while the EntranceCam module is on; it takes priority over the EntranceScene folder inside the stadium itself.',
    hasID: false,
    isScoreboardStdName: true,
    suffixColumns: [{ label: 'Entrance Camera Pack', placeholder: 'Camera pack folder', pickerKind: 'entranceCam' }],
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
    subSections: ['hometeamscoreboard', 'derbyscoreboard'],
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
    subSections: ['derbymatch', 'teammovies'],
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
    subSections: ['hometeamtvlogo', 'derbytvlogo'],
  },
  kitsid: {
    name: 'Kits',
    path: 'FSW/Kits',
    section: 'kitsid',
    iniSection: 'kitsid',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
    hint: 'Kits - link a team ID to a kit folder. Drag a team ID from the DB panel onto the ID field.',
  },
  chantsid: {
    name: 'Chants',
    rawOnly: false,
    rawWithPanel: true,
    path: 'FSW/Chants',
    section: 'chantsid',
    iniSection: 'chantsid',
    subSections: ['roundentrance', 'tournamententrance'],
    defaultSuffix: ',0.12,0.15,0.10,0.05,0.15,0.13,0.15,8.0,0.35,0.16,7.0',
    suffixEditable: true,
    suffixPlaceholder: ',vol,win,lose1,lose2,lose3,goal,silenceProb,maxSilence,awayCrowd,entranceVol,entranceDelay',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)((?:,[\d.]+)+)?\s*(?:;.*)?$/,
    hint: 'Chants - double-click a folder on the left to insert it in raw mode. Entrance Anthem plays Entrance.mp3 from the chant folder at kickoff, using the Vol. Entrance / Entrance Delay fields below.',
    suffixColumns: [
      { label: 'Default', placeholder: 'e.g. 0.12', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Winning', placeholder: 'e.g. 0.15', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Losing -1', placeholder: 'e.g. 0.10', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Losing -2', placeholder: 'e.g. 0.05', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Losing -3', placeholder: 'e.g. 0.15', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Goal Song', placeholder: 'e.g. 0.13', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Silence prob', placeholder: 'e.g. 1', type: 'slider', min: 0, max: 1, step: 0.1 },
      { label: 'Max Silence', placeholder: 'Sec 8.0', type: 'slider', min: 0, max: 30, step: 0.1 },
      { label: 'Away Crowd', placeholder: 'e.g. 0', type: 'slider', min: 0, max: 1, step: 0.1 },
      { label: 'Vol. Entrance', placeholder: 'e.g. 0.16', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Entrance Delay (s)', placeholder: 'e.g. 7.0', type: 'slider', min: 0, max: 45, step: 0.5 },
    ],
  },
  stadiumnetname: {
    group: 'nets',
    name: 'Stadium Net Names',
    tabLabel: 'Net Names',
    rawOnly: false,
    rawWithPanel: true,
    path: 'StadiumGBD',
    section: 'stadiumnetname',
    iniSection: 'stadiumnetname',
    defaultSuffix: ',1089199011,1087199011,2,0,0',
    suffixEditable: true,
    trimTrailingEmpty: true,
    suffixPlaceholder: ',downDeep,highDeep,rig,shape,tension',
    suffixRegex: /^(.+?)=,?([\d,]*)\s*(?:;.*)?$/,
    hint: 'Stadium Net Names - double-click a folder on the left to insert it in raw mode. Tension only has a visible effect when Down Deep is 1089438971 or 1093138971 and the game build provides the soccernet presets.',
    hasID: false,
    suffixColumns: [
      { label: 'Down Deep', placeholder: 'e.g. 1089199011' },
      { label: 'High Deep', placeholder: 'e.g. 1068038976' },
      { label: 'Rig', placeholder: 'e.g. 0-5', type: 'spinner', min: 0, max: 5 },
      { label: 'Shape', placeholder: '0=Rectangle 1=Triangle', type: 'select', options: [{ label: 'Rectangle', value: '0' }, { label: 'Triangle', value: '1' }] },
      { label: 'Tension', placeholder: '0, 1 or 2', type: 'select', options: [{ label: 'Not set', value: '' }, { label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }] },
    ],
  },
  stadiumnetid: {
    group: 'nets',
    name: 'Stadium Net IDs',
    tabLabel: 'Net IDs',
    rawOnly: false,
    path: 'FSW',
    section: 'stadiumnetid',
    iniSection: 'stadiumnetid',
    defaultSuffix: ',1089199011,1087199011,2,0,0',
    suffixEditable: true,
    trimTrailingEmpty: true,
    suffixPlaceholder: ',downDeep,highDeep,rig,shape,tension',
    suffixRegex: /^(\d+|\?\?\?)=(\d+)((?:,\d+)*)\s*(?:;.*)?$/,
    hint: 'Stadium Net IDs - double-click a folder on the left to insert it in raw mode. Tension only has a visible effect when Down Deep is 1089438971 or 1093138971 and the game build provides the soccernet presets.',
    suffixColumns: [
      { label: 'Down Deep', placeholder: 'e.g. 1089199011' },
      { label: 'High Deep', placeholder: 'e.g. 1087199011' },
      { label: 'Rig', placeholder: 'e.g. 4', type: 'spinner', min: 0, max: 5 },
      { label: 'Shape', placeholder: '0=Rectangle 1=Triangle', type: 'select', options: [{ label: 'Rectangle', value: '0' }, { label: 'Triangle', value: '1' }] },
      { label: 'Tension', placeholder: '0, 1 or 2', type: 'select', options: [{ label: 'Not set', value: '' }, { label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }] },
    ],
  },
  scoreboardstdname: {
    parentType: 'scoreboard',
    name: 'Scoreboard Stadium Names',
    tabLabel: '[scoreboardstdname]',
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
  hometeamscoreboard: {
    isSubSection: true,
    name: 'Home Team Scoreboards',
    tabLabel: 'By Home Team',
    path: 'ScoreBoardGBD',
    section: 'hometeamscoreboard',
    iniSection: 'hometeamscoreboard',
    defaultSuffix: '',
    suffixEditable: false,
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
  },
  derbymatch: {
    isSubSection: true,
    name: 'Derby Match Movies',
    tabLabel: 'Derby Match',
    path: 'MoviesGBD',
    section: 'derbymatch',
    iniSection: 'derbymatch',
    defaultSuffix: '',
    suffixEditable: false,
    suffixRegex: /^((?:\d+|\?\?\?)vs(?:\d+|\?\?\?))=(.+?)\s*(?:;.*)?$/,
    isDerbyMatch: true,
  },
  hometeamtvlogo: {
    isSubSection: true,
    name: 'Home Team TV Logos',
    tabLabel: 'By Home Team',
    path: 'TVLogoGBD',
    section: 'hometeamtvlogo',
    iniSection: 'hometeamtvlogo',
    defaultSuffix: '',
    suffixEditable: false,
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
  },
  teammovies: {
    isSubSection: true,
    name: 'Team Movies',
    tabLabel: 'By Team',
    path: 'MoviesGBD',
    section: 'teammovies',
    iniSection: 'teammovies',
    defaultSuffix: '',
    suffixEditable: false,
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
  },
  derbyscoreboard: {
    isSubSection: true,
    name: 'Derby Scoreboards',
    tabLabel: 'Derby Match',
    path: 'ScoreBoardGBD',
    section: 'derbyscoreboard',
    iniSection: 'derbyscoreboard',
    defaultSuffix: '',
    suffixEditable: false,
    suffixRegex: /^((?:\d+|\?\?\?)vs(?:\d+|\?\?\?))=(.+?)\s*(?:;.*)?$/,
    isDerbyMatch: true,
  },
  derbytvlogo: {
    isSubSection: true,
    name: 'Derby TV Logos',
    tabLabel: 'Derby Match',
    path: 'TVLogoGBD',
    section: 'derbytvlogo',
    iniSection: 'derbytvlogo',
    defaultSuffix: '',
    suffixEditable: false,
    suffixRegex: /^((?:\d+|\?\?\?)vs(?:\d+|\?\?\?))=(.+?)\s*(?:;.*)?$/,
    isDerbyMatch: true,
  },
  roundentrance: {
    isSubSection: true,
    name: 'Round Entrance Anthems',
    tabLabel: 'Round Entrance',
    path: 'FSW/Chants',
    section: 'roundentrance',
    iniSection: 'roundentrance',
    defaultSuffix: ',0.16,7.0',
    suffixEditable: true,
    suffixPlaceholder: ',vol,delay',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)((?:,[\d.]+)+)?\s*(?:;.*)?$/,
    hint: 'Round Entrance - play the Entrance.mp3 of a chants folder before kick-off for a competition Round ID. Needs the TournamentEntrance module. Priority: round, then tournament, then home team.',
    suffixColumns: [
      { label: 'Vol. Entrance', placeholder: 'e.g. 0.16', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Entrance Delay (s)', placeholder: 'e.g. 7.0', type: 'slider', min: 0, max: 45, step: 0.5 },
    ],
  },
  tournamententrance: {
    isSubSection: true,
    name: 'Tournament Entrance Anthems',
    tabLabel: 'Tournament Entrance',
    path: 'FSW/Chants',
    section: 'tournamententrance',
    iniSection: 'tournamententrance',
    defaultSuffix: ',0.16,7.0',
    suffixEditable: true,
    suffixPlaceholder: ',vol,delay',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)((?:,[\d.]+)+)?\s*(?:;.*)?$/,
    hint: 'Tournament Entrance - play the Entrance.mp3 of a chants folder before kick-off for a Tournament ID. Needs the TournamentEntrance module. Priority: round, then tournament, then home team.',
    suffixColumns: [
      { label: 'Vol. Entrance', placeholder: 'e.g. 0.16', type: 'slider', min: 0, max: 1, step: 0.01 },
      { label: 'Entrance Delay (s)', placeholder: 'e.g. 7.0', type: 'slider', min: 0, max: 45, step: 0.5 },
    ],
  },
  ball: {
    group: 'gameplay',
    name: 'Ball',
    path: 'FSW/balls',
    section: 'ball',
    iniSection: 'ball',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
    hint: 'Balls - assign a ball folder to a competition Round ID (TOURROUNDID), not a team ID. Applied to data/sceneassets/ball at kickoff.',
  },
  referee: {
    group: 'gameplay',
    name: 'Referee',
    path: 'FSW/referee',
    section: 'referee',
    iniSection: 'referee',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
    hint: 'Referees - assign a referee kit folder to a competition Round ID (TOURROUNDID), not a team ID. Applied to data/sceneassets/kit at kickoff.',
  },
  wipe: {
    group: 'gameplay',
    name: 'Wipe',
    path: 'FSW/wipe',
    section: 'wipe',
    iniSection: 'wipe',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
    hint: 'Wipes - assign a 3D scene-transition wipe folder to a competition Round ID (TOURROUNDID), not a team ID. Applied to data/sceneassets/wipe3d.',
  },
  adboard: {
    group: 'gameplay',
    name: 'Adboard',
    path: 'FSW/adboards',
    section: 'adboard',
    iniSection: 'adboard',
    defaultSuffix: '',
    suffixEditable: false,
    suffixPlaceholder: '',
    suffixRegex: /^(\d+|\?\?\?)=(.+?)\s*(?:;.*)?$/,
    hint: 'Adboards - fallback folder assigned to a competition Round ID (TOURROUNDID), not a team ID. A folder here named after a stadium is used automatically for that stadium; this assignment only applies when no such stadium-matched folder exists.',
  },
}

// Types that share one top-level tab; each keeps its own folder list and ini section,
// so a member is simply the active type while the group tab is open.
const TYPE_GROUPS = {
  gameplay: { name: 'Gameplay', members: ['ball', 'referee', 'wipe', 'adboard'] },
  nets: { name: 'Nets', members: ['stadiumnetname', 'stadiumnetid'] },
}

// Types shown as an extra sub-tab of another type's top-level tab. Unlike a group
// member they keep their own folder list, so opening one switches the active type.
const LINKED_TYPES = { scoreboard: ['scoreboardstdname'] }

function getOwnerType(typeKey) {
  return GBD_TYPES[typeKey]?.parentType || typeKey
}

const state = {
  rootHandle: null,
  iniHandle: null,
  iniContent: '',
  gbdFolders: {},
  gbdPacks: {},
  chantInfo: {},
  treeExpanded: {},
  sections: {},
  currentType: 'stadium',
  currentSection: 'stadium',
  groupMember: {},
  rawSection: null,
  viewMode: 'visual',
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
  stadiumAssetsStatus: {},
  stadiumAssetsSources: {
    gameplay176: null, gameplay261: null,
    goalnet: null, goalpost: null, netsupport: null,
  },
  stadiumAssetsSearch: '',
  stadiumAssetsListPage: 0,
  stadiumAssetsModal: null,
  stadiumAssetsToolbarPage: 0,
  leftPanelCollapsed: false,
  hideAddedItems: false,
  sectionOrder: [],
}

const isDesktopApp = !!window.electronAPI?.isDesktop
const SCOREBOARD_STD_SECTIONS = ['scoreboardstdname']

function isScoreboardStdSection(secName) {
  return SCOREBOARD_STD_SECTIONS.includes(secName)
}

function getTypeSections(typeKey) {
  if (typeKey === 'scoreboardstdname') return SCOREBOARD_STD_SECTIONS
  const cfg = GBD_TYPES[typeKey]
  return cfg?.subSections ? [cfg.iniSection, ...cfg.subSections] : [cfg.iniSection]
}

function getDefaultSectionForType(typeKey) {
  return getTypeSections(typeKey)[0]
}

// Sections that only ever play the Entrance track of the assigned chant folder.
const ENTRANCE_SECTIONS = ['roundentrance', 'tournamententrance']

function isEntranceSection(secName) {
  return ENTRANCE_SECTIONS.includes(secName)
}

// Folders offered in the left panel for the active section of a type.
function getPanelItems(typeKey) {
  const items = state.gbdFolders[typeKey] || []
  if (typeKey === 'chantsid' && isEntranceSection(state.currentSection)) {
    return items.filter((path) => state.chantInfo[path]?.entrance > 0)
  }
  return items
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
  toggleBtn.innerHTML = state.db.collapsed ? '<i class="fa-solid fa-caret-left"></i>DB' : 'Collapse<i class="fa-solid fa-caret-right"></i>'
  toggleBtn.title = state.db.collapsed ? 'Expand panel' : 'Collapse panel'
  toggleBtn.setAttribute('aria-label', toggleBtn.title)
}

function persistLeftPanelState() {
  try { localStorage.setItem('leftPanelCollapsed', state.leftPanelCollapsed ? '1' : '0') } catch (e) {}
}

function loadLeftPanelState() {
  try {
    const saved = localStorage.getItem('leftPanelCollapsed')
    state.leftPanelCollapsed = saved === '1'
  } catch (e) {
    state.leftPanelCollapsed = false
  }
}

function syncLeftPanelLayout() {
  const layout = document.querySelector('.main-layout')
  const panel = document.querySelector('.panel-left')
  const toggleBtn = document.getElementById('left-toggle')
  if (!layout || !panel || !toggleBtn) return

  layout.classList.toggle('left-collapsed', state.leftPanelCollapsed)
  panel.classList.toggle('collapsed', state.leftPanelCollapsed)
  toggleBtn.innerHTML = state.leftPanelCollapsed
    ? `Folders<i class="fa-solid fa-caret-right"></i>`
    : `<i class="fa-solid fa-caret-left"></i>`
  toggleBtn.title = state.leftPanelCollapsed ? 'Expand panel' : 'Collapse panel'
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

function showLoadingOverlay(text = 'Loading...') {
  const lbl = document.getElementById('loading-label')
  if (lbl) lbl.textContent = text
  document.getElementById('loading-overlay')?.classList.add('visible')
}

function hideLoadingOverlay() {
  document.getElementById('loading-overlay')?.classList.remove('visible')
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

    tr.addEventListener('click', () => {
      if (state.currentType !== 'stadium') return
      openStadiumAssignModal(String(team.id))
    })

    body.appendChild(tr)
  })
}

// silent skips the blocking overlay, for loads that run in the background
// while the editor is already usable (the DB read takes a few seconds).
async function loadDbTeams(explicitRootPath = '', { silent = false } = {}) {
  if (!isDesktopApp || !window.electronAPI?.db?.getTeams) {
    setDbStatus('DB panel is available only in Desktop (Electron).', 'err')
    return
  }

  state.db.loading = true
  if (!silent) showLoadingOverlay('Loading DB...')
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
    if (!silent) hideLoadingOverlay()
  }
}

// Desktop: one game root drives everything. The main process keeps the path
// (persisted across launches) and serves file access for it, so the editor's
// folder handle and the DB reader always point at the same folder.
function applyDesktopRoot(rootPath) {
  state.db.gameRootPath = rootPath
  state.rootHandle = createDesktopRootHandle(rootPath)

  const input = document.getElementById('root-path')
  input.value = rootPath
  input.classList.add('ok')
  const status = document.getElementById('root-status')
  status.textContent = 'Folder selected: ' + rootPath
  status.className = 'path-status ok'
  updatePreviews()
}

// Commits rootPath as the game root only if it holds FSW\settings.ini;
// otherwise the previous root (and its saved copy) is restored.
async function connectDesktopRoot(rootPath) {
  const previous = state.db.gameRootPath
  await window.electronAPI.db.setGameRoot(rootPath)
  try {
    const fswDir = await createDesktopRootHandle(rootPath).getDirectoryHandle('FSW')
    await fswDir.getFileHandle('settings.ini')
  } catch (e) {
    if (previous) await window.electronAPI.db.setGameRoot(previous)
    else await window.electronAPI.db.clearGameRoot()
    toast('Could not find FSW\\settings.ini in the selected folder', 'error')
    return false
  }

  applyDesktopRoot(rootPath)
  loadDbTeams(rootPath, { silent: true })
  loadCompetitions(rootPath)
  return true
}

// Reopens the game root saved from the previous session straight into the
// editor, with no folder prompt.
async function autoConnectSavedGameRoot() {
  if (!isDesktopApp || !window.electronAPI?.db?.getState) return

  let saved
  try {
    saved = await window.electronAPI.db.getState()
  } catch (e) {
    return
  }

  if (!saved?.hasGameRoot) {
    if (saved?.savedGameRootPath) {
      document.getElementById('root-path').value = saved.savedGameRootPath
      const status = document.getElementById('root-status')
      status.textContent = 'Saved game folder not found. Browse to select it again.'
      status.className = 'path-status err'
      updatePreviews()
    }
    return
  }

  applyDesktopRoot(saved.gameRootPath)
  if (await loadFromHandle(state.rootHandle)) {
    loadDbTeams(saved.gameRootPath, { silent: true })
    loadCompetitions(saved.gameRootPath)
  }
}

async function initDbPanel() {
  loadDbPanelState()
  syncDbPanelLayout()

  const toggleBtn = document.getElementById('db-toggle')
  const refreshBtn = document.getElementById('db-refresh')
  const searchInput = document.getElementById('db-search')

  toggleBtn?.addEventListener('click', () => {
    state.db.collapsed = !state.db.collapsed
    persistDbPanelState()
    syncDbPanelLayout()
  })

  refreshBtn?.addEventListener('click', () => {
    if (getActiveDbTab() === 'competitions') loadCompetitions()
    else loadDbTeams()
  })

  searchInput?.addEventListener('input', (e) => {
    state.db.search = e.target.value || ''
    applyDbFilter()
    renderDbTeams()
  })

  initCompetitions({ isDesktop: isDesktopApp, getRootPath: () => state.db.gameRootPath, toast })

  if (!isDesktopApp || !window.electronAPI?.db?.getState) {
    setDbStatus('DB panel is available only in Desktop (Electron).', 'err')
    return
  }

  // The saved game root is reconnected by autoConnectSavedGameRoot().
  state.db.teams = []
  applyDbFilter()
  renderDbTeams()
  setDbStatus('Desktop DB reader ready.')
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
  resetCompetitions()

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
  // Desktop reconnects to the saved game root on launch, so there is nothing to suggest.
  if (isDesktopApp) return
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

const MAX_ASSIGNED_STADIUMS = 64
const STADIUM_DEFAULT_TRIPLE = { police: '4', pitch: '0', net: '0' }

// Mirrors StadiumRuntime._parse_stadium_entries (stadium_runtime.py): a
// [stadium]/[comp] value is either the legacy shared-triple format
// (name1[,name2,...],police,pitch,net) or the newer per-stadium format
// (name1,police1,pitch1,net1[,name2,police2,pitch2,net2,...]), each stadium
// with its own triple. Disambiguated without a new delimiter: the
// per-stadium format's field count is always a multiple of 4 AND the field
// right after the first name is numeric (a real stadium folder name is
// never a bare number).
function parseStadiumEntries(rawValue) {
  const parts = String(rawValue || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length < 4) return []
  if (parts.length % 4 === 0 && /^\d+$/.test(parts[1])) {
    const entries = []
    for (let i = 0; i < parts.length; i += 4) {
      const [name, police, pitch, net] = parts.slice(i, i + 4)
      if (name && name !== 'None') entries.push({ name, police, pitch, net })
    }
    return entries
  }
  const net = parts[parts.length - 1]
  const pitch = parts[parts.length - 2]
  const police = parts[parts.length - 3]
  return parts
    .slice(0, -3)
    .filter((name) => name && name !== 'None')
    .map((name) => ({ name, police, pitch, net }))
}

function serializeStadiumEntries(stadiums) {
  return stadiums
    .map((s) => [s.name, s.police || STADIUM_DEFAULT_TRIPLE.police, s.pitch || STADIUM_DEFAULT_TRIPLE.pitch, s.net || STADIUM_DEFAULT_TRIPLE.net].join(','))
    .join(',')
}

function usesPackedStadiumItems(typeKey) {
  return (
    typeKey === 'stadium' ||
    typeKey === 'scoreboardstdname' ||
    typeKey === 'stadiumgoalpost' ||
    typeKey === 'stadiumgoalposttexture' ||
    typeKey === 'stadiumnetname' ||
    typeKey === 'scoreboard' ||
    typeKey === 'hometeamscoreboard'
  )
}

// Types whose items may be assigned more than once (e.g. one stadium for several teams).
function isReusableItemType(typeKey) {
  return typeKey === 'stadium'
}

function getComparableItemName(typeKey, itemName) {
  if (usesPackedStadiumItems(typeKey) && typeKey !== 'scoreboard' && typeKey !== 'hometeamscoreboard') {
    return normalizeStadiumItemName(itemName)
  }
  return itemName
}

function sanitizeStadiumPreviewName(folderName) {
  const cleaned = normalizeStadiumItemName(String(folderName || ''))
    .trim()
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() || ''
  return cleaned.replace(/[<>:"/\\|?*]/g, '_').replace(/\.+$/, '')
}

function isSupportedPreviewImage(file) {
  if (!file || !file.name) return false
  return /\.(png|jpe?g)$/i.test(file.name)
}

function pickStadiumPreviewFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.png,.jpg,.jpeg,image/png,image/jpeg'
    input.style.display = 'none'

    input.addEventListener('change', () => {
      const file = input.files && input.files.length ? input.files[0] : null
      input.remove()
      resolve(file)
    }, { once: true })

    document.body.appendChild(input)
    input.click()
  })
}

async function getStadiumPreviewDirectoryHandle(rootHandle, create = true) {
  const stadiumDir = await rootHandle.getDirectoryHandle('StadiumGBD')
  const renderDir = await stadiumDir.getDirectoryHandle('render', create ? { create: true } : undefined)
  const thumbnailDir = await renderDir.getDirectoryHandle('thumbnail', create ? { create: true } : undefined)
  return thumbnailDir.getDirectoryHandle('stadium', create ? { create: true } : undefined)
}

async function findStadiumPreviewFileName(stadiumFolderName) {
  if (!state.rootHandle) return ''

  const safeBaseName = sanitizeStadiumPreviewName(stadiumFolderName)
  if (!safeBaseName) return ''

  try {
    const stadiumPreviewDir = await getStadiumPreviewDirectoryHandle(state.rootHandle, false)
    for (const ext of ['.png', '.jpg', '.jpeg']) {
      const candidateName = safeBaseName + ext
      try {
        await stadiumPreviewDir.getFileHandle(candidateName)
        return candidateName
      } catch (e) {
        // try next extension
      }
    }
  } catch (e) {
    return ''
  }

  return ''
}

async function stadiumPreviewExists(stadiumFolderName) {
  return !!(await findStadiumPreviewFileName(stadiumFolderName))
}

function setPreviewActionButtonsState(actionsEl, hasPreview) {
  if (!actionsEl) return
  const uploadBtn = actionsEl.querySelector('.entry-preview-btn.upload')
  const changeBtn = actionsEl.querySelector('.entry-preview-btn.change')
  const openBtn = actionsEl.querySelector('.entry-preview-btn.open')
  const deleteBtn = actionsEl.querySelector('.entry-preview-btn.delete')

  if (uploadBtn) uploadBtn.style.display = hasPreview ? 'none' : ''
  if (changeBtn) changeBtn.style.display = hasPreview ? '' : 'none'
  if (openBtn) openBtn.style.display = hasPreview ? '' : 'none'
  if (deleteBtn) deleteBtn.style.display = hasPreview ? '' : 'none'
}

async function updateStadiumPreviewActionsState(actionsEl, stadiumFolderName) {
  if (!actionsEl) return
  const exists = await stadiumPreviewExists(stadiumFolderName)
  setPreviewActionButtonsState(actionsEl, exists)
}

function setPreviewActionBusy(actionsEl, busy) {
  if (!actionsEl) return
  const buttons = actionsEl.querySelectorAll('.entry-preview-btn')
  buttons.forEach((btn) => {
    btn.disabled = busy
  })
}

async function clearStadiumPreviewVariants(stadiumPreviewDir, safeBaseName) {
  for (const ext of ['.png', '.jpg', '.jpeg']) {
    try {
      await stadiumPreviewDir.removeEntry(safeBaseName + ext)
    } catch (e) {
      // ignore missing files
    }
  }
}

async function deleteStadiumPreview(stadiumFolderName) {
  if (state.currentSection !== 'stadium') {
    toast('Preview delete is only available in [stadium].', 'error')
    return false
  }

  if (!state.rootHandle) {
    toast('Load the FIFA root folder first.', 'error')
    return false
  }

  const rootHandle = await requestHandlePermission(state.rootHandle)
  if (!rootHandle) {
    toast('Folder permission is required to delete previews.', 'error')
    return false
  }

  const safeBaseName = sanitizeStadiumPreviewName(stadiumFolderName)
  if (!safeBaseName) {
    toast('Could not derive a valid stadium filename.', 'error')
    return false
  }

  try {
    const stadiumPreviewDir = await getStadiumPreviewDirectoryHandle(rootHandle, false)
    const existingFileName = await findStadiumPreviewFileName(stadiumFolderName)
    if (!existingFileName) {
      toast('No preview found to delete.', '')
      return false
    }
    if (!confirm(`Delete the preview "${existingFileName}"? This cannot be undone.`)) return false
    await clearStadiumPreviewVariants(stadiumPreviewDir, safeBaseName)
    toast('Preview deleted: ' + existingFileName, 'success')
    return true
  } catch (e) {
    toast('Could not delete preview: ' + (e?.message || e), 'error')
    return false
  }
}

// ============================================================
// PARAM PICKER (visual grid for police / pitch / net / goalposts)
// ============================================================
// 'ids' kinds are numeric ids backed by <id>.png previews in FSW/Images/<x>,
// with the raw FSW/<x> pack files as a fallback source of ids (no preview).
// 'folders' kinds are named pack folders that may ship a preview image.
const PARAM_PICKER_KINDS = {
  police: {
    title: 'Police',
    mode: 'ids',
    dirs: ['FSW/Images/Police', 'FSW/Police'],
    rawId: /^policeofficer_(\d+)_/i,
  },
  pitch: {
    title: 'Pitch Mow Pattern',
    mode: 'ids',
    dirs: ['FSW/Images/PitchMowPattern', 'FSW/PitchMowPattern'],
    rawId: /^pitchmowpattern_(\d+)_/i,
  },
  net: {
    title: 'Net',
    mode: 'ids',
    dirs: ['FSW/Images/Nets', 'FSW/Nets'],
    rawId: /^netcolor_(\d+)_/i,
  },
  goalpostModel: {
    title: 'Goalpost Model',
    mode: 'folders',
    dirs: ['FSW/Goalpost/GoalpostModel'],
  },
  goalpostTexture: {
    title: 'Goalpost Texture',
    mode: 'folders',
    dirs: ['FSW/Goalpost/GoalpostColor'],
  },
  entranceCam: {
    title: 'Entrance Camera',
    mode: 'folders',
    dirs: ['FSW/Camera/EntranceScene'],
  },
}

async function getDirectoryByPath(path) {
  let dir = state.rootHandle
  try {
    for (const part of path.split('/')) dir = await dir.getDirectoryHandle(part)
    return dir
  } catch (e) {
    return null
  }
}

async function loadParamPickerOptions(kind) {
  const cfg = PARAM_PICKER_KINDS[kind]
  if (!cfg || !state.rootHandle) return []

  if (cfg.mode === 'folders') {
    const baseDir = await getDirectoryByPath(cfg.dirs[0])
    if (!baseDir) return []
    const options = []
    for await (const entry of baseDir.values()) {
      if (entry.kind !== 'directory') continue
      options.push({
        value: entry.name,
        getPreview: async () => {
          for (const fileName of ['preview.png', 'preview.jpg', 'preview.jpeg']) {
            try {
              return await (await entry.getFileHandle(fileName)).getFile()
            } catch (e) {
              // try next extension
            }
          }
          return null
        },
      })
    }
    return options.sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }))
  }

  const found = new Map()
  for (const dirPath of cfg.dirs) {
    const dir = await getDirectoryByPath(dirPath)
    if (!dir) continue
    for await (const entry of dir.values()) {
      if (entry.kind !== 'file') continue
      const imageMatch = entry.name.match(/^(\d+)\.(png|jpe?g)$/i)
      if (imageMatch) {
        const id = imageMatch[1]
        if (!found.get(id)?.imageHandle) found.set(id, { imageHandle: entry })
        continue
      }
      const rawMatch = entry.name.match(cfg.rawId)
      if (rawMatch && !found.has(rawMatch[1])) found.set(rawMatch[1], { imageHandle: null })
    }
  }
  return [...found.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([id, { imageHandle }]) => ({
      value: id,
      getPreview: imageHandle ? () => imageHandle.getFile() : null,
    }))
}

async function openParamPickerFor(kind, current, onSelect) {
  if (!state.rootHandle) {
    toast('Load the FIFA root folder first.', 'error')
    return
  }
  const cfg = PARAM_PICKER_KINDS[kind]
  const options = await loadParamPickerOptions(kind)
  if (!options.length) {
    toast('No ' + cfg.title.toLowerCase() + ' assets found in ' + cfg.dirs[0] + '.', 'error')
    return
  }
  openParamPicker({ title: cfg.title, options, current: String(current ?? '').trim(), onSelect })
}

function createParamPickerButton(kind, getCurrent, onSelect) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'param-pick-btn'
  btn.title = 'Pick ' + PARAM_PICKER_KINDS[kind].title.toLowerCase() + ' visually'
  btn.setAttribute('aria-label', btn.title)
  btn.innerHTML = '<i class="fa-solid fa-pencil" aria-hidden="true"></i>'
  btn.addEventListener('click', () => openParamPickerFor(kind, getCurrent(), onSelect))
  return btn
}

// Sets a text/number control from a picker choice and fires 'change' so the
// field's own save handler runs, exactly as if it had been typed.
function applyPickedValue(control, value) {
  control.value = value
  control.dispatchEvent(new Event('change', { bubbles: true }))
}

function hasGameRoot() {
  return !!(state.rootHandle || getGameRootPathForDesktopActions())
}

function getGameRootPathForDesktopActions() {
  const dbRoot = String(state.db?.gameRootPath || '').trim()
  if (dbRoot) return dbRoot.replace(/[/\\]+$/, '')

  const rootInput = String(document.getElementById('root-path')?.value || '').trim()
  if (/^[a-zA-Z]:[\\/]/.test(rootInput) || /^\\\\/.test(rootInput)) {
    return rootInput.replace(/[/\\]+$/, '')
  }
  return ''
}

async function openStadiumPreviewLocation(stadiumFolderName) {
  if (!isDesktopApp || !window.electronAPI?.openPath) {
    toast('Open location is available only in Desktop (Electron).', 'error')
    return false
  }

  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) {
    toast('Game folder not set. Use "Change Paths" to select it.', 'error')
    return false
  }

  const existingFileName = await findStadiumPreviewFileName(stadiumFolderName)
  if (!existingFileName) {
    toast('No preview found to open.', '')
    return false
  }

  const previewFilePath = gameRoot + '\\StadiumGBD\\render\\thumbnail\\stadium\\' + existingFileName
  try {
    await window.electronAPI.openPath(previewFilePath)
    return true
  } catch (e) {
    toast('Could not open preview location: ' + (e?.message || e), 'error')
    return false
  }
}

async function uploadStadiumPreview(stadiumFolderName) {
  if (state.currentSection !== 'stadium') {
    toast('Preview upload is only available in [stadium].', 'error')
    return
  }

  if (!state.rootHandle) {
    toast('Load the FIFA root folder first.', 'error')
    return
  }

  const rootHandle = await requestHandlePermission(state.rootHandle)
  if (!rootHandle) {
    toast('Folder permission is required to save previews.', 'error')
    return
  }

  const file = await pickStadiumPreviewFile()
  if (!file) return

  if (!isSupportedPreviewImage(file)) {
    toast('Only PNG, JPG or JPEG files are supported.', 'error')
    return
  }

    const safeBaseName = sanitizeStadiumPreviewName(stadiumFolderName)
  if (!safeBaseName) {
    toast('Could not derive a valid stadium filename.', 'error')
      return false
  }

  const extMatch = file.name.match(/\.(png|jpe?g)$/i)
  const ext = extMatch ? extMatch[0].toLowerCase() : '.png'
  const targetFileName = safeBaseName + ext

  try {
    const stadiumPreviewDir = await getStadiumPreviewDirectoryHandle(rootHandle)
    await clearStadiumPreviewVariants(stadiumPreviewDir, safeBaseName)
    const fileHandle = await stadiumPreviewDir.getFileHandle(targetFileName, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(await file.arrayBuffer())
    await writable.close()
    toast('Preview saved: ' + targetFileName, 'success')
    return true
  } catch (e) {
    toast('Could not save preview: ' + (e?.message || e), 'error')
    return false
  }
}

// ============================================================
// CHANTS BULK EDIT MODAL
// ============================================================
function applyBulkSuffixToSection(secName, newSuffix) {
  const lines = state.sections[secName]
  if (!lines) return 0
  const cfg = getSectionConfig(secName)
  let count = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    if (!cfg.suffixRegex.test(trimmed)) continue
    const idMatch = trimmed.match(/^(\d+|\?\?\?)=/)
    if (!idMatch) continue
    const fullVal = trimmed.slice(trimmed.indexOf('=') + 1).replace(/\s*;.*$/, '').trim()
    const suffixMatch = fullVal.match(/(,[\d.,]+)$/)
    const folder = suffixMatch ? fullVal.slice(0, fullVal.length - suffixMatch[0].length).trim() : fullVal
    lines[i] = idMatch[1] + '=' + folder + newSuffix
    count++
  }
  return count
}

function openChantsBulkModal() {
  const cfg = GBD_TYPES.chantsid
  const columns = cfg.suffixColumns || []
  const defaults = (cfg.defaultSuffix || '').split(',').filter(Boolean)

  const entryCount = parseSection('chantsid').filter((e) => e.type === 'entry').length
  if (entryCount === 0) {
    toast('No chant entries to update yet.', '')
    return
  }

  const overlay = document.createElement('div')
  overlay.className = 'stadium-assets-modal-overlay'
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })

  const modal = document.createElement('div')
  modal.className = 'stadium-assets-modal chants-bulk-modal'
  overlay.appendChild(modal)

  const header = document.createElement('div')
  header.className = 'stadium-assets-modal-header'
  const title = document.createElement('span')
  title.className = 'stadium-assets-modal-name'
  title.textContent = 'Apply Values to All Chants'
  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn stadium-assets-modal-close'
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', () => overlay.remove())
  header.appendChild(title)
  header.appendChild(closeBtn)
  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'stadium-assets-modal-body'

  const hint = document.createElement('div')
  hint.className = 'chants-bulk-hint'
  hint.textContent = `Set a value for each field, then apply it to all ${entryCount} chant ${entryCount === 1 ? 'entry' : 'entries'}.`
  body.appendChild(hint)

  const fieldsWrap = document.createElement('div')
  fieldsWrap.className = 'chants-bulk-fields'

  const numberInputs = columns.map((col, idx) => {
    const min = col.min ?? 0
    const max = col.max ?? 1
    const step = col.step ?? 0.01
    const initial = defaults[idx] ?? min

    const row = document.createElement('div')
    row.className = 'chants-bulk-field'

    const label = document.createElement('label')
    label.textContent = col.label
    row.appendChild(label)

    const range = document.createElement('input')
    range.type = 'range'
    range.className = 'suffix-slider-range'
    range.min = min
    range.max = max
    range.step = step
    range.value = parseFloat(initial) || min

    const number = document.createElement('input')
    number.type = 'number'
    number.className = 'entry-suffix-input'
    number.min = min
    number.max = max
    number.step = step
    number.value = initial

    range.addEventListener('input', () => { number.value = range.value })
    number.addEventListener('input', () => {
      const v = parseFloat(number.value)
      if (!isNaN(v)) range.value = Math.min(max, Math.max(min, v))
    })

    row.appendChild(range)
    row.appendChild(number)
    fieldsWrap.appendChild(row)
    return number
  })

  body.appendChild(fieldsWrap)

  const actions = document.createElement('div')
  actions.className = 'chants-bulk-actions'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'btn'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.addEventListener('click', () => overlay.remove())

  const applyBtn = document.createElement('button')
  applyBtn.className = 'btn primary'
  applyBtn.textContent = 'Apply to All'
  applyBtn.addEventListener('click', () => {
    if (!confirm(`Apply these values to all ${entryCount} chant entries? This overwrites their current values.`)) return
    const values = numberInputs.map((inp) => (inp.value.trim() === '' ? '0' : inp.value.trim()))
    const newSuffix = ',' + values.join(',')
    const count = applyBulkSuffixToSection('chantsid', newSuffix)
    setUnsaved(true)
    renderEditor()
    overlay.remove()
    toast(`Applied to ${count} chant ${count === 1 ? 'entry' : 'entries'}.`, 'success')
  })

  actions.appendChild(cancelBtn)
  actions.appendChild(applyBtn)
  body.appendChild(actions)

  modal.appendChild(body)
  document.body.appendChild(overlay)
}

// ============================================================
// STADIUM ASSIGNMENT MODAL
// ============================================================
function locateStadiumLine(teamId, visualIdx) {
  const lines = state.sections.stadium || []
  if (visualIdx != null) {
    let dataCount = 0
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) continue
      if (!trimmed.match(/^(\d+|\?\?\?)=/)) continue
      if (dataCount === visualIdx) return i
      dataCount++
    }
    return -1
  }
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const m = trimmed.match(/^(\d+|\?\?\?)=/)
    if (m && m[1] === teamId) return i
  }
  return -1
}

function openStadiumAssignModal(teamId, visualIdx = null) {
  const lines = state.sections.stadium || []
  const lineIdx = locateStadiumLine(teamId, visualIdx)
  const currentId = lineIdx >= 0 ? lines[lineIdx].match(/^(\d+|\?\?\?)=/)[1] : teamId
  const existingRawVal = lineIdx >= 0 ? lines[lineIdx].slice(lines[lineIdx].indexOf('=') + 1).replace(/\s*;.*$/, '').trim() : ''
  let assigned = parseStadiumEntries(existingRawVal).map((s) => ({ ...s }))
  let selectedIdx = assigned.length ? 0 : -1
  let availableSearch = ''

  const teamInfo = state.db.teams.find((t) => String(t.id) === String(currentId))

  const overlay = document.createElement('div')
  overlay.className = 'stadium-assets-modal-overlay'
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })

  const modal = document.createElement('div')
  modal.className = 'stadium-assets-modal stadium-assign-modal'
  overlay.appendChild(modal)

  const header = document.createElement('div')
  header.className = 'stadium-assets-modal-header'
  const title = document.createElement('span')
  title.className = 'stadium-assets-modal-name'
  title.textContent = 'Assign Stadiums — Team ' + currentId + (teamInfo ? ' (' + teamInfo.name + ')' : '')
  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn stadium-assets-modal-close'
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', () => overlay.remove())
  header.appendChild(title)
  header.appendChild(closeBtn)
  modal.appendChild(header)

  const body = document.createElement('div')
  body.className = 'stadium-assets-modal-body stadium-assign-body'
  modal.appendChild(body)

  const countLabel = document.createElement('div')
  countLabel.className = 'stadium-assign-count'
  body.appendChild(countLabel)

  const columns = document.createElement('div')
  columns.className = 'stadium-assign-columns'
  body.appendChild(columns)

  // ---- Assigned column ----
  const assignedCol = document.createElement('div')
  assignedCol.className = 'stadium-assign-col'

  const assignedTitle = document.createElement('h4')
  assignedTitle.textContent = 'Assigned'
  assignedCol.appendChild(assignedTitle)

  const assignedListEl = document.createElement('div')
  assignedListEl.className = 'stadium-assign-list'
  assignedCol.appendChild(assignedListEl)

  const assignedToolbar = document.createElement('div')
  assignedToolbar.className = 'stadium-assign-toolbar'
  const moveUpBtn = document.createElement('button')
  moveUpBtn.className = 'btn'
  moveUpBtn.textContent = '▲'
  moveUpBtn.title = 'Move up'
  const moveDownBtn = document.createElement('button')
  moveDownBtn.className = 'btn'
  moveDownBtn.textContent = '▼'
  moveDownBtn.title = 'Move down'
  const removeBtn = document.createElement('button')
  removeBtn.className = 'btn'
  removeBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i> Remove'
  assignedToolbar.appendChild(moveUpBtn)
  assignedToolbar.appendChild(moveDownBtn)
  assignedToolbar.appendChild(removeBtn)
  assignedCol.appendChild(assignedToolbar)

  const paramsPanel = document.createElement('div')
  paramsPanel.className = 'stadium-assign-params'
  assignedCol.appendChild(paramsPanel)

  const previewPanel = document.createElement('div')
  previewPanel.className = 'entry-preview-actions stadium-assign-preview'

  // ---- Available column ----
  const availableCol = document.createElement('div')
  availableCol.className = 'stadium-assign-col'

  const availableTitle = document.createElement('h4')
  availableTitle.textContent = 'Available'
  availableCol.appendChild(availableTitle)

  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.className = 'search-box'
  searchInput.placeholder = 'Search stadium folders...'
  availableCol.appendChild(searchInput)

  const availableListEl = document.createElement('div')
  availableListEl.className = 'stadium-assign-list'
  availableCol.appendChild(availableListEl)

  const addBtn = document.createElement('button')
  addBtn.className = 'btn'
  addBtn.textContent = 'Add →'
  availableCol.appendChild(addBtn)
  availableCol.appendChild(previewPanel)

  columns.appendChild(availableCol)
  columns.appendChild(assignedCol)

  // ---- Footer ----
  const footer = document.createElement('div')
  footer.className = 'stadium-assign-footer'
  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'btn'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.addEventListener('click', () => overlay.remove())
  const saveBtn = document.createElement('button')
  saveBtn.className = 'btn'
  saveBtn.style.cssText = 'color:var(--accent); border-color:var(--accent);'
  saveBtn.textContent = 'Save'
  footer.appendChild(cancelBtn)
  footer.appendChild(saveBtn)
  modal.appendChild(footer)

  let availableSelectedName = null

  function isAssigned(rawFolderName) {
    const norm = normalizeStadiumItemName(rawFolderName)
    return assigned.some((s) => normalizeStadiumItemName(s.name) === norm)
  }

  function renderAssignedList() {
    assignedListEl.innerHTML = ''
    if (!assigned.length) {
      const empty = document.createElement('div')
      empty.className = 'stadium-assign-empty'
      empty.textContent = 'No stadiums assigned yet.'
      assignedListEl.appendChild(empty)
    }
    assigned.forEach((s, idx) => {
      const item = document.createElement('div')
      item.className = 'stadium-assign-list-item' + (idx === selectedIdx ? ' selected' : '')
      item.textContent = s.name
      item.title = s.name
      item.addEventListener('click', () => {
        selectedIdx = idx
        renderAll_()
      })
      assignedListEl.appendChild(item)
    })
  }

  function renderParamsPanel() {
    paramsPanel.innerHTML = ''
    previewPanel.innerHTML = ''
    if (selectedIdx < 0 || !assigned[selectedIdx]) {
      const hint = document.createElement('div')
      hint.className = 'stadium-assign-empty'
      hint.textContent = 'Select an assigned stadium to edit its Police/Pitch/Net and preview.'
      paramsPanel.appendChild(hint)
      return
    }
    const stadium = assigned[selectedIdx]

    GBD_TYPES.stadium.suffixColumns.forEach((col, colIdx) => {
      const field = ['police', 'pitch', 'net'][colIdx]
      const wrap = document.createElement('div')
      wrap.className = 'stadium-assign-param'
      const label = document.createElement('label')
      label.textContent = col.label
      const input = document.createElement('input')
      input.type = 'number'
      input.min = col.min
      input.value = stadium[field] || '0'
      input.addEventListener('change', () => {
        stadium[field] = input.value.trim() || '0'
      })
      wrap.appendChild(label)
      wrap.appendChild(input)
      if (col.pickerKind) {
        wrap.appendChild(createParamPickerButton(col.pickerKind, () => input.value, (v) => applyPickedValue(input, v)))
      }
      paramsPanel.appendChild(wrap)
    })

    const previewLabel = document.createElement('span')
    previewLabel.className = 'stadium-assign-preview-label'
    previewLabel.textContent = 'Stadium preview'

    const uploadBtn = document.createElement('button')
    uploadBtn.className = 'entry-preview-btn upload'
    uploadBtn.title = 'Upload stadium preview (PNG/JPG/JPEG)'
    uploadBtn.innerHTML = '<i class="fa-solid fa-upload" aria-hidden="true"></i>'
    const changeBtn = document.createElement('button')
    changeBtn.className = 'entry-preview-btn change'
    changeBtn.title = 'Change stadium preview (PNG/JPG/JPEG)'
    changeBtn.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i>'
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'entry-preview-btn delete'
    deleteBtn.title = 'Delete stadium preview'
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>'
    const openBtn = document.createElement('button')
    openBtn.className = 'entry-preview-btn open'
    openBtn.title = 'Open preview location'
    openBtn.innerHTML = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i>'

    uploadBtn.addEventListener('click', async () => {
      setPreviewActionBusy(previewPanel, true)
      const saved = await uploadStadiumPreview(stadium.name)
      setPreviewActionBusy(previewPanel, false)
      if (saved) await updateStadiumPreviewActionsState(previewPanel, stadium.name)
    })
    changeBtn.addEventListener('click', async () => {
      setPreviewActionBusy(previewPanel, true)
      const saved = await uploadStadiumPreview(stadium.name)
      setPreviewActionBusy(previewPanel, false)
      if (saved) await updateStadiumPreviewActionsState(previewPanel, stadium.name)
    })
    deleteBtn.addEventListener('click', async () => {
      setPreviewActionBusy(previewPanel, true)
      const deleted = await deleteStadiumPreview(stadium.name)
      setPreviewActionBusy(previewPanel, false)
      if (deleted) await updateStadiumPreviewActionsState(previewPanel, stadium.name)
    })
    openBtn.addEventListener('click', async () => {
      setPreviewActionBusy(previewPanel, true)
      await openStadiumPreviewLocation(stadium.name)
      setPreviewActionBusy(previewPanel, false)
    })

    previewPanel.appendChild(previewLabel)
    previewPanel.appendChild(uploadBtn)
    previewPanel.appendChild(changeBtn)
    previewPanel.appendChild(openBtn)
    previewPanel.appendChild(deleteBtn)
    setPreviewActionButtonsState(previewPanel, false)
    updateStadiumPreviewActionsState(previewPanel, stadium.name)
  }

  function renderAvailableList() {
    availableListEl.innerHTML = ''
    const q = availableSearch.trim().toLowerCase()
    const all = state.gbdFolders.stadium || []
    const filtered = all.filter((name) => !q || name.toLowerCase().includes(q))
    if (!filtered.length) {
      const empty = document.createElement('div')
      empty.className = 'stadium-assign-empty'
      empty.textContent = 'No stadium folders found.'
      availableListEl.appendChild(empty)
      return
    }
    filtered.forEach((name) => {
      const already = isAssigned(name)
      const item = document.createElement('div')
      item.className = 'stadium-assign-list-item' + (already ? ' disabled' : '') + (name === availableSelectedName ? ' selected' : '')
      item.textContent = name
      item.title = already ? name + ' (already assigned)' : name
      if (!already) {
        item.addEventListener('click', () => {
          availableSelectedName = name
          renderAll_()
        })
        item.addEventListener('dblclick', () => addStadium(name))
      }
      availableListEl.appendChild(item)
    })
  }

  function addStadium(rawName) {
    if (assigned.length >= MAX_ASSIGNED_STADIUMS) {
      toast('Maximum of ' + MAX_ASSIGNED_STADIUMS + ' stadiums reached.', 'error')
      return
    }
    if (isAssigned(rawName)) return
    assigned.push({ name: normalizeStadiumItemName(rawName), ...STADIUM_DEFAULT_TRIPLE })
    selectedIdx = assigned.length - 1
    availableSelectedName = null
    renderAll_()
  }

  function renderCount() {
    countLabel.textContent = assigned.length + ' / ' + MAX_ASSIGNED_STADIUMS + ' assigned'
    addBtn.disabled = assigned.length >= MAX_ASSIGNED_STADIUMS
  }

  function renderAll_() {
    renderCount()
    renderAssignedList()
    renderParamsPanel()
    renderAvailableList()
  }

  moveUpBtn.addEventListener('click', () => {
    if (selectedIdx <= 0) return
    const [item] = assigned.splice(selectedIdx, 1)
    assigned.splice(selectedIdx - 1, 0, item)
    selectedIdx -= 1
    renderAll_()
  })
  moveDownBtn.addEventListener('click', () => {
    if (selectedIdx < 0 || selectedIdx >= assigned.length - 1) return
    const [item] = assigned.splice(selectedIdx, 1)
    assigned.splice(selectedIdx + 1, 0, item)
    selectedIdx += 1
    renderAll_()
  })
  removeBtn.addEventListener('click', () => {
    if (selectedIdx < 0) return
    assigned.splice(selectedIdx, 1)
    selectedIdx = assigned.length ? Math.min(selectedIdx, assigned.length - 1) : -1
    renderAll_()
  })
  searchInput.addEventListener('input', () => {
    availableSearch = searchInput.value
    renderAvailableList()
  })
  addBtn.addEventListener('click', () => {
    if (availableSelectedName) addStadium(availableSelectedName)
  })

  saveBtn.addEventListener('click', () => {
    const targetLines = state.sections.stadium || (state.sections.stadium = [])
    if (!assigned.length) {
      if (lineIdx >= 0) targetLines.splice(lineIdx, 1)
    } else {
      const serialized = currentId + '=' + serializeStadiumEntries(assigned)
      if (lineIdx >= 0) {
        targetLines[lineIdx] = serialized
      } else {
        targetLines.push(serialized)
      }
    }
    setUnsaved(true)
    overlay.remove()
    renderAll()
    toast('Stadium assignment saved for team ' + currentId, 'success')
  })

  document.body.appendChild(overlay)
  renderAll_()
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
  if (isDesktopApp && window.electronAPI?.pickGameRoot) {
    try {
      const picked = await window.electronAPI.pickGameRoot()
      if (!picked || picked.canceled) return
      if (await connectDesktopRoot(picked.gameRootPath)) {
        toast('Root folder selected: ' + state.rootHandle.name, 'success')
      }
    } catch (e) {
      toast('Could not open folder: ' + (e?.message || e), 'error')
    }
    return
  }

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

// The runtime plays <name>.mp3 plus numbered variants (<name>2.mp3, <name>3.mp3...)
// sitting directly in the chant folder; anything else (ClubSong_old.mp3) is ignored.
function isNumberedTrack(fileName, baseName) {
  return new RegExp('^' + baseName + '\\d*\\.mp3$', 'i').test(fileName)
}

async function countMp3Files(dir) {
  let count = 0
  try {
    for await (const entry of dir.values()) {
      if (entry.kind === 'file' && /\.mp3$/i.test(entry.name)) count++
    }
  } catch (e) {
    // unreadable folder counts as empty
  }
  return count
}

// Collects the folders a [chantsid] / entrance line can point at, keyed by their
// path relative to FSW/Chants. A chant folder is the one holding Support/ and
// Complaint/ plus ClubSong.mp3 / Entrance.mp3, so those two sub-folders are part
// of it and never listed on their own. Folders that only group other folders are
// left out; an empty leaf is kept so a folder still being set up can be assigned.
async function scanChantFolders(dir, prefix, info) {
  const childDirs = []
  const trackDirs = {}
  let clubSong = 0
  let entrance = 0
  try {
    for await (const entry of dir.values()) {
      if (entry.kind === 'directory') {
        const key = entry.name.toLowerCase()
        if (prefix && (key === 'support' || key === 'complaint')) trackDirs[key] = entry
        else childDirs.push(entry)
      } else if (isNumberedTrack(entry.name, 'ClubSong')) {
        clubSong++
      } else if (isNumberedTrack(entry.name, 'Entrance')) {
        entrance++
      }
    }
  } catch (e) {
    return
  }

  const isChantFolder = clubSong > 0 || entrance > 0 || !!trackDirs.support || !!trackDirs.complaint
  if (prefix && (isChantFolder || childDirs.length === 0)) {
    const [support, complaint] = await Promise.all([
      trackDirs.support ? countMp3Files(trackDirs.support) : 0,
      trackDirs.complaint ? countMp3Files(trackDirs.complaint) : 0,
    ])
    info[prefix] = { support, complaint, clubSong, entrance }
  }

  await Promise.all(childDirs.map((child) => scanChantFolders(child, prefix ? prefix + '/' + child.name : child.name, info)))
}

// keepIni rescans the folders but leaves the in-memory settings.ini alone, so a
// reload with unsaved edits does not throw them away.
async function loadFromHandle(rootHandle, { keepIni = false } = {}) {
  showLoadingOverlay(keepIni ? 'Reloading folders…' : 'Loading settings and folders…')
  try {
    let fswDir
    let iniHandle
    try {
      fswDir = await rootHandle.getDirectoryHandle('FSW')
      iniHandle = await fswDir.getFileHandle('settings.ini')
    } catch (e) {
      toast('Could not find FSW\\settings.ini in the selected folder', 'error')
      return false
    }

    state.iniHandle = iniHandle
    if (!keepIni) {
      const file = await iniHandle.getFile()
      state.iniContent = await file.text()
      parseIni(state.iniContent)
    }

    state.gbdFolders = {}
    state.gbdPacks = {}
    state.chantInfo = {}
    clearStadiumAssetsCache()
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
        if (typeKey === 'chantsid') {
          state.chantInfo = {}
          await scanChantFolders(dir, '', state.chantInfo)
          folders = Object.keys(state.chantInfo)
        } else if (typeKey === 'stadiumnetid') {
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

    for (const [typeKey, typeConfig] of Object.entries(GBD_TYPES)) {
      if (!typeConfig.packPath) continue
      state.gbdPacks[typeKey] = []
      try {
        let dir = rootHandle
        for (const part of typeConfig.packPath.split('/')) dir = await dir.getDirectoryHandle(part)
        for await (const entry of dir.values()) {
          if (entry.kind === 'directory') state.gbdPacks[typeKey].push(entry.name)
        }
        state.gbdPacks[typeKey].sort()
      } catch (e) {
        // pack folder missing: dropdown stays empty
      }
    }

    for (const typeKey of Object.keys(GBD_TYPES)) {
      state.selectedItems[typeKey] = new Set()
    }

    showApp()
    renderAll()
    toast(
      keepIni
        ? 'Reloaded ' + totalLoaded + ' items - unsaved settings.ini edits kept'
        : 'Loaded ' + totalLoaded + ' items - settings.ini ready',
      'success',
    )
    return true
  } catch (e) {
    toast('Error loading: ' + e.message, 'error')
    console.error(e)
    return false
  } finally {
    hideLoadingOverlay()
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

// Picks up folders added, renamed or deleted outside the editor. settings.ini is
// re-read from disk too, unless there are unsaved edits, which stay as they are.
document.getElementById('btn-reload').addEventListener('click', async () => {
  if (!state.rootHandle) {
    toast('No game folder loaded', 'error')
    return
  }
  const btn = document.getElementById('btn-reload')
  btn.disabled = true
  try {
    const loaded = await loadFromHandle(state.rootHandle, { keepIni: state.unsaved })
    if (!loaded) return
    if (isDesktopApp && state.db.gameRootPath) {
      loadDbTeams(state.db.gameRootPath, { silent: true })
      loadCompetitions(state.db.gameRootPath)
    }
  } finally {
    btn.disabled = false
  }
})

async function fetchLatestRelease() {
  const res = await fetch('https://api.github.com/repos/michelMK45/cgfs-settings-editor/releases/latest')
  if (!res.ok) throw new Error('Network error')
  const data = await res.json()
  const latest = (data.tag_name || '').replace(/^v/, '')
  return { latest, hasUpdate: !!latest && latest !== __APP_VERSION__, data }
}

function setUpdateBadge(visible) {
  document.getElementById('btn-check-updates')?.classList.toggle('has-update', visible)
}

// Silent startup check: only lights the notification dot, never toasts on failure.
async function checkForUpdatesSilently() {
  try {
    const { hasUpdate } = await fetchLatestRelease()
    setUpdateBadge(hasUpdate)
  } catch {
    // offline or rate-limited: leave the badge off
  }
}

document.getElementById('btn-check-updates').addEventListener('click', async () => {
  const btn = document.getElementById('btn-check-updates')
  btn.disabled = true
  const origHTML = btn.innerHTML
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>Checking...'
  try {
    const { latest, hasUpdate, data } = await fetchLatestRelease()
    const current = __APP_VERSION__
    setUpdateBadge(hasUpdate)
    if (hasUpdate) {
      showUpdateModal(current, latest, data.html_url, data.body || '')
    } else {
      toast(`You're on the latest version (v${current})`, 'success')
    }
  } catch {
    toast('Could not check for updates. Check your connection.', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = origHTML
  }
})

function showUpdateModal(current, latest, releaseUrl, notes) {
  const overlay = document.createElement('div')
  overlay.className = 'stadium-assets-modal-overlay'
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })

  const modal = document.createElement('div')
  modal.className = 'stadium-assets-modal'
  modal.style.maxWidth = '480px'
  overlay.appendChild(modal)

  const header = document.createElement('div')
  header.className = 'stadium-assets-modal-header'

  const title = document.createElement('span')
  title.className = 'stadium-assets-modal-name'
  title.textContent = 'Update Available'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn stadium-assets-modal-close'
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', () => overlay.remove())

  header.appendChild(title)
  header.appendChild(closeBtn)
  modal.appendChild(header)

  const body = document.createElement('div')
  body.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 12px;'

  const info = document.createElement('p')
  info.style.cssText = 'color: var(--text2); font-size: 13px;'
  info.innerHTML = `Current version: <span style="color:var(--text)">v${current}</span>&nbsp;&nbsp;→&nbsp;&nbsp;Latest: <span style="color:var(--accent)">v${latest}</span>`
  body.appendChild(info)

  if (notes.trim()) {
    const notesEl = document.createElement('div')
    notesEl.className = 'markdown-body'
    notesEl.innerHTML = renderMarkdown(notes)
    body.appendChild(notesEl)
  }

  const actions = document.createElement('div')
  actions.style.cssText = 'display:flex; gap:8px; justify-content:flex-end;'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'btn'
  cancelBtn.textContent = 'Later'
  cancelBtn.addEventListener('click', () => overlay.remove())

  const downloadBtn = document.createElement('button')
  downloadBtn.className = 'btn'
  downloadBtn.style.cssText = 'color:var(--accent); border-color:var(--accent);'
  downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download'
  downloadBtn.addEventListener('click', () => { window.open(releaseUrl, '_blank'); overlay.remove() })

  actions.appendChild(cancelBtn)
  actions.appendChild(downloadBtn)
  body.appendChild(actions)

  modal.appendChild(body)
  document.body.appendChild(overlay)
}

// ============================================================
// INI PARSER
// ============================================================
function parseIni(content) {
  const lines = content.split('\n')
  const sections = {}
  const sectionOrder = []
  let current = '__header__'
  sections[current] = []

  for (const line of lines) {
    const m = line.match(/^\[(.+?)\]/)
    if (m) {
      current = m[1].toLowerCase()
      if (!sections[current]) {
        sections[current] = []
        sectionOrder.push(current)
      }
    } else {
      sections[current].push(line)
    }
  }
  state.sections = sections
  state.sectionOrder = sectionOrder
}

function buildIni() {
  let out = ''
  if (state.sections.__header__) {
    out += state.sections.__header__.join('\n')
  }
  const order = state.sectionOrder.length
    ? state.sectionOrder
    : ['scoreboard', 'hometeamscoreboard', 'derbyscoreboard', 'derbymatch', 'scoreboardstdname', 'tvlogo', 'hometeamtvlogo', 'derbytvlogo', 'movies', 'teammovies', 'stadiumnetid', 'stadiumnetname', 'chantsid', 'roundentrance', 'tournamententrance', 'kitsid', 'modules', 'stadium', 'stadiumgoalpost', 'stadiumgoalposttexture', 'stadiumentrancecam', 'ball', 'referee', 'wipe', 'adboard']
  const written = new Set()
  for (const sec of order) {
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
    kitsid: 'kitsid',
    movies: 'movies',
    scoreboard: 'scoreboard',
    scoreboardstdname: 'scoreboardstdname',
    stadium: 'stadium',
    teammovies: 'TeamMovies',
    modules: 'modules',
    hometeamscoreboard: 'hometeamscoreboard',
    derbymatch: 'derbymatch',
    derbyscoreboard: 'DerbyScoreBoard',
    derbytvlogo: 'DerbyTvLogo',
    roundentrance: 'roundentrance',
    tournamententrance: 'tournamententrance',
    stadiumentrancecam: 'stadiumentrancecam',
    hometeamtvlogo: 'hometeamtvlogo',
    ball: 'ball',
    referee: 'referee',
    wipe: 'wipe',
    adboard: 'adboard',
  }
  return map[sec] || sec
}

function getSectionLines(sec) {
  return state.sections[sec] || []
}

function getSectionConfig(secName) {
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
    if (secName === 'stadium') {
      const idMatch = trimmed.match(/^(\d+|\?\?\?)=(.*)$/)
      if (idMatch) {
        const id = idMatch[1]
        const rawVal = idMatch[2].replace(/\s*;.*$/, '').trim()
        const stadiums = parseStadiumEntries(rawVal)
        const first = stadiums[0]
        entries.push({
          type: 'entry',
          id,
          stadiums,
          folder: first ? first.name : '',
          suffix: first ? ',' + first.police + ',' + first.pitch + ',' + first.net : '',
          comment: '',
          raw: line,
        })
      } else {
        entries.push({ type: 'raw', raw: line })
      }
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
  if (state.currentType === 'stadium' && state.currentSection === 'stadiumassets') {
    renderItemList('stadium')
    renderStadiumAssetsPanel()
    updateCounts()
    return
  }
  renderItemList(state.currentType)
  renderEditor()
  updateCounts()
}

function renderGBDTypeTabs() {
  const container = document.querySelector('.gbd-type-tabs > div')
  container.innerHTML = ''

  for (const [typeKey, typeConfig] of Object.entries(GBD_TYPES)) {
    if (typeConfig.isSubSection || typeConfig.group || typeConfig.parentType) continue
    const isActiveTab = typeKey === getOwnerType(state.currentType)
    const tab = document.createElement('button')
    tab.className = 'btn' + (isActiveTab ? ' active' : '')
    tab.style.display = 'flex'
    tab.style.alignItems = 'center'
    tab.style.gap = '4px'
    if (isActiveTab) {
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
      document.getElementById('panel-db')?.classList.toggle('stadium-mode', typeKey === 'stadium')
    })

    container.appendChild(tab)
  }

  for (const [groupKey, group] of Object.entries(TYPE_GROUPS)) {
    const isActive = GBD_TYPES[state.currentType]?.group === groupKey
    const groupTab = document.createElement('button')
    groupTab.className = 'btn' + (isActive ? ' active' : '')
    groupTab.style.display = 'flex'
    groupTab.style.alignItems = 'center'
    groupTab.style.gap = '4px'
    if (isActive) {
      groupTab.style.color = 'var(--accent)'
      groupTab.style.borderColor = 'var(--accent)'
    }
    const total = group.members.reduce((sum, m) => sum + (state.gbdFolders[m]?.length || 0), 0)
    groupTab.innerHTML = `${group.name} <span style="font-size:9px;color:var(--text3);">(${total})</span>`
    groupTab.addEventListener('click', () => {
      const member = state.groupMember[groupKey] || group.members[0]
      state.currentType = member
      state.currentSection = getDefaultSectionForType(member)
      state.viewMode = 'visual'
      renderAll()
      updateEditorHint(member)
      document.getElementById('panel-db')?.classList.remove('stadium-mode')
    })
    container.appendChild(groupTab)
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
    stadium: 'Add stadium folders here, set the Team ID for each entry, and use the list icon (or click a team in the DB panel) to assign more than one stadium to a team.',
    scoreboard: 'Add scoreboard folders. Map to scoreboard IDs. Use the By Home Team sub-tab for home team overrides.',
    scoreboardstdname: 'Scoreboard stadium names: use [scoreboardstdname].',
    movies: 'Add movie folders for intro/outro sequences. Use sub-tabs for derby match and team-specific overrides.',
    tvlogo: 'Add TV logo folders. Use the By Home Team sub-tab for home team overrides.',
    stadiumnetid: 'Editor for stadium net IDs. Format: stadiumID=downDeep,highDeep,rig,shape,tension',
    chantsid: cfg?.hint || 'Raw editor for chant/goal song IDs.',
    kitsid: cfg?.hint || 'Kits - link a team ID to a kit folder.',
    stadiumnetname: cfg?.hint || 'Raw editor for stadium net names.',
    ball: cfg?.hint,
    referee: cfg?.hint,
    wipe: cfg?.hint,
    adboard: cfg?.hint,
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

    if (iniSec === 'stadium') {
      const idMatch = trimmed.match(/^(?:\d+|\?\?\?)=(.*)$/)
      if (idMatch) {
        const rawVal = idMatch[1].replace(/\s*;.*$/, '').trim()
        for (const s of parseStadiumEntries(rawVal)) {
          added.add(s.name)
          const normalized = normalizeStadiumItemName(s.name)
          added.add(normalized)
          added.add(normalized + '.zip')
          added.add(normalized + '.rar')
        }
      }
      continue
    }

    let folderName
    if (hasID) {
      const match = trimmed.match(/^(?:(?:\d+|\?\?\?)vs(?:\d+|\?\?\?)|\d+|\?\?\?)=([^,;]+)/)
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
  const items = getPanelItems(typeKey)
  const isInSubSection = typeConfig?.subSections?.includes(state.currentSection)
  const added = getAddedItems(typeKey, isInSubSection ? state.currentSection : null)

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
    const matchAdded = !state.hideAddedItems || !added.has(item)
    return matchSearch && matchFilter && matchAdded
  })

  document.getElementById('item-count').textContent = filtered.length
  document.getElementById('footer-stadiums-loaded').textContent = items.length + ' folders'

  const list = document.getElementById('item-list')
  delete list.dataset.treeView
  list.innerHTML = ''

  if (filtered.length === 0) {
    const msg = state.hideAddedItems && items.length > 0 && added.size === items.length
      ? 'All items are already added.'
      : 'No items match your search.'
    list.innerHTML = `<div class="empty-state"><p>${msg}</p></div>`
    return
  }

  // Several teams can share a stadium, so an added one keeps its check but stays pickable.
  const reusable = isReusableItemType(typeKey)

  filtered.forEach((item) => {
    const wasAdded = added.has(item)
    const isAdded = wasAdded && !reusable
    const isSelected = state.selectedItems[typeKey].has(item)

    const itemEl = document.createElement('div')
    itemEl.className = 'item' + (wasAdded ? ' added' : '') + (reusable ? ' reusable' : '') + (isSelected ? ' selected' : '')
    itemEl.dataset.item = item

    itemEl.innerHTML = `
      <span class="item-name" title="${item}">${item}</span>
      ${wasAdded ? '<div class="check-icon">✓</div>' : ''}
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

// What a chant folder holds, as compact chips, so it is clear what assigning it
// will play. Entrance sections only use the Entrance track, so only that is shown.
function buildChantChips(path) {
  const info = state.chantInfo[path]
  const chips = document.createElement('span')
  chips.className = 'tree-chips'
  if (!info) return chips

  const addChip = (icon, text, title, extraClass = '') => {
    const chip = document.createElement('span')
    chip.className = 'tree-chip' + (extraClass ? ' ' + extraClass : '')
    chip.title = title
    chip.innerHTML = (icon ? `<i class="fa-solid ${icon}"></i>` : '') + text
    chips.appendChild(chip)
  }
  const variants = (count) => (count > 1 ? '×' + count : '')

  if (isEntranceSection(state.currentSection)) {
    // Every folder listed here has the track, so only extra variants are worth a chip.
    if (info.entrance > 1) addChip('fa-person-walking', variants(info.entrance), `${info.entrance} Entrance variants, one picked at random`)
    return chips
  }

  if (info.support) addChip('fa-bullhorn', info.support, `Support: ${info.support} chant${info.support > 1 ? 's' : ''}`)
  if (info.complaint) addChip('fa-thumbs-down', info.complaint, `Complaint: ${info.complaint} chant${info.complaint > 1 ? 's' : ''} (losing by 3+)`)
  if (info.clubSong) addChip('fa-futbol', variants(info.clubSong), `ClubSong.mp3 - goal song${info.clubSong > 1 ? ` (${info.clubSong} variants)` : ''}`)
  if (info.entrance) addChip('fa-person-walking', variants(info.entrance), `Entrance.mp3 - entrance anthem${info.entrance > 1 ? ` (${info.entrance} variants)` : ''}`)
  if (!chips.childElementCount) addChip('', 'empty', 'No Support, Complaint, ClubSong.mp3 or Entrance.mp3 in this folder yet', 'warn')
  return chips
}

// Folder tree for types whose items are nested folder paths ("Spain/Santander").
// Every row is a folder: the ones in `items` can be assigned, the rest only group
// them. Expanded groups are remembered per type so re-renders keep the tree open.
function renderItemListTree(typeKey, items, added) {
  const typeConfig = GBD_TYPES[typeKey]
  const search = document.getElementById('search-items').value.trim().toLowerCase()
  const isChants = typeKey === 'chantsid'
  const entranceOnly = isChants && isEntranceSection(state.currentSection)
  const selected = state.selectedItems[typeKey]
  if (!state.treeExpanded[typeKey]) state.treeExpanded[typeKey] = new Set()
  const expanded = state.treeExpanded[typeKey]

  const addedCount = added.size
  const titleBase = entranceOnly ? 'Entrance folder' : typeConfig.name + ' folder'
  document.getElementById('left-panel-title').textContent = titleBase + (addedCount > 0 ? ` (${addedCount} added)` : '')
  document.getElementById('filter-tabs').innerHTML = ''
  document.getElementById('footer-stadiums-loaded').textContent = items.length + ' folders'

  const root = { path: '', assignable: false, children: new Map() }
  for (const item of items) {
    let node = root
    let path = ''
    for (const part of item.split('/')) {
      path = path ? path + '/' + part : part
      if (!node.children.has(part)) node.children.set(part, { name: part, path, assignable: false, children: new Map() })
      node = node.children.get(part)
    }
    node.assignable = true
  }

  // Assignable folders at or below a node that pass the search / hide-added filters.
  const isHit = (node) =>
    node.assignable && (!search || node.path.toLowerCase().includes(search)) && !(state.hideAddedItems && added.has(node.path))
  const countHits = (node) => {
    if (node.hits === undefined) {
      node.hits = isHit(node) ? 1 : 0
      for (const child of node.children.values()) node.hits += countHits(child)
    }
    return node.hits
  }

  const list = document.getElementById('item-list')
  const viewKey = typeKey + ':' + state.currentSection
  const scrollTop = list.dataset.treeView === viewKey ? list.scrollTop : 0
  list.dataset.treeView = viewKey
  list.innerHTML = ''

  const totalHits = countHits(root)
  document.getElementById('item-count').textContent = totalHits

  if (totalHits === 0) {
    let msg = 'No items match your search.'
    if (items.length === 0) {
      msg = entranceOnly
        ? 'No chant folder contains an Entrance.mp3.<br>Add one to a folder in FSW/Chants and reload.'
        : 'No folders found.'
    } else if (state.hideAddedItems && items.every((item) => added.has(item))) {
      msg = 'All items are already added.'
    }
    list.innerHTML = `<div class="empty-state"><p>${msg}</p></div>`
    return
  }

  // With a search, or only a handful of folders, show everything already open.
  const autoExpand = !!search || totalHits <= 12

  const syncSelection = () => {
    list.querySelectorAll('.tree-row[data-item]').forEach((el) => {
      el.classList.toggle('selected', selected.has(el.dataset.item))
    })
  }

  const renderNodes = (parent, depth) => {
    const nodes = [...parent.children.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    for (const node of nodes) {
      if (countHits(node) === 0) continue

      const hasChildren = [...node.children.values()].some((child) => countHits(child) > 0)
      const isOpen = hasChildren && (autoExpand || expanded.has(node.path))
      const isAdded = node.assignable && added.has(node.path)

      const row = document.createElement('div')
      row.className =
        'item tree-row' +
        (node.assignable ? '' : ' tree-group') +
        (isAdded ? ' added' : '') +
        (node.assignable && selected.has(node.path) ? ' selected' : '')
      row.style.paddingLeft = 8 + depth * 14 + 'px'
      row.title = node.path
      if (node.assignable) row.dataset.item = node.path

      const toggle = document.createElement('span')
      toggle.className = 'tree-toggle'
      if (hasChildren) toggle.innerHTML = `<i class="fa-solid fa-chevron-${isOpen ? 'down' : 'right'}"></i>`
      row.appendChild(toggle)

      const icon = document.createElement('i')
      icon.className = 'tree-icon fa-solid ' + (isOpen ? 'fa-folder-open' : 'fa-folder')
      row.appendChild(icon)

      const name = document.createElement('span')
      name.className = 'item-name'
      name.textContent = node.name
      row.appendChild(name)

      if (node.assignable) {
        if (isChants) row.appendChild(buildChantChips(node.path))
      } else {
        const count = document.createElement('span')
        count.className = 'tree-count'
        count.textContent = countHits(node)
        row.appendChild(count)
      }

      if (isAdded) {
        const check = document.createElement('div')
        check.className = 'check-icon'
        check.textContent = '✓'
        row.appendChild(check)
      }

      const toggleOpen = (e) => {
        e.stopPropagation()
        if (!hasChildren || autoExpand) return
        expanded.has(node.path) ? expanded.delete(node.path) : expanded.add(node.path)
        renderItemList(typeKey)
      }

      if (node.assignable) {
        toggle.addEventListener('click', toggleOpen)
        toggle.addEventListener('dblclick', (e) => e.stopPropagation())

        row.addEventListener('click', (e) => {
          if (isAdded) return
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            selected.has(node.path) ? selected.delete(node.path) : selected.add(node.path)
          } else {
            selected.clear()
            selected.add(node.path)
          }
          syncSelection()
        })

        row.addEventListener('dblclick', () => {
          if (isAdded) return
          if (state.viewMode === 'visual') {
            addItemsToSection(typeKey, [node.path])
          } else if (typeConfig.rawWithPanel) {
            insertTextAtRawCursor(node.path)
          }
        })
      } else {
        row.addEventListener('click', toggleOpen)
      }

      list.appendChild(row)
      if (isOpen) renderNodes(node, depth + 1)
    }
  }

  renderNodes(root, 0)
  list.scrollTop = scrollTop
}

// Stadium tab: Entries, one tab per sub-section (goalposts, entrance camera) and
// Assets. Shared by the entries editor and the Assets panel, which replaces it.
function renderStadiumSectionTabs(tabsContainer, activeSection) {
  tabsContainer.innerHTML = ''
  const stadiumCfg = GBD_TYPES.stadium
  const addTab = (label, count, sectionName, onClick) => {
    const tab = document.createElement('div')
    tab.className = 'section-tab' + (sectionName === activeSection ? ' active' : '')
    tab.innerHTML = count == null ? label : `${label} <span class="tab-count">${count}</span>`
    if (sectionName !== activeSection) tab.addEventListener('click', onClick)
    tabsContainer.appendChild(tab)
  }
  const openSection = (sectionName) => () => {
    state.currentSection = sectionName
    renderAll()
    const subHint = GBD_TYPES[sectionName]?.hint
    document.getElementById('editor-hint').textContent = subHint || ''
    if (!subHint) updateEditorHint('stadium')
  }
  const countOf = (sectionName) => parseSection(sectionName).filter((e) => e.type === 'entry').length

  addTab('Entries', countOf(stadiumCfg.iniSection), stadiumCfg.iniSection, openSection(stadiumCfg.iniSection))
  for (const subSec of stadiumCfg.subSections) {
    addTab(`[${getSectionName(subSec)}]`, countOf(subSec), subSec, openSection(subSec))
  }
  addTab('Assets', null, 'stadiumassets', () => {
    state.currentSection = 'stadiumassets'
    renderAll()
  })
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
  document.getElementById('toolbar-sep-adding-selected').style.display = hasPanel ? '' : 'none'
  document.getElementById('btn-add-all').style.display = hasPanel ? '' : 'none'
  document.getElementById('btn-add-entry').style.display = hidePanel ? '' : 'none'
  const isInSubSection = typeConfig?.subSections?.includes(state.currentSection)
  const hideSortBtn = isRawOnly || state.currentType === 'stadiumnetname' || state.currentType === 'scoreboardstdname' || isInSubSection
  document.getElementById('btn-sort').style.display = hideSortBtn ? 'none' : ''
  document.getElementById('entry-search').style.display = hideSortBtn ? 'none' : ''
  document.getElementById('btn-chants-bulk').style.display = !hideSortBtn && state.currentType === 'chantsid' ? '' : 'none'
  const layout = document.querySelector('.main-layout')
  if (layout) {
    layout.classList.toggle('left-hidden', !hasPanel)
  }

  const tabsContainer = document.getElementById('section-tabs')
  tabsContainer.innerHTML = ''
  const createSectionTab = (sectionName, labelOverride, ownerType = state.currentType) => {
    const tab = document.createElement('div')
    tab.className = 'section-tab' + (sectionName === state.currentSection ? ' active' : '')
    tab.dataset.section = sectionName
    const count = parseSection(sectionName).filter((e) => e.type === 'entry').length
    const label = labelOverride || `[${getSectionName(sectionName)}]`
    tab.innerHTML = `${label} <span class="tab-count">${count}</span>`
    tab.addEventListener('click', () => {
      if (state.currentSection === sectionName) return
      const switchType = ownerType !== state.currentType
      state.currentType = ownerType
      state.currentSection = sectionName
      if (switchType) {
        renderAll()
      } else {
        renderItemList(state.currentType)
        renderEditor()
      }
      const subHint = GBD_TYPES[sectionName]?.hint
      if (subHint) document.getElementById('editor-hint').textContent = subHint
      else updateEditorHint(state.currentType)
    })
    tabsContainer.appendChild(tab)
  }

  const ownerType = getOwnerType(state.currentType)
  const ownerCfg = GBD_TYPES[ownerType]
  if (state.currentType === 'stadium') {
    renderStadiumSectionTabs(tabsContainer, state.currentSection)
  } else if (ownerCfg.subSections?.length || LINKED_TYPES[ownerType]) {
    createSectionTab(ownerCfg.iniSection, null, ownerType)
    for (const subSec of ownerCfg.subSections || []) {
      createSectionTab(subSec, null, ownerType)
    }
    for (const linked of LINKED_TYPES[ownerType] || []) {
      createSectionTab(GBD_TYPES[linked].iniSection, GBD_TYPES[linked].tabLabel, linked)
    }
  } else if (typeConfig?.group) {
    const group = TYPE_GROUPS[typeConfig.group]
    state.groupMember[typeConfig.group] = state.currentType
    for (const member of group.members) {
      const memberCfg = GBD_TYPES[member]
      const tab = document.createElement('div')
      tab.className = 'section-tab' + (member === state.currentType ? ' active' : '')
      const count = parseSection(memberCfg.iniSection).filter((e) => e.type === 'entry').length
      tab.innerHTML = `${memberCfg.tabLabel || memberCfg.name} <span class="tab-count">${count}</span>`
      tab.addEventListener('click', () => {
        if (member === state.currentType) return
        state.currentType = member
        state.currentSection = getDefaultSectionForType(member)
        renderAll()
        updateEditorHint(member)
      })
      tabsContainer.appendChild(tab)
    }
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
  const isStadiumSection = secName === 'stadium'

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
      cols = isStadiumSection ? `75px 1fr ${suffixCols} 170px 36px 24px` : `75px 1fr ${suffixCols} 24px`
    } else {
      cols = `1fr ${suffixCols} 24px`
    }
  } else {
    if (hasID && secConfig.isDerbyMatch) {
      cols = '65px 65px 1fr 24px'
    } else if (hasID) {
      if (secConfig.suffixEditable) {
        cols = isStadiumSection ? '70px 1fr 160px 170px 24px' : '70px 1fr 160px 24px'
      } else {
        cols = isStadiumSection ? '70px 1fr 170px 24px' : '70px 1fr 24px'
      }
    } else {
      cols = secConfig.suffixEditable ? '1fr 160px 24px' : '1fr 24px'
    }
  }

  const header = document.createElement('div')
  header.style.cssText = `display:grid;grid-template-columns:${cols};gap:6px;padding:4px 15px 8px;border-bottom:1px solid var(--border);margin-bottom:4px;position:sticky;top:0;background:var(--bg2);z-index:1;font-weight:bold;`

  let headerHTML = ''
  if (hasID && secConfig.isDerbyMatch) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Home</span>'
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Away</span>'
  } else if (hasID) {
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
  if (isStadiumSection) {
    headerHTML += '<span style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;">Preview</span>'
    headerHTML += '<span></span>'
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
    const searchName = entry.stadiums?.length ? entry.stadiums.map((s) => s.name).join(' ') : entry.folder
    row.dataset.search = [entry.id, searchName].filter(Boolean).join(' ').toLowerCase()

    let idInput = null
    let derbyHomeInput = null
    let derbyAwayInput = null
    if (hasID) {
      if (secConfig.isDerbyMatch) {
        const rawParts = entry.id ? entry.id.split('vs') : []
        const homeVal = rawParts[0] === '???' ? '' : (rawParts[0] || '')
        const awayVal = rawParts[1] === '???' ? '' : (rawParts[1] || '')

        const makeDerbyInput = (value, placeholder) => {
          const inp = document.createElement('input')
          inp.type = 'text'
          inp.className = 'entry-id ' + (value ? 'has-id' : 'no-id')
          inp.value = value
          inp.placeholder = placeholder
          inp.addEventListener('input', () => {
            inp.className = 'entry-id ' + (inp.value.trim() ? 'has-id' : 'no-id')
          })
          inp.addEventListener('change', () => {
            inp.className = 'entry-id ' + (inp.value.trim() ? 'has-id' : 'no-id')
            const h = derbyHomeInput.value.trim()
            const a = derbyAwayInput.value.trim()
            updateEntryLine(secName, myVisualIdx, (h || '???') + 'vs' + (a || '???'), entry.suffix, undefined)
          })
          inp.addEventListener('dragover', (e) => {
            const droppedId = getDraggedTeamId(e.dataTransfer)
            if (!droppedId) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            inp.classList.add('drag-over')
          })
          inp.addEventListener('dragleave', () => inp.classList.remove('drag-over'))
          inp.addEventListener('drop', (e) => {
            e.preventDefault()
            inp.classList.remove('drag-over')
            const droppedId = getDraggedTeamId(e.dataTransfer).trim()
            if (!/^\d+$/.test(droppedId)) {
              toast('Dropped value is not a valid numeric ID.', 'error')
              return
            }
            inp.value = droppedId
            inp.className = 'entry-id has-id'
            inp.dispatchEvent(new Event('change', { bubbles: true }))
          })
          return inp
        }

        derbyHomeInput = makeDerbyInput(homeVal, 'Home ID')
        derbyAwayInput = makeDerbyInput(awayVal, 'Away ID')
      } else {
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
          if (isStadiumSection) {
            updateStadiumEntryId(secName, myVisualIdx, idInput.value.trim())
            return
          }
          let sv = ''
          if (hasSuffixColumns) {
            sv = joinSuffixValues(secConfig, suffixInputs)
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
    }

    const stadiumMultiMode = isStadiumSection && (!entry.stadiums || entry.stadiums.length !== 1)

    let folderEl = null
    if ((!hideFolder || isScoreboardStdName) && !stadiumMultiMode) {
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

    let stadiumSummaryEl = null
    if (stadiumMultiMode) {
      stadiumSummaryEl = document.createElement('div')
      stadiumSummaryEl.className = 'entry-stadium-summary'
      const names = (entry.stadiums || []).map((s) => s.name)
      stadiumSummaryEl.textContent = names.length
        ? names.length + ' stadiums: ' + names.join(', ')
        : 'No stadium assigned'
      stadiumSummaryEl.title = names.join(', ')
      stadiumSummaryEl.style.gridColumn = '2 / span 5'
    }

    let suffixInput = null
    let suffixInputs = []
    let suffixElements = []
    let commentInput = null

    if (secConfig.suffixEditable && !stadiumMultiMode) {
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
          let domEl

          if (col.type === 'spinner') {
            control = document.createElement('input')
            control.type = 'number'
            control.className = 'entry-suffix-input'
            control.value = suffixParts[idx] || ''
            control.min = col.min
            control.max = col.max
            control.placeholder = col.placeholder
            domEl = control
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
            domEl = control
          } else if (col.type === 'slider') {
            control = document.createElement('input')
            control.type = 'text'
            control.className = 'entry-suffix-input'
            control.value = suffixParts[idx] || ''
            control.placeholder = col.placeholder

            const sliderWrap = document.createElement('div')
            sliderWrap.className = 'suffix-slider-wrap'
            sliderWrap.appendChild(control)

            const popup = document.createElement('div')
            popup.className = 'suffix-slider-popup'

            const rangeInput = document.createElement('input')
            rangeInput.type = 'range'
            rangeInput.className = 'suffix-slider-range'
            rangeInput.min = col.min ?? 0
            rangeInput.max = col.max ?? 1
            rangeInput.step = col.step ?? 0.01
            rangeInput.value = parseFloat(control.value) || (col.min ?? 0)

            const valLabel = document.createElement('span')
            valLabel.className = 'suffix-slider-val'
            valLabel.textContent = rangeInput.value

            popup.appendChild(rangeInput)
            popup.appendChild(valLabel)
            sliderWrap.appendChild(popup)

            rangeInput.addEventListener('input', () => {
              control.value = rangeInput.value
              valLabel.textContent = rangeInput.value
              control.dispatchEvent(new Event('change', { bubbles: true }))
            })

            control.addEventListener('input', () => {
              const v = parseFloat(control.value)
              if (!isNaN(v)) {
                rangeInput.value = Math.min(col.max ?? 1, Math.max(col.min ?? 0, v))
                valLabel.textContent = rangeInput.value
              }
            })

            sliderWrap.addEventListener('focusin', () => sliderWrap.classList.add('active'))
            sliderWrap.addEventListener('focusout', (e) => {
              if (!sliderWrap.contains(e.relatedTarget)) sliderWrap.classList.remove('active')
            })

            domEl = sliderWrap
          } else {
            control = document.createElement('input')
            control.type = 'text'
            control.className = 'entry-suffix-input'
            control.value = suffixParts[idx] || ''
            control.placeholder = col.placeholder
            domEl = control
          }

          if (col.pickerKind) {
            const pickerWrap = document.createElement('div')
            pickerWrap.className = 'entry-picker-wrap'
            pickerWrap.appendChild(domEl)
            pickerWrap.appendChild(createParamPickerButton(col.pickerKind, () => control.value, (v) => applyPickedValue(control, v)))
            domEl = pickerWrap
          }

          control.addEventListener('change', () => {
            let newSuffix
            if (secConfig.isScoreboardStdName) {
              const stadiumName = suffixInputs[0].value.trim()
              newSuffix = stadiumName
            } else {
              newSuffix = joinSuffixValues(secConfig, suffixInputs)
            }
            const currentComment = commentInput ? commentInput.value.trim() : undefined
            if (hasID) {
              updateEntryLine(secName, myVisualIdx, idInput ? idInput.value.trim() : '', newSuffix, currentComment)
            } else {
              updateEntryLine(secName, myVisualIdx, '', newSuffix, currentComment)
            }
          })
          suffixInputs.push(control)
          suffixElements.push(domEl)
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

    let previewActionsEl = null
    if (isStadiumSection && !stadiumMultiMode) {
      previewActionsEl = document.createElement('div')
      previewActionsEl.className = 'entry-preview-actions'

      const uploadBtn = document.createElement('button')
      uploadBtn.className = 'entry-preview-btn upload'
      uploadBtn.title = 'Upload stadium preview (PNG/JPG/JPEG)'
      uploadBtn.innerHTML = '<i class="fa-solid fa-upload" aria-hidden="true"></i>'

      const changeBtn = document.createElement('button')
      changeBtn.className = 'entry-preview-btn change'
      changeBtn.title = 'Change stadium preview (PNG/JPG/JPEG)'
      changeBtn.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i>'

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'entry-preview-btn delete'
      deleteBtn.title = 'Delete stadium preview'
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>'

      const openBtn = document.createElement('button')
      openBtn.className = 'entry-preview-btn open'
      openBtn.title = 'Open preview location'
      openBtn.innerHTML = '<i class="fa-solid fa-folder-open" aria-hidden="true"></i>'

      uploadBtn.addEventListener('click', async () => {
        setPreviewActionBusy(previewActionsEl, true)
        const saved = await uploadStadiumPreview(entry.folder)
        setPreviewActionBusy(previewActionsEl, false)
        if (saved) await updateStadiumPreviewActionsState(previewActionsEl, entry.folder)
      })

      changeBtn.addEventListener('click', async () => {
        setPreviewActionBusy(previewActionsEl, true)
        const saved = await uploadStadiumPreview(entry.folder)
        setPreviewActionBusy(previewActionsEl, false)
        if (saved) await updateStadiumPreviewActionsState(previewActionsEl, entry.folder)
      })

      deleteBtn.addEventListener('click', async () => {
        setPreviewActionBusy(previewActionsEl, true)
        const deleted = await deleteStadiumPreview(entry.folder)
        setPreviewActionBusy(previewActionsEl, false)
        if (deleted) await updateStadiumPreviewActionsState(previewActionsEl, entry.folder)
      })

      openBtn.addEventListener('click', async () => {
        setPreviewActionBusy(previewActionsEl, true)
        await openStadiumPreviewLocation(entry.folder)
        setPreviewActionBusy(previewActionsEl, false)
      })

      previewActionsEl.appendChild(uploadBtn)
      previewActionsEl.appendChild(changeBtn)
      previewActionsEl.appendChild(openBtn)
      previewActionsEl.appendChild(deleteBtn)
      setPreviewActionButtonsState(previewActionsEl, false)
      updateStadiumPreviewActionsState(previewActionsEl, entry.folder)
    }

    let assignBtn = null
    if (isStadiumSection) {
      assignBtn = document.createElement('button')
      assignBtn.className = 'entry-preview-btn assign'
      assignBtn.title = 'Manage stadium assignment...'
      assignBtn.innerHTML = '<i class="fa-solid fa-list-check" aria-hidden="true"></i>'
      assignBtn.addEventListener('click', () => {
        openStadiumAssignModal(entry.id, myVisualIdx)
      })
    }

    if (hideFolder) {
      commentInput = document.createElement('input')
      commentInput.type = 'text'
      commentInput.className = 'entry-comment-input'
      commentInput.value = entry.comment || ''
      commentInput.placeholder = 'e.g. Estadio Mestalla'
      commentInput.addEventListener('change', () => {
        const sv = joinSuffixValues(secConfig, suffixInputs)
        updateEntryLine(secName, myVisualIdx, idInput ? idInput.value.trim() : '', sv, commentInput.value.trim())
      })
    }

    if (derbyHomeInput) {
      row.appendChild(derbyHomeInput)
      row.appendChild(derbyAwayInput)
    } else if (idInput) {
      row.appendChild(idInput)
    }
    if (folderEl) row.appendChild(folderEl)
    if (stadiumSummaryEl) row.appendChild(stadiumSummaryEl)
    if (hasSuffixColumns && suffixInputs.length) {
      suffixElements.forEach((el) => row.appendChild(el))
    } else if (suffixInput) {
      row.appendChild(suffixInput)
    }
    if (commentInput) row.appendChild(commentInput)
    if (previewActionsEl) row.appendChild(previewActionsEl)
    if (assignBtn) row.appendChild(assignBtn)
    row.appendChild(delBtn)
    editorEl.appendChild(row)
  })

  applyEntrySearchFilter()
  updateCounts()
}

// Builds the ",a,b,c" suffix from a row's inputs. Older 4-value net entries have
// no Tension, so trailing blanks are dropped for sections that opt in (leaving it
// unset rather than writing a blank field that would shift the saved list).
function joinSuffixValues(secConfig, inputs) {
  const values = inputs.map((inp) => inp.value.trim())
  if (secConfig.trimTrailingEmpty) {
    while (values.length && values[values.length - 1] === '') values.pop()
  }
  return ',' + values.join(',')
}

function applyEntrySearchFilter() {
  const searchInput = document.getElementById('entry-search')
  const editorEl = document.getElementById('item-editor')
  const term = searchInput.value.trim().toLowerCase()
  const rows = editorEl.querySelectorAll('.entry-row')

  let visibleCount = 0
  rows.forEach((row) => {
    const matches = !term || row.dataset.search.includes(term)
    row.style.display = matches ? '' : 'none'
    if (matches) visibleCount++
  })

  let emptyMsg = editorEl.querySelector('.entry-search-empty')
  if (term && rows.length > 0 && visibleCount === 0) {
    if (!emptyMsg) {
      emptyMsg = document.createElement('div')
      emptyMsg.className = 'empty-state entry-search-empty'
      emptyMsg.innerHTML = '<p>No entries match your search.</p>'
      editorEl.appendChild(emptyMsg)
    }
  } else if (emptyMsg) {
    emptyMsg.remove()
  }
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
    if (hasID && !trimmed.startsWith('???') && !trimmed.match(/^\d+(vs(?:\d+|\?\?\?))?=/)) continue

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
        // CGFS splits the value on "," as-is, so no leading comma (see addItemsToSection).
        lines[i] = targetEntry.folder + '=' + (suffix.startsWith(',') ? suffix.slice(1) : suffix)
      }
      setUnsaved(true)
      break
    }
    dataCount++
  }
}

// Renames the team ID on a [stadium] line without touching the assigned
// stadiums payload after '=' — updateEntryLine rebuilds the suffix from the
// row's Police/Pitch/Net inputs, which don't exist for multi-stadium rows
// and would otherwise collapse the line to a bare comma.
function updateStadiumEntryId(secName, visualIdx, newId) {
  const lines = state.sections[secName]
  let dataCount = 0
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    if (!trimmed.match(/^(\d+|\?\?\?)=/)) continue

    if (dataCount === visualIdx) {
      const eqIdx = lines[i].indexOf('=')
      lines[i] = (newId || '???') + lines[i].slice(eqIdx)
      setUnsaved(true)
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
  const isInSubSection = typeConfig.subSections?.includes(state.currentSection)
  const iniSec =
    (typeKey === 'scoreboardstdname' && isScoreboardStdSection(state.currentSection)) || isInSubSection
      ? state.currentSection
      : typeConfig.iniSection
  const added = getAddedItems(typeKey, iniSec)
  const toAdd = items.filter((item) => {
    if (isReusableItemType(typeKey)) return true
    const comparable = getComparableItemName(typeKey, item)
    return !added.has(item) && !added.has(comparable)
  })

  if (!toAdd.length) {
    toast('All selected items are already in [' + iniSec + ']', '')
    return
  }

  if (!state.sections[iniSec]) state.sections[iniSec] = []

  const activeCfg = GBD_TYPES[iniSec] || typeConfig
  const defaultSuffix = activeCfg.defaultSuffix || ''
  const hasID = activeCfg.hasID !== false

  toAdd.forEach((item) => {
    const itemToWrite = getComparableItemName(typeKey, item)
    if (activeCfg.isScoreboardStdName || typeConfig.isScoreboardStdName) {
      if (activeCfg.packPath) {
        state.sections[iniSec].push(itemToWrite + '=' + (state.gbdPacks[iniSec]?.[0] || ''))
      } else {
        state.sections[iniSec].push(itemToWrite + '=' + itemToWrite + defaultSuffix)
      }
    } else if (activeCfg.isDerbyMatch) {
      state.sections[iniSec].push('???vs???=' + itemToWrite + defaultSuffix)
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
    if (hasID && !trimmed.match(/^(\d+(vs\d+)?|\?\?\?(vs\?\?\?)?)=.+/)) continue

    if (dataCount === visualIdx) {
      state.sections[secName].splice(i, 1)
      break
    }
    dataCount++
  }

  setUnsaved(true)
  renderAll()
}

// Same grouping as CGFS's module catalog (server16_py/module_catalog.py).
const MODULE_CATEGORIES = [
  ['Stadium', ['Stadium', 'EntranceCam', 'Goalposts', 'StadiumNet']],
  ['UI', ['TvLogo', 'ScoreBoard', 'StadiumName', 'Movies']],
  ['Sound', ['Chants', 'AwayChants', 'AwayClubSong', 'TeamEntrance', 'TournamentEntrance']],
  ['Game', ['Ball', 'Adboard', 'Referee', 'Wipe']],
  ['Other', ['Autorun', 'DiscordRPC']],
]

function renderModulesEditor() {
  document.getElementById('raw-editor').classList.remove('visible')
  document.querySelector('.panel-left').style.display = 'none'
  const layout = document.querySelector('.main-layout')
  if (layout) {
    layout.classList.add('left-hidden')
  }
  document.getElementById('btn-add-selected').style.display = 'none'
  document.getElementById('toolbar-sep-adding-selected').style.display = 'none'
  document.getElementById('btn-add-all').style.display = 'none'
  document.getElementById('btn-add-entry').style.display = 'none'
  document.getElementById('btn-sort').style.display = 'none'
  document.getElementById('entry-search').style.display = 'none'
  document.getElementById('btn-chants-bulk').style.display = 'none'
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

  const splitLayout = document.createElement('div')
  splitLayout.className = 'modules-split-layout'

  // --- Left: modules toggles ---
  const wrap = document.createElement('div')
  wrap.className = 'modules-wrap'

  const moduleEntries = []
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#') || !trimmed.includes('=')) return
    const eqIdx = trimmed.indexOf('=')
    moduleEntries.push({ key: trimmed.substring(0, eqIdx).trim(), val: trimmed.substring(eqIdx + 1).trim() })
  })
  const count = moduleEntries.length

  const buildModuleCard = ({ key, val }) => {
    const isEnabled = val === '1'

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
    return card
  }

  // Grouped like CGFS's Dashboard Modules card; unknown modules land in "Other".
  const knownModules = new Set(MODULE_CATEGORIES.flatMap(([, names]) => names))
  MODULE_CATEGORIES.forEach(([title, names]) => {
    const group = moduleEntries
      .filter((m) => names.includes(m.key) || (title === 'Other' && !knownModules.has(m.key)))
      .sort((a, b) => names.indexOf(a.key) - names.indexOf(b.key))
    if (!group.length) return
    const heading = document.createElement('div')
    heading.className = 'modules-group-title'
    heading.textContent = title
    wrap.appendChild(heading)
    const grid = document.createElement('div')
    grid.className = 'modules-grid'
    group.forEach((m) => grid.appendChild(buildModuleCard(m)))
    wrap.appendChild(grid)
  })

  // --- Right: block ordering ---
  const orderWrap = document.createElement('div')
  orderWrap.className = 'block-order-wrap'

  const orderHeader = document.createElement('div')
  orderHeader.className = 'block-order-header'
  orderHeader.innerHTML = `
    <div class="block-order-title">Block Order</div>
    <div class="block-order-subtitle">Drag to reorder sections in settings.ini</div>
  `
  orderWrap.appendChild(orderHeader)

  const orderList = document.createElement('div')
  orderList.className = 'block-order-list'
  renderBlockOrderList(orderList)
  orderWrap.appendChild(orderList)

  splitLayout.appendChild(wrap)
  splitLayout.appendChild(orderWrap)
  editorEl.appendChild(splitLayout)

  document.getElementById('footer-entries').textContent = count + ' modules'
}

function renderBlockOrderList(listEl) {
  listEl.innerHTML = ''
  let dragSrc = null

  state.sectionOrder.forEach((sec) => {
    const item = document.createElement('div')
    item.className = 'block-order-item'
    item.draggable = true
    item.dataset.sec = sec

    item.innerHTML = `
      <span class="block-order-handle" title="Drag to reorder">
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
          <circle cx="3" cy="2" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="2" r="1.5" fill="currentColor"/>
          <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="3" cy="14" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="14" r="1.5" fill="currentColor"/>
        </svg>
      </span>
      <span class="block-order-name">[${getSectionName(sec)}]</span>
    `

    item.addEventListener('dragstart', (e) => {
      dragSrc = item
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', sec)
      setTimeout(() => item.classList.add('dragging'), 0)
    })

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging')
      listEl.querySelectorAll('.block-order-item').forEach((el) => el.classList.remove('drag-over-top', 'drag-over-bottom'))
    })

    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (!dragSrc || dragSrc === item) return
      e.dataTransfer.dropEffect = 'move'
      const rect = item.getBoundingClientRect()
      const mid = rect.top + rect.height / 2
      listEl.querySelectorAll('.block-order-item').forEach((el) => el.classList.remove('drag-over-top', 'drag-over-bottom'))
      item.classList.add(e.clientY < mid ? 'drag-over-top' : 'drag-over-bottom')
    })

    item.addEventListener('dragleave', (e) => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('drag-over-top', 'drag-over-bottom')
      }
    })

    item.addEventListener('drop', (e) => {
      e.preventDefault()
      item.classList.remove('drag-over-top', 'drag-over-bottom')
      if (!dragSrc || dragSrc === item) return

      const fromSec = dragSrc.dataset.sec
      const toSec = item.dataset.sec
      const fromIdx = state.sectionOrder.indexOf(fromSec)
      let toIdx = state.sectionOrder.indexOf(toSec)
      if (fromIdx === -1 || toIdx === -1) return

      const rect = item.getBoundingClientRect()
      const insertAfter = e.clientY >= rect.top + rect.height / 2
      state.sectionOrder.splice(fromIdx, 1)
      toIdx = state.sectionOrder.indexOf(toSec)
      state.sectionOrder.splice(insertAfter ? toIdx + 1 : toIdx, 0, fromSec)

      setUnsaved(true)
      renderBlockOrderList(listEl)
    })

    listEl.appendChild(item)
  })
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
  const isInSubSection = typeConfig.subSections?.includes(state.currentSection)
  const targetSection =
    (typeKey === 'scoreboardstdname' && isScoreboardStdSection(state.currentSection)) || isInSubSection
      ? state.currentSection
      : typeConfig.iniSection
  if (!confirm(`Add ALL ${typeConfig.name.toLowerCase()} to [${targetSection}]? You can remove unwanted ones after.`)) return
  addItemsToSection(typeKey, [...getPanelItems(typeKey)])
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

document.getElementById('entry-search').addEventListener('input', () => applyEntrySearchFilter())

document.getElementById('btn-chants-bulk').addEventListener('click', () => openChantsBulkModal())

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

function syncToggleAddedButton() {
  const btn = document.getElementById('btn-toggle-added')
  if (!btn) return
  btn.classList.toggle('active', state.hideAddedItems)
  btn.title = state.hideAddedItems ? 'Show already added items' : 'Hide already added items'
  btn.setAttribute('aria-label', btn.title)
  btn.innerHTML = `<i class="fa-solid ${state.hideAddedItems ? 'fa-eye-slash' : 'fa-eye'}"></i>`
}

document.getElementById('btn-toggle-added').addEventListener('click', () => {
  state.hideAddedItems = !state.hideAddedItems
  syncToggleAddedButton()
  renderItemList(state.currentType)
})

document.addEventListener('DOMContentLoaded', async () => {
  await initIndexedDB()
  showLastPathSuggestion()
  await initDbPanel()
  loadLeftPanelState()
  syncLeftPanelLayout()
  document.getElementById('left-toggle')?.addEventListener('click', () => {
    state.leftPanelCollapsed = !state.leftPanelCollapsed
    persistLeftPanelState()
    syncLeftPanelLayout()
  })
  checkForUpdatesSilently()
  await autoConnectSavedGameRoot()
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

// ============================================================
// STADIUM ASSETS PANEL
// ============================================================
const GOALPOST_DIR = 'GoalpostGBD'
// Camera .dat pairs (one file per engine slot) that can ship inside a stadium folder.
const CAM_ASSETS = {
  gameplay: { dir: 'GameplayCamGBD', title: 'GameplayCam', file: (slot) => `bcgameplay_${slot}.dat` },
  entrance: { dir: 'EntranceScene', title: 'EntranceCam', file: (slot) => `bcstadiumcams_${slot}.dat` },
}
const GOALPOST_FILES = {
  goalnet:    'specificgoalnet_0_0.rx3',
  goalpost:   'specificgoalpost_0_0.rx3',
  netsupport: 'specificnetsupportpost_0_0_textures.rx3',
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function pickAssetFile(accept = ['.dat', '.rx3']) {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept.join(',')
    input.style.display = 'none'
    input.addEventListener('change', () => {
      const file = input.files && input.files.length ? input.files[0] : null
      input.remove()
      resolve(file)
    }, { once: true })
    document.body.appendChild(input)
    input.click()
  })
}

function validateAssetFileName(file, expectedName) {
  if (file.name.toLowerCase() !== expectedName.toLowerCase()) {
    toast(`Wrong file: expected "${expectedName}" but got "${file.name}". Select the correct file.`, 'error')
    return false
  }
  return true
}

async function pickAndSetSource(sourceKey, expectedName, accept) {
  const file = await pickAssetFile(accept)
  if (!file) return
  if (!validateAssetFileName(file, expectedName)) return
  state.stadiumAssetsSources[sourceKey] = file
  renderStadiumAssetsPanel()
  toast(`Source set: ${file.name}`, 'success')
}

function buildAssetStatusBadge(hasValue, scanning, error) {
  const cell = document.createElement('span')
  cell.className = 'gameplay-status-cell'
  const badge = document.createElement('span')

  if (scanning) {
    badge.className = 'gameplay-status-badge scanning'
    badge.textContent = '…'
  } else if (error && hasValue == null) {
    badge.className = 'gameplay-status-badge error'
    badge.title = error
    badge.textContent = '?'
  } else if (hasValue == null) {
    badge.className = 'gameplay-status-badge unknown'
    badge.textContent = '–'
  } else {
    badge.className = 'gameplay-status-badge ' + (hasValue ? 'yes' : 'no')
    badge.textContent = hasValue ? '✓' : '✗'
  }
  cell.appendChild(badge)
  return cell
}

const EMPTY_ASSET_STATUS = () => ({
  gameplay: { has176: false, has261: false },
  entrance: { has176: false, has261: false },
  goalpost: { hasGoalnet: false, hasGoalpost: false, hasNetsupport: false },
})

const NULL_ASSET_STATUS = (error) => ({
  gameplay: { has176: null, has261: null },
  entrance: { has176: null, has261: null },
  goalpost: { hasGoalnet: null, hasGoalpost: null, hasNetsupport: null },
  ...(error ? { error } : {}),
})

// The Assets list is paged and each stadium is only scanned when its page is first
// shown; the result is cached in state.stadiumAssetsStatus until the next refresh.
const STADIUM_ASSETS_PAGE_SIZE = 50
const STADIUM_ASSETS_SCAN_CONCURRENCY = 6

// In-flight scans by stadium name, so a page and a bulk action never scan the same
// stadium twice. The generation drops results that land after the cache was cleared.
const stadiumAssetScans = new Map()
let stadiumAssetsScanGeneration = 0
let stadiumAssetsScanTimer = null

function clearStadiumAssetsCache() {
  state.stadiumAssetsStatus = {}
  stadiumAssetScans.clear()
  stadiumAssetsScanGeneration++
}

function isStadiumAssetsScanned(stadiumName) {
  const status = state.stadiumAssetsStatus[stadiumName]
  return !!status && !status.scanning
}

async function readStadiumFolderAssets(stadiumGBDHandle, stadiumName) {
  if (!stadiumGBDHandle) return NULL_ASSET_STATUS()

  let stadDir
  try { stadDir = await stadiumGBDHandle.getDirectoryHandle(stadiumName) }
  catch (_) { return EMPTY_ASSET_STATUS() }

  const hasFile = async (dir, fileName) => {
    try { await dir.getFileHandle(fileName); return true } catch (_) { return false }
  }

  const scanCamPair = async (category) => {
    const cam = CAM_ASSETS[category]
    try {
      const camDir = await stadDir.getDirectoryHandle(cam.dir)
      const [has176, has261] = await Promise.all([hasFile(camDir, cam.file('176')), hasFile(camDir, cam.file('261'))])
      return { has176, has261 }
    } catch (_) {
      return { has176: false, has261: false }
    }
  }

  const scanGoalpost = async () => {
    try {
      const gpDir = await stadDir.getDirectoryHandle(GOALPOST_DIR)
      const [hasGoalnet, hasGoalpost, hasNetsupport] = await Promise.all([
        hasFile(gpDir, GOALPOST_FILES.goalnet),
        hasFile(gpDir, GOALPOST_FILES.goalpost),
        hasFile(gpDir, GOALPOST_FILES.netsupport),
      ])
      return { hasGoalnet, hasGoalpost, hasNetsupport }
    } catch (_) {
      return { hasGoalnet: false, hasGoalpost: false, hasNetsupport: false }
    }
  }

  const [gameplay, entrance, goalpost] = await Promise.all([scanCamPair('gameplay'), scanCamPair('entrance'), scanGoalpost()])
  return { gameplay, entrance, goalpost }
}

async function readStadiumArchiveAssets(stadiumName) {
  if (!isDesktopApp || !window.electronAPI?.stadiumAssets) return NULL_ASSET_STATUS('Desktop app required for archives')
  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) return NULL_ASSET_STATUS('Set game root path to scan archives')

  const archivePath = gameRoot + '\\StadiumGBD\\' + stadiumName
  const result = /\.zip$/i.test(stadiumName)
    ? await window.electronAPI.stadiumAssets.scanZip(archivePath)
    : await window.electronAPI.stadiumAssets.scanRar(archivePath)
  if (result.noTool) return NULL_ASSET_STATUS('7-Zip required for RAR. Install from 7-zip.org.')
  return {
    gameplay: { has176: result.gameplay.has176, has261: result.gameplay.has261 },
    entrance: { has176: result.entrance.has176, has261: result.entrance.has261 },
    goalpost: { hasGoalnet: result.goalpost.hasGoalnet, hasGoalpost: result.goalpost.hasGoalpost, hasNetsupport: result.goalpost.hasNetsupport },
    ...(result.error ? { error: result.error } : {}),
  }
}

function scanOneStadiumAssets(stadiumName, stadiumGBDHandle) {
  if (isStadiumAssetsScanned(stadiumName)) return Promise.resolve()
  let job = stadiumAssetScans.get(stadiumName)
  if (job) return job

  const generation = stadiumAssetsScanGeneration
  state.stadiumAssetsStatus[stadiumName] = { scanning: true }
  const read = /\.(zip|rar)$/i.test(stadiumName)
    ? readStadiumArchiveAssets(stadiumName)
    : readStadiumFolderAssets(stadiumGBDHandle, stadiumName)
  job = read
    .catch((e) => NULL_ASSET_STATUS(e.message))
    .then((status) => {
      if (generation !== stadiumAssetsScanGeneration) return
      state.stadiumAssetsStatus[stadiumName] = status
      stadiumAssetScans.delete(stadiumName)
    })
  stadiumAssetScans.set(stadiumName, job)
  return job
}

// Scans the stadiums in `names` that are not cached yet, a few at a time.
// onScanned(name, done, total) fires as each one finishes.
async function scanStadiumAssets(names, onScanned) {
  const todo = names.filter((s) => !isStadiumAssetsScanned(s))
  if (todo.length === 0) return

  let stadiumGBDHandle = null
  if (state.rootHandle) {
    try { stadiumGBDHandle = await state.rootHandle.getDirectoryHandle('StadiumGBD') } catch (_) {}
  }

  let next = 0
  let done = 0
  const worker = async () => {
    while (next < todo.length) {
      const stadiumName = todo[next++]
      await scanOneStadiumAssets(stadiumName, stadiumGBDHandle)
      done++
      if (onScanned) onScanned(stadiumName, done, todo.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(STADIUM_ASSETS_SCAN_CONCURRENCY, todo.length) }, worker))
}

// The "all stadiums" actions decide per stadium from its status, so every stadium
// has to be scanned first, not only the pages opened so far.
async function ensureAllStadiumAssetsScanned() {
  const stadiums = state.gbdFolders.stadium || []
  const pending = stadiums.filter((s) => !isStadiumAssetsScanned(s)).length
  if (pending === 0) return
  showLoadingOverlay(`Scanning stadiums… 0 / ${pending}`)
  try {
    await scanStadiumAssets(stadiums, (_name, done, total) => showLoadingOverlay(`Scanning stadiums… ${done} / ${total}`))
  } finally {
    hideLoadingOverlay()
  }
}

// Folder and file name inside a stadium for an asset.
// category: 'gameplay' | 'entrance' | 'goalpost'
// fileKey: '176'|'261' | 'goalnet'|'goalpost'|'netsupport'
function stadiumAssetTarget(category, fileKey) {
  const cam = CAM_ASSETS[category]
  if (cam) return { dirName: cam.dir, fileName: cam.file(fileKey) }
  return { dirName: GOALPOST_DIR, fileName: GOALPOST_FILES[fileKey] }
}

async function addStadiumAssetFile(stadiumName, category, fileKey, sourceBuffer) {
  const isZip = /\.zip$/i.test(stadiumName)
  const isRar = /\.rar$/i.test(stadiumName)
  const { dirName, fileName } = stadiumAssetTarget(category, fileKey)

  if (!isZip && !isRar) {
    if (!state.rootHandle) { toast('Load the FIFA root folder first.', 'error'); return false }
    const rootHandle = await requestHandlePermission(state.rootHandle)
    if (!rootHandle) { toast('Folder permission required.', 'error'); return false }
    try {
      const stadiumGBDDir = await rootHandle.getDirectoryHandle('StadiumGBD')
      const stadDir = await stadiumGBDDir.getDirectoryHandle(stadiumName)
      const assetDir = await stadDir.getDirectoryHandle(dirName, { create: true })
      const fh = await assetDir.getFileHandle(fileName, { create: true })
      const w = await fh.createWritable()
      await w.write(sourceBuffer)
      await w.close()
      return true
    } catch (e) {
      toast('Write failed: ' + e.message, 'error')
      return false
    }
  }

  if (!isDesktopApp || !window.electronAPI?.stadiumAssets) {
    toast('Archive support requires the Desktop (Electron) app.', 'error')
    return false
  }
  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) {
    toast('Game folder not set. Use "Change Paths" to select it.', 'error')
    return false
  }

  const archivePath = gameRoot + '\\StadiumGBD\\' + stadiumName
  try {
    if (isZip) {
      await window.electronAPI.stadiumAssets.writeToZip(archivePath, category, fileKey, Array.from(new Uint8Array(sourceBuffer)))
      return true
    }
    const result = await window.electronAPI.stadiumAssets.writeToRar(archivePath, category, fileKey, Array.from(new Uint8Array(sourceBuffer)))
    if (result.convertedToZip) applyRarToZipRename(stadiumName, result.newName)
    return true
  } catch (e) {
    toast('Failed: ' + e.message, 'error')
    return false
  }
}

async function removeStadiumAssetFile(stadiumName, category, fileKey) {
  const isZip = /\.zip$/i.test(stadiumName)
  const isRar = /\.rar$/i.test(stadiumName)
  const { dirName, fileName } = stadiumAssetTarget(category, fileKey)

  if (!isZip && !isRar) {
    if (!state.rootHandle) return false
    const rootHandle = await requestHandlePermission(state.rootHandle)
    if (!rootHandle) return false
    try {
      const stadiumGBDDir = await rootHandle.getDirectoryHandle('StadiumGBD')
      const stadDir = await stadiumGBDDir.getDirectoryHandle(stadiumName)
      let assetDir
      try { assetDir = await stadDir.getDirectoryHandle(dirName) }
      catch (_) { return true }
      try { await assetDir.removeEntry(fileName) } catch (_) {}
      return true
    } catch (e) {
      toast('Remove failed: ' + e.message, 'error')
      return false
    }
  }

  if (!isDesktopApp || !window.electronAPI?.stadiumAssets) {
    toast('Archive support requires the Desktop (Electron) app.', 'error')
    return false
  }
  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) {
    toast('Game folder not set. Use "Change Paths" to select it.', 'error')
    return false
  }

  const archivePath = gameRoot + '\\StadiumGBD\\' + stadiumName
  try {
    if (isZip) {
      await window.electronAPI.stadiumAssets.removeFromZip(archivePath, category, fileKey)
      return true
    }
    const result = await window.electronAPI.stadiumAssets.removeFromRar(archivePath, category, fileKey)
    if (result.convertedToZip) applyRarToZipRename(stadiumName, result.newName)
    return true
  } catch (e) {
    toast('Failed: ' + e.message, 'error')
    return false
  }
}

async function convertStadiumRarToZip(stadiumName) {
  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) { toast('Set the game root path first.', 'error'); return }
  const archivePath = gameRoot + '\\StadiumGBD\\' + stadiumName
  showLoadingOverlay('Converting to ZIP…')
  try {
    const result = await window.electronAPI.stadiumAssets.convertRarToZip(archivePath)
    applyRarToZipRename(stadiumName, result.newName)
    renderStadiumAssetsPanel()
  } catch (e) {
    toast('Failed: ' + e.message, 'error')
  } finally {
    hideLoadingOverlay()
  }
}

async function convertAllRarToZip() {
  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) { toast('Set the game root path first.', 'error'); return }
  const rarStadiums = (state.gbdFolders.stadium || []).filter((s) => /\.rar$/i.test(s))
  if (rarStadiums.length === 0) { toast('No RAR stadiums found.', 'info'); return }
  showLoadingOverlay('Converting RAR to ZIP…')
  let converted = 0, failed = 0
  try {
    for (const stadiumName of rarStadiums) {
      const archivePath = gameRoot + '\\StadiumGBD\\' + stadiumName
      try {
        const result = await window.electronAPI.stadiumAssets.convertRarToZip(archivePath)
        applyRarToZipRename(stadiumName, result.newName, true)
        converted++
      } catch (_) { failed++ }
    }
  } finally {
    hideLoadingOverlay()
  }
  if (failed === 0) toast(`Converted ${converted} RAR stadium${converted !== 1 ? 's' : ''} to ZIP. Save to confirm.`, 'success')
  else toast(`Converted ${converted}, failed ${failed}.`, failed === rarStadiums.length ? 'error' : 'info')
  renderStadiumAssetsPanel()
}

function applyRarToZipRename(oldName, newName, silent = false) {
  const idx = state.gbdFolders.stadium?.indexOf(oldName)
  if (idx !== -1 && idx != null) state.gbdFolders.stadium[idx] = newName
  const re = new RegExp(escapeRegex(oldName), 'gi')
  for (const sec of Object.keys(state.sections)) {
    state.sections[sec] = state.sections[sec].map((l) => l.replace(re, newName))
  }
  const prev = state.stadiumAssetsStatus[oldName]
  if (prev) {
    state.stadiumAssetsStatus[newName] = { ...prev }
    delete state.stadiumAssetsStatus[oldName]
  }
  setUnsaved(true)
  if (!silent) toast(`Converted ${oldName} → ${newName}. Save settings.ini to confirm.`, 'info')
}

async function preConvertRarsInList(stadiumNames) {
  const gameRoot = getGameRootPathForDesktopActions()
  if (!gameRoot) return {}
  const renames = {}
  for (const name of stadiumNames) {
    if (!/\.rar$/i.test(name) || renames[name]) continue
    try {
      const result = await window.electronAPI.stadiumAssets.convertRarToZip(gameRoot + '\\StadiumGBD\\' + name)
      applyRarToZipRename(name, result.newName, true)
      renames[name] = result.newName
    } catch (_) {}
  }
  return renames
}

// Copies the picked 176/261 source files into every stadium that lacks them.
// category: 'gameplay' | 'entrance' (see CAM_ASSETS); sources live in
// state.stadiumAssetsSources[`${category}176` / `${category}261`].
async function applyCamToAll(category) {
  const cam = CAM_ASSETS[category]
  const source176 = state.stadiumAssetsSources[`${category}176`]
  const source261 = state.stadiumAssetsSources[`${category}261`]
  if (!source176 || !source261) {
    toast('Set both source files (176 and 261) first using Browse….', 'error')
    return
  }

  await ensureAllStadiumAssetsScanned()
  const stadiums = state.gbdFolders.stadium || []
  const missing176 = stadiums.filter((s) => !state.stadiumAssetsStatus[s]?.[category]?.has176)
  const missing261 = stadiums.filter((s) => !state.stadiumAssetsStatus[s]?.[category]?.has261)

  if (missing176.length === 0 && missing261.length === 0) {
    toast(`All stadiums already have both ${cam.title} files.`, 'success')
    return
  }

  const lines = []
  if (missing176.length > 0) lines.push(`${cam.file('176')} → ${missing176.length} stadiums`)
  if (missing261.length > 0) lines.push(`${cam.file('261')} → ${missing261.length} stadiums`)
  if (!confirm(`Apply to all missing:\n${lines.join('\n')}`)) return

  showLoadingOverlay(`Applying ${cam.title}…`)
  const ok = { '176': 0, '261': 0 }
  try {
    const renames = await preConvertRarsInList([...missing176, ...missing261])
    const eff = (n) => renames[n] || n

    for (const [slot, source, missing] of [['176', source176, missing176], ['261', source261, missing261]]) {
      for (const origName of missing) {
        const stadiumName = eff(origName)
        const success = await addStadiumAssetFile(stadiumName, category, slot, await source.arrayBuffer())
        if (success) {
          if (!state.stadiumAssetsStatus[stadiumName]) state.stadiumAssetsStatus[stadiumName] = EMPTY_ASSET_STATUS()
          state.stadiumAssetsStatus[stadiumName][category][`has${slot}`] = true
          ok[slot]++
        }
      }
    }
  } finally {
    hideLoadingOverlay()
  }
  renderStadiumAssetsPanel()
  const parts = []
  if (missing176.length > 0) parts.push(`176: ${ok['176']}/${missing176.length}`)
  if (missing261.length > 0) parts.push(`261: ${ok['261']}/${missing261.length}`)
  toast(`Applied ${cam.title} — ${parts.join(', ')}`, ok['176'] + ok['261'] === missing176.length + missing261.length ? 'success' : 'info')
}

async function applyGoalpostToAll() {
  const { goalnet, goalpost, netsupport } = state.stadiumAssetsSources
  if (!goalnet || !goalpost || !netsupport) {
    toast('Set all 3 goalpost source files first using Browse….', 'error')
    return
  }

  await ensureAllStadiumAssetsScanned()
  const stadiums = state.gbdFolders.stadium || []
  const missing = stadiums.filter((s) => {
    const gp = state.stadiumAssetsStatus[s]?.goalpost
    return !gp || !gp.hasGoalnet || !gp.hasGoalpost || !gp.hasNetsupport
  })

  if (missing.length === 0) { toast('All stadiums already have a complete goalpost set.', 'success'); return }
  if (!confirm(`Apply goalpost files to ${missing.length} stadium(s) that have an incomplete set?`)) return

  showLoadingOverlay('Applying Goalpost…')
  let ok = 0
  try {
    const renames = await preConvertRarsInList(missing)
    const eff = (n) => renames[n] || n

    for (const origName of missing) {
      const stadiumName = eff(origName)
      const r1 = await addStadiumAssetFile(stadiumName, 'goalpost', 'goalnet',    await goalnet.arrayBuffer())
      const r2 = await addStadiumAssetFile(stadiumName, 'goalpost', 'goalpost',   await goalpost.arrayBuffer())
      const r3 = await addStadiumAssetFile(stadiumName, 'goalpost', 'netsupport', await netsupport.arrayBuffer())
      if (r1 && r2 && r3) {
        if (!state.stadiumAssetsStatus[stadiumName]) state.stadiumAssetsStatus[stadiumName] = EMPTY_ASSET_STATUS()
        state.stadiumAssetsStatus[stadiumName].goalpost = { hasGoalnet: true, hasGoalpost: true, hasNetsupport: true }
        ok++
      }
    }
  } finally {
    hideLoadingOverlay()
  }
  renderStadiumAssetsPanel()
  toast(`Applied goalpost to ${ok}/${missing.length} stadiums`, ok === missing.length ? 'success' : 'info')
}

async function removeCamFromAll(category) {
  const cam = CAM_ASSETS[category]
  await ensureAllStadiumAssetsScanned()
  const stadiums = state.gbdFolders.stadium || []
  const present176 = stadiums.filter((s) => state.stadiumAssetsStatus[s]?.[category]?.has176)
  const present261 = stadiums.filter((s) => state.stadiumAssetsStatus[s]?.[category]?.has261)

  if (present176.length === 0 && present261.length === 0) {
    toast(`No stadiums have ${cam.title} files.`, 'info')
    return
  }

  const lines = []
  if (present176.length > 0) lines.push(`${cam.file('176')} from ${present176.length} stadiums`)
  if (present261.length > 0) lines.push(`${cam.file('261')} from ${present261.length} stadiums`)
  if (!confirm(`Remove from all:\n${lines.join('\n')}`)) return

  showLoadingOverlay(`Removing ${cam.title}…`)
  const ok = { '176': 0, '261': 0 }
  try {
    for (const [slot, present] of [['176', present176], ['261', present261]]) {
      for (const stadiumName of present) {
        const success = await removeStadiumAssetFile(stadiumName, category, slot)
        if (success) {
          state.stadiumAssetsStatus[stadiumName][category][`has${slot}`] = false
          ok[slot]++
        }
      }
    }
  } finally {
    hideLoadingOverlay()
  }
  renderStadiumAssetsPanel()
  const parts = []
  if (present176.length > 0) parts.push(`176: ${ok['176']}/${present176.length}`)
  if (present261.length > 0) parts.push(`261: ${ok['261']}/${present261.length}`)
  toast(`Removed ${cam.title} — ${parts.join(', ')}`, ok['176'] + ok['261'] === present176.length + present261.length ? 'success' : 'info')
}

async function removeGoalpostFromAll() {
  await ensureAllStadiumAssetsScanned()
  const stadiums = state.gbdFolders.stadium || []
  const present = stadiums.filter((s) => {
    const gp = state.stadiumAssetsStatus[s]?.goalpost
    return gp && (gp.hasGoalnet || gp.hasGoalpost || gp.hasNetsupport)
  })

  if (present.length === 0) { toast('No stadiums have goalpost files.', 'info'); return }
  if (!confirm(`Remove ALL goalpost files from ${present.length} stadium(s) that have them?`)) return

  showLoadingOverlay('Removing Goalpost…')
  let ok = 0
  try {
    for (const stadiumName of present) {
      const gp = state.stadiumAssetsStatus[stadiumName]?.goalpost || {}
      const jobs = []
      if (gp.hasGoalnet)    jobs.push(removeStadiumAssetFile(stadiumName, 'goalpost', 'goalnet'))
      if (gp.hasGoalpost)   jobs.push(removeStadiumAssetFile(stadiumName, 'goalpost', 'goalpost'))
      if (gp.hasNetsupport) jobs.push(removeStadiumAssetFile(stadiumName, 'goalpost', 'netsupport'))
      const results = await Promise.all(jobs)
      if (results.every(Boolean)) {
        if (state.stadiumAssetsStatus[stadiumName]) {
          state.stadiumAssetsStatus[stadiumName].goalpost = { hasGoalnet: false, hasGoalpost: false, hasNetsupport: false }
        }
        ok++
      }
    }
  } finally {
    hideLoadingOverlay()
  }
  renderStadiumAssetsPanel()
  toast(`Removed goalpost files from ${ok}/${present.length} stadiums`, ok === present.length ? 'success' : 'info')
}


function buildModalBody(stadiumName) {
  const status = state.stadiumAssetsStatus[stadiumName] || {}
  const scanning = !!status.scanning
  const error = status.error || null
  const gp = status.gameplay || {}
  const entrance = status.entrance || {}
  const goalpost = status.goalpost || {}

  const body = document.createElement('div')
  body.className = 'stadium-assets-modal-body'

  const makeFileRow = (label, hasValue, category, fileKey, accept, expectedName) => {
    const row = document.createElement('div')
    row.className = 'stadium-assets-file-row'

    const lbl = document.createElement('span')
    lbl.className = 'stadium-assets-file-label'
    lbl.textContent = label
    lbl.title = label
    row.appendChild(lbl)

    row.appendChild(buildAssetStatusBadge(scanning ? null : hasValue, scanning, error))

    const assignBtn = document.createElement('button')
    assignBtn.className = 'btn sa-file-assign-btn'
    assignBtn.textContent = 'Assign'
    assignBtn.addEventListener('click', async () => {
      const src = CAM_ASSETS[category]
        ? state.stadiumAssetsSources[`${category}${fileKey}`]
        : state.stadiumAssetsSources[fileKey]
      let buf
      if (src) {
        buf = await src.arrayBuffer()
      } else {
        const f = await pickAssetFile(accept)
        if (!f) return
        if (!validateAssetFileName(f, expectedName)) return
        buf = await f.arrayBuffer()
      }
      const ok = await addStadiumAssetFile(stadiumName, category, fileKey, buf)
      if (ok) {
        if (!state.stadiumAssetsStatus[stadiumName]) state.stadiumAssetsStatus[stadiumName] = EMPTY_ASSET_STATUS()
        if (CAM_ASSETS[category]) {
          state.stadiumAssetsStatus[stadiumName][category][`has${fileKey}`] = true
        } else {
          const capKey = fileKey.charAt(0).toUpperCase() + fileKey.slice(1)
          state.stadiumAssetsStatus[stadiumName].goalpost[`has${capKey}`] = true
        }
        refreshModalContent(stadiumName)
        renderStadiumAssetsPanel()
        toast(`${expectedName} added to ${normalizeStadiumItemName(stadiumName)}`, 'success')
      }
    })
    row.appendChild(assignBtn)

    const removeBtn = document.createElement('button')
    removeBtn.className = 'btn sa-file-remove-btn'
    removeBtn.textContent = '✕'
    removeBtn.title = `Remove ${expectedName}`
    removeBtn.addEventListener('click', async () => {
      if (!confirm(`Remove "${expectedName}" from "${normalizeStadiumItemName(stadiumName)}"?`)) return
      const ok = await removeStadiumAssetFile(stadiumName, category, fileKey)
      if (ok) {
        if (CAM_ASSETS[category]) {
          state.stadiumAssetsStatus[stadiumName][category][`has${fileKey}`] = false
        } else {
          const capKey = fileKey.charAt(0).toUpperCase() + fileKey.slice(1)
          state.stadiumAssetsStatus[stadiumName].goalpost[`has${capKey}`] = false
        }
        refreshModalContent(stadiumName)
        renderStadiumAssetsPanel()
        toast(`${expectedName} removed from ${normalizeStadiumItemName(stadiumName)}`, 'success')
      }
    })
    row.appendChild(removeBtn)

    return row
  }

  // GameplayCam section
  const gpSection = document.createElement('div')
  const gpTitle = document.createElement('div')
  gpTitle.className = 'stadium-assets-section-title'
  gpTitle.textContent = 'GameplayCam'
  gpSection.appendChild(gpTitle)
  gpSection.appendChild(makeFileRow(CAM_ASSETS.gameplay.file('176'), gp.has176, 'gameplay', '176', ['.dat'], CAM_ASSETS.gameplay.file('176')))
  gpSection.appendChild(makeFileRow(CAM_ASSETS.gameplay.file('261'), gp.has261, 'gameplay', '261', ['.dat'], CAM_ASSETS.gameplay.file('261')))
  body.appendChild(gpSection)

  // EntranceScene section (the stadium's own entrance camera)
  const entranceSection = document.createElement('div')
  const entranceTitle = document.createElement('div')
  entranceTitle.className = 'stadium-assets-section-title'
  entranceTitle.textContent = 'EntranceCam'
  entranceSection.appendChild(entranceTitle)
  entranceSection.appendChild(makeFileRow(CAM_ASSETS.entrance.file('176'), entrance.has176, 'entrance', '176', ['.dat'], CAM_ASSETS.entrance.file('176')))
  entranceSection.appendChild(makeFileRow(CAM_ASSETS.entrance.file('261'), entrance.has261, 'entrance', '261', ['.dat'], CAM_ASSETS.entrance.file('261')))
  body.appendChild(entranceSection)

  // GoalpostGBD section
  const goalpostSection = document.createElement('div')
  const goalpostTitle = document.createElement('div')
  goalpostTitle.className = 'stadium-assets-section-title'
  goalpostTitle.textContent = 'GoalpostGBD'
  goalpostSection.appendChild(goalpostTitle)
  goalpostSection.appendChild(makeFileRow(GOALPOST_FILES.goalnet,    goalpost.hasGoalnet,    'goalpost', 'goalnet',    ['.rx3'], GOALPOST_FILES.goalnet))
  goalpostSection.appendChild(makeFileRow(GOALPOST_FILES.goalpost,   goalpost.hasGoalpost,   'goalpost', 'goalpost',   ['.rx3'], GOALPOST_FILES.goalpost))
  goalpostSection.appendChild(makeFileRow(GOALPOST_FILES.netsupport, goalpost.hasNetsupport, 'goalpost', 'netsupport', ['.rx3'], GOALPOST_FILES.netsupport))
  body.appendChild(goalpostSection)

  return body
}

function refreshModalContent(stadiumName) {
  const modal = document.querySelector('.stadium-assets-modal')
  if (!modal) return
  const oldBody = modal.querySelector('.stadium-assets-modal-body')
  if (oldBody) oldBody.replaceWith(buildModalBody(stadiumName))
}

function openStadiumAssetsModal(stadiumName) {
  closeStadiumAssetsModal()
  state.stadiumAssetsModal = stadiumName

  const isZip = /\.zip$/i.test(stadiumName)
  const isRar = /\.rar$/i.test(stadiumName)
  const normalizedName = normalizeStadiumItemName(stadiumName)

  const overlay = document.createElement('div')
  overlay.className = 'stadium-assets-modal-overlay'
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeStadiumAssetsModal()
  })

  const modal = document.createElement('div')
  modal.className = 'stadium-assets-modal'
  overlay.appendChild(modal)

  const header = document.createElement('div')
  header.className = 'stadium-assets-modal-header'

  const nameEl = document.createElement('span')
  nameEl.className = 'stadium-assets-modal-name'
  const nameText = document.createTextNode(normalizedName)
  nameEl.appendChild(nameText)
  if (isZip) {
    const badge = document.createElement('span')
    badge.className = 'gameplay-archive-badge zip'
    badge.textContent = 'ZIP'
    nameEl.appendChild(badge)
  } else if (isRar) {
    const badge = document.createElement('span')
    badge.className = 'gameplay-archive-badge rar'
    badge.textContent = 'RAR'
    nameEl.appendChild(badge)
  }
  header.appendChild(nameEl)

  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn stadium-assets-modal-close'
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', closeStadiumAssetsModal)
  header.appendChild(closeBtn)

  modal.appendChild(header)
  modal.appendChild(buildModalBody(stadiumName))

  document.body.appendChild(overlay)

  const onEsc = (e) => { if (e.key === 'Escape') closeStadiumAssetsModal() }
  document.addEventListener('keydown', onEsc)
  overlay._onEsc = onEsc
}

function closeStadiumAssetsModal() {
  const overlay = document.querySelector('.stadium-assets-modal-overlay')
  if (!overlay) return
  if (overlay._onEsc) document.removeEventListener('keydown', overlay._onEsc)
  overlay.remove()
  state.stadiumAssetsModal = null
}

// Toolbar pages of the Assets panel, in dot order.
const STADIUM_ASSET_PAGES = ['gameplay', 'entrance', 'goalpost']

function renderStadiumAssetsPanel() {
  document.getElementById('btn-add-selected').style.display = 'none'
  document.getElementById('toolbar-sep-adding-selected').style.display = 'none'
  document.getElementById('btn-add-all').style.display = 'none'
  document.getElementById('btn-add-entry').style.display = 'none'
  document.getElementById('btn-sort').style.display = 'none'
  document.getElementById('entry-search').style.display = 'none'
  document.getElementById('btn-chants-bulk').style.display = 'none'
  document.getElementById('btn-visual-view').style.display = 'none'
  document.getElementById('btn-raw-view').style.display = 'none'
  document.getElementById('btn-full-raw').style.display = 'none'

  const layout = document.querySelector('.main-layout')
  if (layout) layout.classList.remove('left-hidden')

  // Same tabs as the entries editor, with Assets active
  renderStadiumSectionTabs(document.getElementById('section-tabs'), 'stadiumassets')

  document.getElementById('raw-editor').classList.remove('visible')

  const editorEl = document.getElementById('item-editor')
  editorEl.style.display = 'flex'
  editorEl.style.flexDirection = 'column'
  editorEl.style.overflow = 'auto'
  editorEl.innerHTML = ''

  const stadiums = state.gbdFolders.stadium || []
  const panel = document.createElement('div')
  panel.className = 'gameplay-cam-panel'

  // Header
  const header = document.createElement('div')
  header.className = 'gameplay-cam-header'
  header.innerHTML = `
    <div class="gameplay-cam-title">Stadiums Assets</div>
    <div class="gameplay-cam-desc">
      Manages <code>GameplayCamGBD/</code> (<code>bcgameplay_176.dat</code>, <code>bcgameplay_261.dat</code>),
      <code>EntranceScene/</code> (<code>bcstadiumcams_176.dat</code>, <code>bcstadiumcams_261.dat</code>)
      and <code>GoalpostGBD/</code> (goalpost rx3 files) inside each stadium folder.
      Click a stadium to assign or remove files. ZIP archives fully supported; RAR converted to ZIP when modified.
    </div>
  `
  panel.appendChild(header)

  const canEdit = hasGameRoot()
  const hasFullRoot = !!getGameRootPathForDesktopActions()
  if (!canEdit) {
    const notice = document.createElement('div')
    notice.className = 'sa-no-root-notice'
    notice.textContent = 'Set the game root path to assign or remove files.'
    panel.appendChild(notice)
  } else if (!hasFullRoot) {
    const notice = document.createElement('div')
    notice.className = 'sa-no-root-notice'
    notice.textContent = 'ZIP/RAR stadiums require the game root path set. Folder stadiums can be edited freely.'
    panel.appendChild(notice)
  }

  // Toolbar
  const toolbar = document.createElement('div')
  toolbar.className = 'gameplay-cam-toolbar'

  // Scan button — always visible
  const scanBtn = document.createElement('button')
  scanBtn.className = 'btn'
  scanBtn.textContent = 'Scan / Refresh'
  scanBtn.title = 'Forget the scanned status and scan again. Each page is scanned when you open it.'
  scanBtn.addEventListener('click', () => {
    clearStadiumAssetsCache()
    renderStadiumAssetsPanel()
  })
  toolbar.appendChild(scanBtn)

  const hasRars = (state.gbdFolders.stadium || []).some((s) => /\.rar$/i.test(s))
  if (hasRars) {
    const convertAllBtn = document.createElement('button')
    convertAllBtn.className = 'btn'
    convertAllBtn.textContent = 'Convert all to ZIP'
    convertAllBtn.disabled = !canEdit || !getGameRootPathForDesktopActions()
    convertAllBtn.addEventListener('click', () => convertAllRarToZip())
    toolbar.appendChild(convertAllBtn)
  }

  toolbar.appendChild(Object.assign(document.createElement('div'), { className: 'toolbar-sep' }))

  // Paged content area
  const pageContent = document.createElement('div')
  pageContent.className = 'sa-toolbar-page-content'

  const camPageCategory = STADIUM_ASSET_PAGES[state.stadiumAssetsToolbarPage]
  if (camPageCategory !== 'goalpost') {
    const category = camPageCategory
    const cam = CAM_ASSETS[category]
    const pageLabel = document.createElement('span')
    pageLabel.className = 'sa-toolbar-page-label'
    pageLabel.textContent = cam.title
    pageContent.appendChild(pageLabel)

    for (const type of ['176', '261']) {
      const grp = document.createElement('div')
      grp.className = 'gameplay-cam-source-group'

      const lbl = document.createElement('span')
      lbl.className = 'gameplay-cam-source-label'
      lbl.textContent = `Source ${type}:`
      grp.appendChild(lbl)

      const nm = document.createElement('span')
      nm.className = 'gameplay-cam-source-name'
      const srcFile = state.stadiumAssetsSources[`${category}${type}`]
      nm.textContent = srcFile ? srcFile.name : 'none set'
      nm.title = srcFile ? srcFile.name : ''
      grp.appendChild(nm)

      const browseBtn = document.createElement('button')
      browseBtn.className = 'btn'
      browseBtn.textContent = 'Browse…'
      browseBtn.addEventListener('click', () => pickAndSetSource(`${category}${type}`, cam.file(type), ['.dat']))
      grp.appendChild(browseBtn)

      pageContent.appendChild(grp)
    }

    const applyCamBtn = document.createElement('button')
    applyCamBtn.className = 'btn'
    applyCamBtn.textContent = 'Apply to all missing'
    applyCamBtn.disabled = !canEdit
    applyCamBtn.addEventListener('click', () => applyCamToAll(category))
    pageContent.appendChild(applyCamBtn)

    const removeCamBtn = document.createElement('button')
    removeCamBtn.className = 'btn danger'
    removeCamBtn.textContent = 'Remove from all'
    removeCamBtn.disabled = !canEdit
    removeCamBtn.addEventListener('click', () => removeCamFromAll(category))
    pageContent.appendChild(removeCamBtn)
  } else {
    // GoalpostGBD page
    const pageLabel = document.createElement('span')
    pageLabel.className = 'sa-toolbar-page-label'
    pageLabel.textContent = 'GoalpostGBD'
    pageContent.appendChild(pageLabel)

    const gpSources = [
      { key: 'goalnet',    label: 'Goalnet:',    file: GOALPOST_FILES.goalnet },
      { key: 'goalpost',   label: 'Goalpost:',   file: GOALPOST_FILES.goalpost },
      { key: 'netsupport', label: 'Netsupportpost:', file: GOALPOST_FILES.netsupport },
    ]

    for (const { key, label, file } of gpSources) {
      const grp = document.createElement('div')
      grp.className = 'gameplay-cam-source-group'

      const lbl = document.createElement('span')
      lbl.className = 'gameplay-cam-source-label'
      lbl.textContent = label
      grp.appendChild(lbl)

      const nm = document.createElement('span')
      nm.className = 'gameplay-cam-source-name'
      const srcFile = state.stadiumAssetsSources[key]
      nm.textContent = srcFile ? srcFile.name : 'none set'
      nm.title = srcFile ? srcFile.name : ''
      grp.appendChild(nm)

      const browseBtn = document.createElement('button')
      browseBtn.className = 'btn'
      browseBtn.textContent = 'Browse…'
      browseBtn.addEventListener('click', () => pickAndSetSource(key, file, ['.rx3']))
      grp.appendChild(browseBtn)

      pageContent.appendChild(grp)
    }

    const applyGoalpostBtn = document.createElement('button')
    applyGoalpostBtn.className = 'btn'
    applyGoalpostBtn.textContent = 'Apply to all missing'
    applyGoalpostBtn.disabled = !canEdit
    applyGoalpostBtn.addEventListener('click', () => applyGoalpostToAll())
    pageContent.appendChild(applyGoalpostBtn)

    const removeGoalpostAllBtn = document.createElement('button')
    removeGoalpostAllBtn.className = 'btn danger'
    removeGoalpostAllBtn.textContent = 'Remove from all'
    removeGoalpostAllBtn.disabled = !canEdit
    removeGoalpostAllBtn.addEventListener('click', () => removeGoalpostFromAll())
    pageContent.appendChild(removeGoalpostAllBtn)
  }

  toolbar.appendChild(pageContent)

  // Dot navigation — pushed to right
  const dots = document.createElement('div')
  dots.className = 'sa-toolbar-dots'
  const dotLabels = STADIUM_ASSET_PAGES.map((c) => (CAM_ASSETS[c] ? CAM_ASSETS[c].title : 'GoalpostGBD'))
  for (let i = 0; i < STADIUM_ASSET_PAGES.length; i++) {
    const dot = document.createElement('button')
    dot.className = 'sa-toolbar-dot' + (state.stadiumAssetsToolbarPage === i ? ' active' : '')
    dot.title = dotLabels[i]
    dot.addEventListener('click', () => {
      state.stadiumAssetsToolbarPage = i
      renderStadiumAssetsPanel()
    })
    dots.appendChild(dot)
  }
  toolbar.appendChild(dots)

  panel.appendChild(toolbar)

  // Search bar
  const searchRow = document.createElement('div')
  searchRow.className = 'gameplay-cam-search-row'

  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.className = 'gameplay-cam-search'
  searchInput.placeholder = 'Search stadiums…'
  searchInput.value = state.stadiumAssetsSearch
  searchRow.appendChild(searchInput)

  const countEl = document.createElement('span')
  countEl.id = 'gameplay-cam-count'
  countEl.className = 'gameplay-cam-count'
  searchRow.appendChild(countEl)

  const topPager = document.createElement('div')
  topPager.className = 'sa-pager'
  searchRow.appendChild(topPager)

  panel.appendChild(searchRow)

  // Table
  if (stadiums.length === 0) {
    countEl.textContent = '0 stadiums'
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.innerHTML = '<p>No stadiums loaded. Load your FIFA root folder first.</p>'
    panel.appendChild(empty)
  } else {
    const table = document.createElement('div')
    table.className = 'gameplay-cam-table'

    const thead = document.createElement('div')
    thead.className = 'sa-row sa-thead'
    for (const label of ['Stadium', 'GameplayCam', 'EntranceCam', 'GoalpostGBD', '']) {
      const cell = document.createElement('span')
      cell.textContent = label
      thead.appendChild(cell)
    }
    table.appendChild(thead)

    const rowsEl = document.createElement('div')
    table.appendChild(rowsEl)

    const noMatchEl = document.createElement('div')
    noMatchEl.className = 'gameplay-cam-no-results'
    noMatchEl.style.display = 'none'
    table.appendChild(noMatchEl)

    const bottomPager = document.createElement('div')
    bottomPager.className = 'sa-pager sa-pager-bottom'

    const buildRow = (stadiumName) => {
      const isZip = /\.zip$/i.test(stadiumName)
      const isRar = /\.rar$/i.test(stadiumName)
      const status = state.stadiumAssetsStatus[stadiumName]
      const scanning = !isStadiumAssetsScanned(stadiumName)
      const error = status?.error || null
      const gp = status?.gameplay || {}
      const entrance = status?.entrance || {}
      const goalpost = status?.goalpost || {}

      const normalizedName = normalizeStadiumItemName(stadiumName)
      const row = document.createElement('div')
      row.className = 'sa-row'
      row.dataset.stadium = normalizedName.toLowerCase()

      // Stadium name
      const nameCell = document.createElement('span')
      nameCell.className = 'gameplay-cam-stadium-name'
      nameCell.title = stadiumName
      nameCell.appendChild(document.createTextNode(normalizedName))
      if (isZip) {
        const badge = document.createElement('span')
        badge.className = 'gameplay-archive-badge zip'
        badge.textContent = 'ZIP'
        nameCell.appendChild(badge)
      } else if (isRar) {
        const badge = document.createElement('span')
        badge.className = 'gameplay-archive-badge rar'
        badge.textContent = 'RAR'
        nameCell.appendChild(badge)
      }
      row.appendChild(nameCell)

      // GameplayCam summary (176 + 261)
      const gpCell = document.createElement('span')
      gpCell.className = 'sa-summary-cell'
      gpCell.appendChild(buildAssetStatusBadge(scanning ? null : gp.has176, scanning, error))
      gpCell.appendChild(buildAssetStatusBadge(scanning ? null : gp.has261, scanning, error))
      row.appendChild(gpCell)

      // EntranceScene summary (176 + 261)
      const entranceCell = document.createElement('span')
      entranceCell.className = 'sa-summary-cell'
      entranceCell.appendChild(buildAssetStatusBadge(scanning ? null : entrance.has176, scanning, error))
      entranceCell.appendChild(buildAssetStatusBadge(scanning ? null : entrance.has261, scanning, error))
      row.appendChild(entranceCell)

      // GoalpostGBD summary (3 badges)
      const goalpostCell = document.createElement('span')
      goalpostCell.className = 'sa-summary-cell'
      goalpostCell.appendChild(buildAssetStatusBadge(scanning ? null : goalpost.hasGoalnet,    scanning, error))
      goalpostCell.appendChild(buildAssetStatusBadge(scanning ? null : goalpost.hasGoalpost,   scanning, error))
      goalpostCell.appendChild(buildAssetStatusBadge(scanning ? null : goalpost.hasNetsupport, scanning, error))
      row.appendChild(goalpostCell)

      const actionCell = document.createElement('span')
      actionCell.style.display = 'flex'
      actionCell.style.justifyContent = 'center'

      if (isRar) {
        // RAR stadiums: only offer conversion, no direct editing
        const canConvert = !!getGameRootPathForDesktopActions()
        const convertBtn = document.createElement('button')
        convertBtn.className = 'btn'
        convertBtn.textContent = 'Convert to ZIP'
        convertBtn.disabled = !canConvert
        if (!canConvert) convertBtn.title = 'Game folder not set (use Change Paths)'
        convertBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          convertStadiumRarToZip(stadiumName)
        })
        actionCell.appendChild(convertBtn)
      } else {
        // The modal edits from the scanned status, so it stays closed until the scan lands.
        const canEditRow = (isZip ? !!getGameRootPathForDesktopActions() : canEdit) && !scanning
        const openBtn = document.createElement('button')
        openBtn.className = 'btn sa-open-btn'
        openBtn.textContent = 'Open'
        openBtn.disabled = !canEditRow
        if (isZip && !canEditRow && !scanning) openBtn.title = 'Game folder not set (use Change Paths) to edit archive stadiums'
        openBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          if (canEditRow) openStadiumAssetsModal(stadiumName)
        })
        actionCell.appendChild(openBtn)
        if (canEditRow) row.addEventListener('click', () => openStadiumAssetsModal(stadiumName))
      }

      row.appendChild(actionCell)
      return row
    }

    const renderPager = (pagerEl, pageCount, goToPage) => {
      pagerEl.innerHTML = ''
      pagerEl.style.display = pageCount > 1 ? '' : 'none'
      if (pageCount <= 1) return
      const page = state.stadiumAssetsListPage

      const addBtn = (icon, title, target, disabled) => {
        const btn = document.createElement('button')
        btn.className = 'btn sa-pager-btn'
        btn.title = title
        btn.disabled = disabled
        btn.innerHTML = `<i class="fa-solid ${icon}"></i>`
        btn.addEventListener('click', () => goToPage(target))
        pagerEl.appendChild(btn)
      }

      addBtn('fa-angles-left', 'First page', 0, page === 0)
      addBtn('fa-angle-left', 'Previous page', page - 1, page === 0)

      const label = document.createElement('span')
      label.className = 'sa-pager-label'
      label.appendChild(document.createTextNode('Page '))
      const pageInput = document.createElement('input')
      pageInput.type = 'number'
      pageInput.className = 'sa-pager-input'
      pageInput.min = '1'
      pageInput.max = String(pageCount)
      pageInput.value = String(page + 1)
      pageInput.title = 'Go to page'
      pageInput.addEventListener('change', () => {
        const target = parseInt(pageInput.value, 10)
        if (Number.isNaN(target)) pageInput.value = String(page + 1)
        else goToPage(target - 1)
      })
      label.appendChild(pageInput)
      label.appendChild(document.createTextNode(' / ' + pageCount))
      pagerEl.appendChild(label)

      addBtn('fa-angle-right', 'Next page', page + 1, page >= pageCount - 1)
      addBtn('fa-angles-right', 'Last page', pageCount - 1, page >= pageCount - 1)
    }

    // Renders the current page of the (filtered) list and scans whatever on it is
    // not cached yet; rows are swapped in place as their scan finishes.
    const renderRows = (scanDelay = 0) => {
      const query = state.stadiumAssetsSearch.trim().toLowerCase()
      const matches = query
        ? stadiums.filter((s) => normalizeStadiumItemName(s).toLowerCase().includes(query))
        : stadiums
      const pageCount = Math.max(1, Math.ceil(matches.length / STADIUM_ASSETS_PAGE_SIZE))
      state.stadiumAssetsListPage = Math.min(Math.max(0, state.stadiumAssetsListPage), pageCount - 1)
      const first = state.stadiumAssetsListPage * STADIUM_ASSETS_PAGE_SIZE
      const pageItems = matches.slice(first, first + STADIUM_ASSETS_PAGE_SIZE)

      const rowByName = new Map()
      rowsEl.innerHTML = ''
      for (const stadiumName of pageItems) {
        const row = buildRow(stadiumName)
        rowByName.set(stadiumName, row)
        rowsEl.appendChild(row)
      }

      noMatchEl.textContent = `No stadiums match "${state.stadiumAssetsSearch}"`
      noMatchEl.style.display = matches.length === 0 ? '' : 'none'

      const range = pageItems.length ? `${first + 1}–${first + pageItems.length} of ` : ''
      countEl.textContent = query
        ? `${range}${matches.length} / ${stadiums.length} stadiums`
        : `${range}${stadiums.length} stadiums`

      const goToPage = (target) => {
        state.stadiumAssetsListPage = target
        renderRows()
        editorEl.scrollTop = 0
      }
      renderPager(topPager, pageCount, goToPage)
      renderPager(bottomPager, pageCount, goToPage)

      clearTimeout(stadiumAssetsScanTimer)
      if (pageItems.some((s) => !isStadiumAssetsScanned(s))) {
        const scanPage = () =>
          scanStadiumAssets(pageItems, (stadiumName) => {
            const oldRow = rowByName.get(stadiumName)
            if (!oldRow?.isConnected) return
            const newRow = buildRow(stadiumName)
            rowByName.set(stadiumName, newRow)
            oldRow.replaceWith(newRow)
          })
        // While typing in the search box, wait for a pause before scanning the matches.
        if (scanDelay > 0) stadiumAssetsScanTimer = setTimeout(scanPage, scanDelay)
        else scanPage()
      }
    }

    searchInput.addEventListener('input', (e) => {
      state.stadiumAssetsSearch = e.target.value
      state.stadiumAssetsListPage = 0
      renderRows(300)
    })

    panel.appendChild(table)
    panel.appendChild(bottomPager)
    renderRows()
  }

  editorEl.appendChild(panel)
}
