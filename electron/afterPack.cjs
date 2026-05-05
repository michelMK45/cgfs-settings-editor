/**
 * afterPack hook: embeds icon.ico into the packaged EXE using rcedit.
 * This runs after electron-builder packs the app, bypassing the need for
 * winCodeSign / symlink privileges (signAndEditExecutable=false).
 */
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return

  const rceditBin = path.join(
    context.packager.projectDir,
    'node_modules',
    'rcedit',
    'bin',
    'rcedit.exe'
  )

  if (!fs.existsSync(rceditBin)) {
    console.warn('[afterPack] rcedit.exe not found, skipping icon embed.')
    return
  }

  const iconPath = path.join(context.packager.projectDir, 'icon.ico')

  if (!fs.existsSync(iconPath)) {
    console.warn('[afterPack] icon.ico not found, skipping icon embed.')
    return
  }

  const productFilename = context.packager.appInfo.productFilename
  const exePath = path.join(context.appOutDir, `${productFilename}.exe`)

  if (!fs.existsSync(exePath)) {
    console.warn(`[afterPack] Executable not found: ${exePath}`)
    return
  }

  console.log(`[afterPack] Embedding icon into ${exePath}`)
  execFileSync(rceditBin, [exePath, '--set-icon', iconPath])
  console.log('[afterPack] Icon embedded successfully.')
}
