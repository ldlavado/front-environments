export async function downloadElementAsPng(element, fileName = 'matrix.png') {
  if (typeof window === 'undefined') throw new Error('Solo disponible en el navegador')
  if (!element) throw new Error('Elemento de matriz no encontrado')

  try {
    const { default: html2canvas } = await import('html2canvas')

    const computedElementBg = window.getComputedStyle(element).backgroundColor
    const computedBodyBg = window.getComputedStyle(document.body).backgroundColor
    const cssVarBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg')

    let backgroundColor = (computedElementBg && computedElementBg.trim()) || ''
    if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      backgroundColor = (computedBodyBg && computedBodyBg.trim()) || ''
    }
    if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      backgroundColor = (cssVarBg && cssVarBg.trim()) || ''
    }
    if (!backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      backgroundColor = '#ffffff'
    }

    const normalized = (fileName || 'matrix')
      .toString()
      .trim()
      .replace(/\s+/g, '_')
    const finalName = normalized.toLowerCase().endsWith('.png')
      ? normalized
      : `${normalized}.png`

    element.setAttribute('data-export-root', 'true')

    let result
    try {
      result = await html2canvas(element, {
        backgroundColor,
        scale: Math.min(window.devicePixelRatio || 2, 3),
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        logging: false,
        ignoreElements: (el) => el?.dataset?.exportIgnore === 'true',
        onclone: (doc) => {
          const root = doc.querySelector('[data-export-root="true"]')
          if (!root) return
          const getBg = (node) => {
            const view = doc.defaultView
            const bg = view?.getComputedStyle(node)?.backgroundColor
            if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
              return backgroundColor
            }
            return bg
          }
          root.style.boxShadow = 'none'
          root.style.background = getBg(root)
          root.style.backgroundColor = getBg(root)
          root.querySelectorAll('.card').forEach((node) => {
            node.style.boxShadow = 'none'
            const bg = getBg(node)
            node.style.background = bg
            node.style.backgroundColor = bg
          })

          const view = doc.defaultView
          root.querySelectorAll('input').forEach((input) => {
            if (input.dataset?.exportKeepInput === 'true') return
            const span = doc.createElement('span')
            const computed = view?.getComputedStyle(input)
            const value =
              input.value ??
              input.getAttribute('value') ??
              input.placeholder ??
              ''
            span.textContent = value
            span.style.display = 'inline-block'
            span.style.verticalAlign = 'middle'
            span.style.padding = computed?.padding || '4px 8px'
            span.style.border = computed?.border || '1px solid rgba(0,0,0,0.2)'
            span.style.borderRadius = computed?.borderRadius || '6px'
            span.style.color = computed?.color || '#0f172a'
            const spanBg =
              computed?.backgroundColor &&
              computed.backgroundColor !== 'rgba(0, 0, 0, 0)'
                ? computed.backgroundColor
                : '#ffffff'
            span.style.background = spanBg
            span.style.backgroundColor = spanBg
            span.style.minWidth =
              computed?.width && computed.width !== 'auto'
                ? computed.width
                : `${Math.max(40, value.length * 12)}px`
            span.style.textAlign = computed?.textAlign || 'center'
            span.style.font = computed?.font || computed?.fontFamily || 'inherit'
            span.style.fontSize = computed?.fontSize || '14px'
            span.style.lineHeight = computed?.lineHeight || '1.5'
            span.setAttribute('data-export-replaced-input', 'true')
            input.replaceWith(span)
          })
        },
      })
    } finally {
      element.removeAttribute('data-export-root')
    }

    const dataUrl = result.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = finalName
    link.click()
  } catch (err) {
    element?.removeAttribute?.('data-export-root')
    throw new Error(
      err?.message || 'No se pudo generar la imagen de la matriz.'
    )
  }
}

export function createMatrixPngHandler(ref, fileName) {
  return async () => {
    try {
      await downloadElementAsPng(ref?.current, fileName)
    } catch (err) {
      alert(err.message)
    }
  }
}
