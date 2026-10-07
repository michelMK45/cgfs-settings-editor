const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const { execFile } = require('node:child_process')
const { resolveDllPath, resolvePowerShellExecutable } = require('./db-reader.cjs')

// compobj.txt belongs to the FootballCompEng DLC. Mods ship it as a loose file;
// a vanilla install keeps it packed inside FootballCompEngzf.dll.
const FCE_DIR = ['dlc', 'dlc_FootballCompEng', 'dlc', 'FootballCompEng']
const COMPOBJ_REL = [...FCE_DIR, 'data', 'compdata', 'compobj.txt']
const PACKED_DLL_REL = [...FCE_DIR, 'FootballCompEngzf.dll']

// compobj.txt row: id,type,code,nameKey,parentId
// types: 0 root, 1 confederation, 2 nation, 3 competition (TOUR), 4 stage (ROUND), 5 group
function parseCompobj(text) {
  const nodes = new Map()
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const p = line.split(',')
    if (p.length < 5) continue
    const id = Number(p[0])
    const type = Number(p[1])
    const parent = Number(p[p.length - 1])
    if (!Number.isInteger(id) || !Number.isInteger(type) || !Number.isInteger(parent)) continue
    nodes.set(id, { id, type, code: p[2].trim(), nameKey: p.slice(3, -1).join(',').trim(), parent })
  }

  const ancestorOf = (node, type) => {
    let cur = nodes.get(node.parent)
    for (let guard = 0; cur && guard < 8; guard++) {
      if (cur.type === type) return cur
      cur = nodes.get(cur.parent)
    }
    return null
  }

  const confederations = []
  const nations = []
  const trophies = new Map()
  for (const node of nodes.values()) {
    if (node.type === 1) {
      confederations.push({ id: node.id, code: node.code, name: node.nameKey })
    } else if (node.type === 2) {
      nations.push({ id: node.id, code: node.code, nameKey: node.nameKey, confId: ancestorOf(node, 1)?.id ?? null })
    } else if (node.type === 3) {
      const gfx = /^C(\d+)$/i.exec(node.code)
      trophies.set(node.id, {
        tour: node.id,
        code: node.code,
        gfx: gfx ? Number(gfx[1]) : null,
        nameKey: node.nameKey,
        nationId: ancestorOf(node, 2)?.id ?? null,
        confId: ancestorOf(node, 1)?.id ?? null,
        stages: [],
      })
    }
  }
  for (const node of nodes.values()) {
    if (node.type !== 4) continue
    trophies.get(node.parent)?.stages.push({ round: node.id, code: node.code, nameKey: node.nameKey })
  }

  return { confederations, nations, trophies: [...trophies.values()] }
}

function readCompetitions(gameRootPath, manualPath) {
  const loosePath = path.join(gameRootPath, ...COMPOBJ_REL)
  const packedDll = path.join(gameRootPath, ...PACKED_DLL_REL)

  let source = null
  if (manualPath && fs.existsSync(manualPath)) source = { kind: 'manual', path: manualPath }
  else if (fs.existsSync(loosePath)) source = { kind: 'loose', path: loosePath }

  if (!source) {
    return { ok: false, reason: fs.existsSync(packedDll) ? 'packed' : 'missing', expectedPath: loosePath }
  }

  const parsed = parseCompobj(fs.readFileSync(source.path, 'utf8'))
  if (!parsed.trophies.length) {
    return { ok: false, reason: 'invalid', expectedPath: source.path }
  }
  return { ok: true, source, ...parsed }
}

