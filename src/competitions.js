// "Competitions" tab of the database panel: lists the competitions from the
// game's compobj.txt with the IDs the Round / Tournament ID sections ask for.
//   TOUR  = id of a competition row (type 3)
//   ROUND = id of one of its stage rows (type 4)
//   GFX   = the number in the competition's C### code (graphics id)
// The IDs differ between installations, so they are always read from the user's
// own files. Names come from the game's language DB and fill in after the list.

const TAB_KEY = 'dbPanelTab'

const comp = {
  data: null, // { source, confederations, nations, trophies }
  names: { trophies: {}, countries: {} },
  expanded: new Set(),
  search: '',
  conf: '',
  nation: '',
  loadToken: 0,
  activeTab: 'teams',
}

let opts = { isDesktop: false, getRootPath: () => '', toast: () => {} }
let lastIdInput = null

const el = (id) => document.getElementById(id)

export function getActiveDbTab() {
  return comp.activeTab
}

// ---- tabs -------------------------------------------------------------

function setDbTab(tab) {
  comp.activeTab = tab === 'competitions' ? 'competitions' : 'teams'
  document.querySelectorAll('.panel-db-tab').forEach((btn) => {
    const active = btn.dataset.dbTab === comp.activeTab
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-selected', active ? 'true' : 'false')
  })
  el('db-pane-teams').hidden = comp.activeTab !== 'teams'
  el('db-pane-competitions').hidden = comp.activeTab !== 'competitions'
  try { localStorage.setItem(TAB_KEY, comp.activeTab) } catch (e) { /* ignore storage errors */ }
}

// ---- names ------------------------------------------------------------

function nationNumber(nation) {
  return /(\d+)$/.exec(nation.nameKey)?.[1]
}

function nationLabel(nation) {
  return comp.names.countries[nationNumber(nation)] || nation.code
}

function confLabel(conf) {
  return conf.name || conf.code
}

function trophyName(trophy) {
  return comp.names.trophies[trophy.gfx] || ''
}

// FCE_Round_of_16 -> "Round of 16"
function stageName(stage) {
  return stage.nameKey.replace(/^FCE_/, '').replace(/_/g, ' ').trim()
}

function stageLabel(stage) {
  const name = stageName(stage)
  return name ? `${stage.code} · ${name}` : stage.code
}

// ---- filtering --------------------------------------------------------

function matchesTrophy(trophy, nationsById, q) {
  const nation = nationsById.get(trophy.nationId)
  return [trophy.tour, trophy.gfx, trophy.code, trophyName(trophy), nation ? nationLabel(nation) : '']
    .some((v) => String(v ?? '').toLowerCase().includes(q))
}

function matchesStage(stage, q) {
  return [stage.round, stage.code, stageName(stage)].some((v) => String(v).toLowerCase().includes(q))
}

// Returns [{ trophy, stages, forceOpen }] for what is currently visible.
function getVisible() {
  if (!comp.data) return []
  const nationsById = new Map(comp.data.nations.map((n) => [n.id, n]))
  const q = comp.search.trim().toLowerCase()
  const out = []

  for (const trophy of comp.data.trophies) {
    if (comp.conf && String(trophy.confId) !== comp.conf) continue
    if (comp.nation === '-' && trophy.nationId !== null) continue
    if (comp.nation && comp.nation !== '-' && String(trophy.nationId) !== comp.nation) continue

    if (!q) {
      out.push({ trophy, stages: trophy.stages, forceOpen: false })
    } else if (matchesTrophy(trophy, nationsById, q)) {
      out.push({ trophy, stages: trophy.stages, forceOpen: false })
    } else {
      const stages = trophy.stages.filter((s) => matchesStage(s, q))
      if (stages.length) out.push({ trophy, stages, forceOpen: true })
    }
  }

  const sortKey = (t) => (trophyName(t.trophy) || t.trophy.code).toLowerCase()
  return out.sort((a, b) => sortKey(a).localeCompare(sortKey(b), undefined, { numeric: true }))
}

// ---- ID chips ---------------------------------------------------------

function fillLastIdInput(value) {
  if (!lastIdInput || !lastIdInput.isConnected) {
    opts.toast('Click an ID field in the editor first, or drag the ID onto it.', 'error')
    return
  }
  lastIdInput.value = value
  lastIdInput.dispatchEvent(new Event('input', { bubbles: true }))
  lastIdInput.dispatchEvent(new Event('change', { bubbles: true }))
  opts.toast('ID ' + value + ' applied', 'success')
}

async function copyValue(label, value) {
  try {
    await navigator.clipboard.writeText(value)
    opts.toast(label + ' ' + value + ' copied', 'success')
  } catch (e) {
    opts.toast('Could not copy to the clipboard.', 'error')
  }
}

