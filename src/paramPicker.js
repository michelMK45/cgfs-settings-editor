// Universal visual picker: a searchable grid of options, each optionally
// backed by a preview image. It knows nothing about the asset type - callers
// build the options list (see loadParamPickerOptions in main.js) and receive
// the chosen value through onSelect.
//
// options: [{ value: string, label?: string, getPreview?: () => Promise<Blob | null> }]

export function openParamPicker({ title, options, current = '', onSelect }) {
  const objectUrls = []
  let selected = options.some((o) => o.value === current) ? current : null
  let closed = false

  const overlay = document.createElement('div')
  overlay.className = 'param-picker-overlay'
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  const modal = document.createElement('div')
  modal.className = 'param-picker-modal'
  overlay.appendChild(modal)

  const header = document.createElement('div')
  header.className = 'param-picker-header'
  const titleEl = document.createElement('span')
  titleEl.className = 'param-picker-title'
  titleEl.textContent = title
  const countEl = document.createElement('span')
  countEl.className = 'param-picker-count'
  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'btn stadium-assets-modal-close'
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', close)
  header.appendChild(titleEl)
  header.appendChild(countEl)
  header.appendChild(closeBtn)
  modal.appendChild(header)

  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.className = 'search-box param-picker-search'
  searchInput.placeholder = 'Search...'
  modal.appendChild(searchInput)

  const grid = document.createElement('div')
  grid.className = 'param-picker-grid'
  modal.appendChild(grid)

  const footer = document.createElement('div')
  footer.className = 'param-picker-footer'
  const hint = document.createElement('span')
  hint.className = 'param-picker-hint'
  hint.textContent = 'Click to select, double-click to apply.'
  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.className = 'btn'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.addEventListener('click', close)
  const applyBtn = document.createElement('button')
  applyBtn.type = 'button'
  applyBtn.className = 'btn'
  applyBtn.style.cssText = 'color:var(--accent); border-color:var(--accent);'
  applyBtn.textContent = 'Select'
  applyBtn.addEventListener('click', apply)
  footer.appendChild(hint)
  footer.appendChild(cancelBtn)
  footer.appendChild(applyBtn)
  modal.appendChild(footer)

  // Previews are read from disk only once their tile scrolls into view.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        loadPreview(entry.target)
      }
    },
    { root: grid, rootMargin: '120px' },
  )

  const tiles = new Map()
  const previewCache = new Map() // option value -> object URL, or null when there is none

  async function loadPreview(tile) {
    const option = tiles.get(tile)
    const thumb = tile.querySelector('.param-picker-thumb')
    let url = null
    if (option && previewCache.has(option.value)) {
      url = previewCache.get(option.value)
    } else if (option?.getPreview) {
      try {
        const blob = await option.getPreview()
        if (closed) return
        if (blob) {
          url = URL.createObjectURL(blob)
          objectUrls.push(url)
        }
      } catch (e) {
        url = null
      }
      previewCache.set(option.value, url)
    }
    if (!url) {
      thumb.classList.add('no-preview')
      return
    }
    const img = document.createElement('img')
    img.alt = ''
    img.src = url
    thumb.appendChild(img)
    thumb.classList.add('loaded')
  }

  function select(value) {
    selected = value
    grid.querySelectorAll('.param-picker-tile').forEach((tile) => {
      tile.classList.toggle('selected', tiles.get(tile)?.value === value)
    })
    applyBtn.disabled = selected === null
  }

  function renderGrid() {
    const q = searchInput.value.trim().toLowerCase()
    observer.disconnect()
    tiles.clear()
    grid.innerHTML = ''

    const visible = options.filter((o) => !q || (o.label ?? o.value).toLowerCase().includes(q))
    countEl.textContent = visible.length === options.length ? String(options.length) : `${visible.length} / ${options.length}`

    if (!visible.length) {
      const empty = document.createElement('div')
      empty.className = 'param-picker-empty'
      empty.textContent = 'No matches.'
      grid.appendChild(empty)
      return
    }

    visible.forEach((option) => {
      const label = option.label ?? option.value
      const tile = document.createElement('div')
      tile.className = 'param-picker-tile' + (option.value === selected ? ' selected' : '')
      tile.title = label
      tile.innerHTML =
        '<div class="param-picker-thumb"><i class="fa-regular fa-image" aria-hidden="true"></i></div>' +
        '<div class="param-picker-name"></div>'
      tile.querySelector('.param-picker-name').textContent = label
      tile.addEventListener('click', () => select(option.value))
      tile.addEventListener('dblclick', () => {
        select(option.value)
        apply()
      })
      tiles.set(tile, option)
      grid.appendChild(tile)
      observer.observe(tile)
    })
  }

  function apply() {
    if (selected === null) return
    const value = selected
    close()
    onSelect(value)
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    } else if (e.key === 'Enter' && selected !== null) {
      e.stopPropagation()
      apply()
    }
  }

  function close() {
    if (closed) return
    closed = true
    observer.disconnect()
    document.removeEventListener('keydown', onKeyDown, true)
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    overlay.remove()
  }

  searchInput.addEventListener('input', renderGrid)
  document.addEventListener('keydown', onKeyDown, true)
  document.body.appendChild(overlay)
  renderGrid()
  applyBtn.disabled = selected === null
  grid.querySelector('.param-picker-tile.selected')?.scrollIntoView({ block: 'center' })
  searchInput.focus()
}