// Localized names live in the game's language DB: the C### code is the asset id
// and FifaLibrary hashes it to a row of LanguageStrings. Hashes are unsigned 32-bit
// in FifaLibrary and signed in the DB, so both are masked before comparing.
const READ_NAMES_PS1 = `
param(
  [Parameter(Mandatory=$true)][string]$DllPath,
  [Parameter(Mandatory=$true)][string]$LangDb,
  [Parameter(Mandatory=$true)][string]$LangXml,
  [string]$TrophyIds = '',
  [string]$CountryIds = ''
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

Add-Type -Path $DllPath

$f = New-Object FifaLibrary.DbFile($LangDb, $LangXml)
if (-not $f.Load()) { throw 'FifaLibrary could not load the language DB.' }
$lang = New-Object FifaLibrary.Language($f.Table[0])

$mask = [int64]4294967295
$strings = @{}
foreach ($r in $f.ConvertToDataSet().Tables['LanguageStrings'].Rows) {
  $strings[([int64]$r['hashid'] -band $mask)] = [string]$r['sourcetext']
}

function Find-String($hash) { return $strings[([int64]$hash -band $mask)] }

$full = [FifaLibrary.Language+ETournamentStringType]::Full
$abbr = [FifaLibrary.Language+ETournamentStringType]::Abbr15

$trophies = @{}
foreach ($token in $TrophyIds.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)) {
  $id = [int]$token
  $name = Find-String ($lang.GetTournamentHash($id, $full))
  if (-not $name) { $name = Find-String ($lang.GetTournamentHash($id, $abbr)) }
  if ($name) { $trophies["$id"] = $name }
}

$countries = @{}
foreach ($token in $CountryIds.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries)) {
  $id = [int]$token
  $name = Find-String ($lang.GetCountryHash($id))
  if ($name) { $countries["$id"] = $name }
}

@{ trophies = $trophies; countries = $countries } | ConvertTo-Json -Compress -Depth 3
`

// Prefers English; otherwise the first full language DB that has its meta XML
// (skipping the _N_ copies and the _upd patch files).
function findLanguageDb(gameRootPath) {
  const locDir = path.join(gameRootPath, 'data', 'loc')
  let files
  try { files = fs.readdirSync(locDir) } catch (_) { return null }

  const names = files
    .filter((f) => /\.db$/i.test(f) && !/^_\d+_/.test(f) && !/_upd\.db$/i.test(f))
    .map((f) => f.slice(0, -3))
    .filter((n) => files.includes(n + '-meta.xml'))
  if (!names.length) return null

  const pick = names.find((n) => n.toLowerCase() === 'eng_us') || names[0]
  return { dbPath: path.join(locDir, pick + '.db'), xmlPath: path.join(locDir, pick + '-meta.xml'), name: pick }
}

function runPowerShell(args) {
  const psExe = resolvePowerShellExecutable()
  const scriptPath = path.join(os.tmpdir(), `cgfs-read-compnames-${process.pid}.ps1`)
  fs.writeFileSync(scriptPath, READ_NAMES_PS1, 'utf8')

  return new Promise((resolve, reject) => {
    execFile(
      psExe,
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args],
      { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 },
      (err, stdout, stderr) => {
        fs.unlink(scriptPath, () => {})
        if (err) reject(new Error((stderr || '').trim() || err.message))
        else resolve(stdout)
      }
    )
  })
}

async function readCompetitionNames(gameRootPath, trophyAssetIds, countryIds) {
  const dllPath = resolveDllPath()
  if (!fs.existsSync(dllPath)) throw new Error('Could not find FifaLibrary14.dll at: ' + dllPath)

  const lang = findLanguageDb(gameRootPath)
  if (!lang) throw new Error('No language database found in ' + path.join(gameRootPath, 'data', 'loc'))

  const output = await runPowerShell([
    '-DllPath', dllPath,
    '-LangDb', lang.dbPath,
    '-LangXml', lang.xmlPath,
    '-TrophyIds', trophyAssetIds.join(','),
    '-CountryIds', countryIds.join(','),
  ])

  const parsed = JSON.parse((output || '').trim() || '{}')
  return { language: lang.name, trophies: parsed.trophies || {}, countries: parsed.countries || {} }
}

module.exports = {
  readCompetitions,
  readCompetitionNames,
  parseCompobj,
}