function makeChip(label, value) {
  const text = String(value)
  const chip = document.createElement('span')
  chip.className = 'comp-chip'
  chip.draggable = true
  chip.title = `${label} ${text} - click to copy, double-click to apply, or drag onto an ID field`

  const labelEl = document.createElement('span')
  labelEl.className = 'comp-chip-label'
  labelEl.textContent = label
  const valueEl = document.createElement('span')
  valueEl.className = 'comp-chip-value'
  valueEl.textContent = text
  chip.append(labelEl, valueEl)

  // A double-click also fires two clicks; wait briefly so it only copies once.
  let copyTimer = null
  chip.addEventListener('click', (e) => {
    e.stopPropagation()
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => copyValue(label, text), 220)
  })
  chip.addEventListener('dblclick', (e) => {
    e.stopPropagation()
    clearTimeout(copyTimer)
    fillLastIdInput(text)
  })
  // The editor's ID inputs accept any numeric text/plain drop.
  chip.addEventListener('dragstart', (e) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/x-cgfs-team-id', text)
    e.dataTransfer.setData('text/plain', text)
    chip.classList.add('dragging')
  })
  chip.addEventListener('dragend', () => chip.classList.remove('dragging'))
  return chip
}

// ---- rendering --------------------------------------------------------

function renderFilters() {
  const confSel = el('comp-conf')
  const nationSel = el('comp-nation')
  if (!comp.data) {
    confSel.replaceChildren(new Option('All confederations', ''))
    nationSel.replaceChildren(new Option('All countries', ''))
    return
  }

  const confs = [...comp.data.confederations].sort((a, b) => confLabel(a).localeCompare(confLabel(b)))
  confSel.innerHTML = ''
  confSel.append(new Option('All confederations', ''))
  confs.forEach((c) => confSel.append(new Option(confLabel(c), String(c.id))))
  confSel.value = comp.conf

  const nations = comp.data.nations
    .filter((n) => !comp.conf || String(n.confId) === comp.conf)
    .sort((a, b) => nationLabel(a).localeCompare(nationLabel(b)))
  nationSel.innerHTML = ''
  nationSel.append(new Option('All countries', ''))
  nationSel.append(new Option('No country', '-'))
  nations.forEach((n) => nationSel.append(new Option(nationLabel(n), String(n.id))))
  nationSel.value = [...nationSel.options].some((o) => o.value === comp.nation) ? comp.nation : ''
  comp.nation = nationSel.value
}

function renderList() {
  const list = el('comp-list')
  const rows = getVisible()
  el('comp-count').textContent = String(rows.length)
  list.innerHTML = ''

  if (!comp.data) {
    list.innerHTML = '<div class="db-empty">No competitions loaded.</div>'
    return
  }
  if (!rows.length) {
    list.innerHTML = '<div class="db-empty">No competitions found.</div>'
    return
  }

  const nationsById = new Map(comp.data.nations.map((n) => [n.id, n]))
  const frag = document.createDocumentFragment()

  for (const { trophy, stages, forceOpen } of rows) {
    const open = forceOpen || comp.expanded.has(trophy.tour)
    const name = trophyName(trophy)
    const nation = nationsById.get(trophy.nationId)

    const row = document.createElement('div')
    row.className = 'comp-trophy' + (open ? ' open' : '')

    const caret = document.createElement('i')
    caret.className = 'fa-solid fa-caret-right comp-caret'
    caret.setAttribute('aria-hidden', 'true')

    const text = document.createElement('div')
    text.className = 'comp-trophy-text'
    const title = document.createElement('div')
    title.className = 'comp-trophy-name'
    title.textContent = name || trophy.code
    title.title = title.textContent
    const sub = document.createElement('div')
    sub.className = 'comp-trophy-sub'
    sub.textContent = [name ? trophy.code : '', nation ? nationLabel(nation) : ''].filter(Boolean).join(' · ') || ' '
    text.append(title, sub)

    const chips = document.createElement('div')
    chips.className = 'comp-chips'
    chips.append(makeChip('TOUR', trophy.tour))
    if (trophy.gfx !== null) chips.append(makeChip('GFX', trophy.gfx))

    row.append(caret, text, chips)
    row.addEventListener('click', () => {
      if (forceOpen) return
      if (comp.expanded.has(trophy.tour)) comp.expanded.delete(trophy.tour)
      else comp.expanded.add(trophy.tour)
      renderList()
    })
    frag.append(row)

    if (!open) continue
    for (const stage of stages) {
      const stageRow = document.createElement('div')
      stageRow.className = 'comp-stage'
      const label = document.createElement('div')
      label.className = 'comp-stage-name'
      label.textContent = stageLabel(stage)
      label.title = label.textContent
      const stageChips = document.createElement('div')
      stageChips.className = 'comp-chips'
      stageChips.append(makeChip('ROUND', stage.round))
      stageRow.append(label, stageChips)
      frag.append(stageRow)
    }
  }
  list.append(frag)
}

function setStatus(message, type = '') {
  const status = el('comp-status')
  status.textContent = message
  status.title = comp.data?.source?.path || ''
  status.className = 'panel-db-status' + (type ? ' ' + type : '')
}

