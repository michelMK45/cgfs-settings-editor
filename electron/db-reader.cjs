const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const { app } = require('electron')

const READ_TEAMS_PS1 = `
param(
  [Parameter(Mandatory=$true)][string]$DllPath,
  [Parameter(Mandatory=$true)][string]$DbPath,
  [Parameter(Mandatory=$true)][string]$XmlPath
)

$ErrorActionPreference = 'Stop'

if (!(Test-Path -LiteralPath $DllPath)) { throw "FifaLibrary14.dll not found at: $DllPath" }
if (!(Test-Path -LiteralPath $DbPath)) { throw "Database file not found at: $DbPath" }
if (!(Test-Path -LiteralPath $XmlPath)) { throw "Metadata XML not found at: $XmlPath" }

Add-Type -Path $DllPath

$dbFile = New-Object FifaLibrary.DbFile($DbPath, $XmlPath)
$loaded = $dbFile.Load()
if (-not $loaded) { throw 'FifaLibrary could not load DB/XML files.' }

$dataSet = $dbFile.ConvertToDataSet()
if ($null -eq $dataSet) { throw 'FifaLibrary.ConvertToDataSet() returned null.' }

$teamsTable = $null
foreach ($table in $dataSet.Tables) {
  if ($table -and $table.TableName -and $table.TableName.Equals('teams', [System.StringComparison]::OrdinalIgnoreCase)) {
    $teamsTable = $table
    break
  }
}

if ($null -eq $teamsTable) {
  throw 'Could not find teams table in database.'
}

function Get-ColumnName {
  param(
    [Parameter(Mandatory=$true)]$Table,
    [Parameter(Mandatory=$true)][string[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    foreach ($col in $Table.Columns) {
      if ($col.ColumnName.Equals($candidate, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $col.ColumnName
      }
    }
  }
  return $null
}

$idColumn = Get-ColumnName -Table $teamsTable -Candidates @('teamid', 'id')
if ([string]::IsNullOrWhiteSpace($idColumn)) {
  throw 'Could not detect id column in teams table (expected teamid or id).'
}

$nameColumn = Get-ColumnName -Table $teamsTable -Candidates @('teamname', 'name', 'displayname', 'TeamNameFull', 'DatabaseName', 'TeamNameAbbr15', 'TeamNameAbbr10', 'TeamNameAbbr3')

$result = @()

foreach ($row in $teamsTable.Rows) {
  $idValue = $row[$idColumn]
  if ($null -eq $idValue -or $idValue -is [System.DBNull]) {
    continue
  }

  $id = 0
  if (-not [int]::TryParse([string]$idValue, [ref]$id)) {
    continue
  }

  $name = $null
  if (-not [string]::IsNullOrWhiteSpace($nameColumn)) {
    $nameValue = $row[$nameColumn]
    if ($null -ne $nameValue -and $nameValue -isnot [System.DBNull]) {
      $name = [string]$nameValue
    }
  }

  if ([string]::IsNullOrWhiteSpace($name)) {
    $name = "Team $id"
  }

  $result += [PSCustomObject]@{
    id = $id
    name = $name
  }
}

$result | ConvertTo-Json -Compress -Depth 3
`

function resolveDllPath() {
  const candidates = []

  if (app && app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, 'bin', 'FifaLibrary14.dll'))
  }

  candidates.push(path.join(process.cwd(), 'bin', 'FifaLibrary14.dll'))
  candidates.push(path.join(__dirname, '..', 'bin', 'FifaLibrary14.dll'))

  const found = candidates.find((candidate) => fs.existsSync(candidate))
  return found || candidates[0]
}

function resolvePowerShellExecutable() {
  try {
    execFileSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { stdio: 'ignore' })
    return 'pwsh'
  } catch (e) {
    return 'powershell'
  }
}

function readTeamsViaPowerShell(dllPath, dbPath, xmlPath) {
  const psExe = resolvePowerShellExecutable()
  const scriptPath = path.join(os.tmpdir(), `cgfs-read-teams-${process.pid}.ps1`)
  fs.writeFileSync(scriptPath, READ_TEAMS_PS1, 'utf8')

  try {
    const output = execFileSync(
      psExe,
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-DllPath', dllPath, '-DbPath', dbPath, '-XmlPath', xmlPath],
      { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 }
    )

    const text = (output || '').trim()
    if (!text) return []

    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : [parsed]
  } finally {
    try {
      fs.unlinkSync(scriptPath)
    } catch (e) {
      // ignore temp cleanup errors
    }
  }
}

function buildDbPaths(gameRootPath) {
  return {
    dbPath: path.join(gameRootPath, 'data', 'db', 'fifa_ng_db.db'),
    xmlPath: path.join(gameRootPath, 'data', 'db', 'fifa_ng_db-meta.xml'),
  }
}

function ensureDbFiles(gameRootPath) {
  const { dbPath, xmlPath } = buildDbPaths(gameRootPath)
  if (!fs.existsSync(dbPath)) {
    throw new Error('Could not find database file at: ' + dbPath)
  }
  if (!fs.existsSync(xmlPath)) {
    throw new Error('Could not find metadata file at: ' + xmlPath)
  }
  return { dbPath, xmlPath }
}

async function readTeamsFromGameRoot(gameRootPath) {
  if (!gameRootPath || typeof gameRootPath !== 'string') {
    throw new Error('Game root path is required.')
  }

  const dllPath = resolveDllPath()
  if (!fs.existsSync(dllPath)) {
    throw new Error('Could not find FifaLibrary14.dll at: ' + dllPath)
  }

  const { dbPath, xmlPath } = ensureDbFiles(gameRootPath)
  const teams = readTeamsViaPowerShell(dllPath, dbPath, xmlPath)

  const normalized = Array.isArray(teams)
    ? teams
        .map((item) => ({
          id: Number(item.id),
          name: String(item.name || '').trim(),
        }))
        .filter((item) => Number.isFinite(item.id) && item.name)
        .sort((a, b) => a.id - b.id)
    : []

  return normalized
}

module.exports = {
  readTeamsFromGameRoot,
  buildDbPaths,
}
