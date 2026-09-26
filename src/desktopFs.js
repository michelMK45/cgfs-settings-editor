// FileSystemDirectoryHandle / FileSystemFileHandle look-alikes backed by the
// Electron main process (window.electronAPI.fs), scoped to the saved game root.
//
// The real File System Access handles need a folder picker plus a per-session
// permission prompt, which can't happen at startup. These implement just the
// subset main.js uses, so the same code paths run against the saved game root
// with no user gesture.

const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

function domError(name, message) {
  const err = new Error(message)
  err.name = name
  return err
}

function joinRel(base, name) {
  return base ? base + '/' + name : name
}

class DesktopFileHandle {
  constructor(rel, name) {
    this.kind = 'file'
    this.name = name
    this._rel = rel
  }

  async getFile() {
    const bytes = await window.electronAPI.fs.readFile(this._rel)
    const ext = this.name.split('.').pop().toLowerCase()
    return new File([bytes], this.name, { type: MIME_BY_EXT[ext] || '' })
  }

  // Chunks are buffered and written once on close(), so an aborted write never
  // leaves a half-written file behind.
  async createWritable() {
    const chunks = []
    const rel = this._rel
    return {
      write: async (data) => { chunks.push(data) },
      close: async () => {
        await window.electronAPI.fs.writeFile(rel, await new Blob(chunks).arrayBuffer())
      },
    }
  }

  async queryPermission() { return 'granted' }
  async requestPermission() { return 'granted' }
}

class DesktopDirHandle {
  constructor(rel, name) {
    this.kind = 'directory'
    this.name = name
    this._rel = rel
  }

  async getDirectoryHandle(name, options) {
    const rel = joinRel(this._rel, name)
    const info = await window.electronAPI.fs.stat(rel)
    if (!info) {
      if (!options?.create) throw domError('NotFoundError', 'Directory not found: ' + rel)
      await window.electronAPI.fs.mkdir(rel)
    } else if (info.kind !== 'directory') {
      throw domError('TypeMismatchError', 'Not a directory: ' + rel)
    }
    return new DesktopDirHandle(rel, name)
  }

  async getFileHandle(name, options) {
    const rel = joinRel(this._rel, name)
    const info = await window.electronAPI.fs.stat(rel)
    if (!info) {
      if (!options?.create) throw domError('NotFoundError', 'File not found: ' + rel)
      await window.electronAPI.fs.writeFile(rel, new ArrayBuffer(0))
    } else if (info.kind !== 'file') {
      throw domError('TypeMismatchError', 'Not a file: ' + rel)
    }
    return new DesktopFileHandle(rel, name)
  }

  async removeEntry(name) {
    await window.electronAPI.fs.remove(joinRel(this._rel, name))
  }

  async *values() {
    const entries = await window.electronAPI.fs.list(this._rel)
    for (const { name, kind } of entries) {
      const rel = joinRel(this._rel, name)
      yield kind === 'directory' ? new DesktopDirHandle(rel, name) : new DesktopFileHandle(rel, name)
    }
  }

  async queryPermission() { return 'granted' }
  async requestPermission() { return 'granted' }
}

// rootPath must be the game root the main process currently holds; the handle
// only carries its display name, since every fs call is resolved against the
// main process's root.
export function createDesktopRootHandle(rootPath) {
  const name = rootPath.replace(/[/\\]+$/, '').split(/[/\\]/).pop() || rootPath
  return new DesktopDirHandle('', name)
}