function describeSource(source) {
  return source.kind === 'manual' ? 'the chosen file' : 'compobj.txt'
}

// ---- loading ----------------------------------------------------------

function applyData(data) {
  comp.data = data
  comp.names = { trophies: {}, countries: {} }
  comp.expanded.clear()
  comp.conf = ''
  comp.nation = ''
  renderFilters()
  renderList()
  setStatus(`Loaded ${data.trophies.length} competitions from ${describeSource(data.source)}. Loading names...`, 'ok')
}

function applyUnavailable(result) {
  comp.data = null
  renderFilters()
  renderList()
  const where = result.expectedPath ? '\n' + result.expectedPath : ''
  if (result.reason === 'packed') {
    setStatus('compobj.txt was not found. This looks like a vanilla install, where the competition data is packed inside FootballCompEngzf.dll and cannot be read yet. Choose a compobj.txt by hand.' + where, 'err')
  } else if (result.reason === 'invalid') {
    setStatus('That file has no competitions. Choose a valid compobj.txt.' + where, 'err')
  } else {
    setStatus('compobj.txt was not found. Choose it by hand.' + where, 'err')
  }
}

async function loadNames(rootPath, token) {
  try {
    const names = await window.electronAPI.db.getCompetitionNames(rootPath)
    if (token !== comp.loadToken || !comp.data) return
    comp.names = { trophies: names.trophies || {}, countries: names.countries || {} }
    renderFilters()
    renderList()
    const named = comp.data.trophies.filter((t) => trophyName(t)).length
    setStatus(`Loaded ${comp.data.trophies.length} competitions from ${describeSource(comp.data.source)}. Names: ${named} found (${names.language}).`, 'ok')
  } catch (e) {
    if (token !== comp.loadToken || !comp.data) return
    setStatus(`Loaded ${comp.data.trophies.length} competitions. Names unavailable: ${e?.message || e}`, 'err')
  }
}

export async function loadCompetitions(explicitRootPath = '') {
  if (!opts.isDesktop || !window.electronAPI?.db?.getCompetitions) {
    setStatus('Competitions are available only in Desktop (Electron).', 'err')
    return
  }
  const rootPath = explicitRootPath || opts.getRootPath()
  if (!rootPath) {
    setStatus('Select your FIFA 16 root folder first.')
    return
  }

  const token = ++comp.loadToken
  setStatus('Reading compobj.txt...')
  try {
    const result = await window.electronAPI.db.getCompetitions(rootPath)
    if (token !== comp.loadToken) return
    if (!result.ok) {
      applyUnavailable(result)
      return
    }
    applyData(result)
    loadNames(rootPath, token)
  } catch (e) {
    if (token !== comp.loadToken) return
    comp.data = null
    renderFilters()
    renderList()
    setStatus('Competitions load failed: ' + (e?.message || e), 'err')
  }
}

async function pickCompobj() {
  const rootPath = opts.getRootPath()
  if (!opts.isDesktop || !rootPath) {
    opts.toast('Select your FIFA 16 root folder first.', 'error')
    return
  }
  try {
    const result = await window.electronAPI.db.pickCompobj(rootPath)
    if (result.canceled) return
    const token = ++comp.loadToken
    if (!result.ok) {
      applyUnavailable(result)
      return
    }
    applyData(result)
    loadNames(rootPath, token)
  } catch (e) {
    setStatus('Could not read that file: ' + (e?.message || e), 'err')
  }
}

export function resetCompetitions(message = 'Select your FIFA 16 root folder to load competitions.') {
  comp.loadToken++
  comp.data = null
  comp.names = { trophies: {}, countries: {} }
  comp.expanded.clear()
  comp.search = ''
  comp.conf = ''
  comp.nation = ''
  const search = el('comp-search')
  if (search) search.value = ''
  renderFilters()
  renderList()
  setStatus(message)
}

// ---- init -------------------------------------------------------------

export function initCompetitions(options) {
  opts = { ...opts, ...options }

  let saved = null
  try { saved = localStorage.getItem(TAB_KEY) } catch (e) { /* ignore storage errors */ }
  setDbTab(saved)

  document.querySelectorAll('.panel-db-tab').forEach((btn) => {
    btn.addEventListener('click', () => setDbTab(btn.dataset.dbTab))
  })

  el('comp-search')?.addEventListener('input', (e) => {
    comp.search = e.target.value || ''
    renderList()
  })
  el('comp-conf')?.addEventListener('change', (e) => {
    comp.conf = e.target.value
    comp.nation = ''
    renderFilters()
    renderList()
  })
  el('comp-nation')?.addEventListener('change', (e) => {
    comp.nation = e.target.value
    renderList()
  })
  el('comp-pick')?.addEventListener('click', pickCompobj)

  // Remember the last ID input the user was in, so a double-clicked ID has a target.
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement && e.target.classList.contains('entry-id')) lastIdInput = e.target
  })

  if (!opts.isDesktop) setStatus('Competitions are available only in Desktop (Electron).', 'err')
  renderFilters()
  renderList()
}
