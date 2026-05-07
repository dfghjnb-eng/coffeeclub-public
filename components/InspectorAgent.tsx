'use client'
import { useEffect } from 'react'

const CSS_VAR_KEYS = [
  '--p-bg', '--p-bg-alt', '--p-ink', '--p-text', '--p-muted', '--p-dim',
  '--p-accent', '--p-peach', '--p-lemon',
  '--sh-d', '--sh-ds', '--sh-l',
  '--sz-hero', '--sz-name', '--sz-body', '--sz-label', '--sz-tag',
  '--sz-radius', '--sz-padding', '--sz-gap', '--sz-border',
  '--dot-0', '--dot-1', '--dot-2', '--dot-3', '--dot-4', '--dot-5',
]

function getCssVarSnapshot(): Record<string, string> {
  const style = getComputedStyle(document.documentElement)
  const snap: Record<string, string> = {}
  CSS_VAR_KEYS.forEach(k => {
    snap[k] = style.getPropertyValue(k).trim()
  })
  return snap
}

export default function InspectorAgent() {
  useEffect(() => {
    // iframe 환경에서만 활성화
    const inIframe = (() => {
      try { return window.self !== window.top }
      catch { return true }
    })()
    if (!inIframe) return

    let active = true
    let prevEl: HTMLElement | null = null
    let prevOutline = ''
    let prevOutlineOffset = ''

    function restorePrev() {
      if (prevEl) {
        prevEl.style.outline = prevOutline
        prevEl.style.outlineOffset = prevOutlineOffset
        prevEl = null
      }
    }

    function onMouseOver(e: MouseEvent) {
      if (!active) return
      const target = e.target as HTMLElement
      if (!target || target.tagName === 'HTML' || target.tagName === 'BODY') return
      if (prevEl === target) return
      restorePrev()
      prevEl = target
      prevOutline = target.style.outline
      prevOutlineOffset = target.style.outlineOffset
      target.style.outline = '2px solid rgba(255,127,64,0.8)'
      target.style.outlineOffset = '1px'
    }

    function onMouseOut(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (prevEl && prevEl === target) restorePrev()
    }

    function onClick(e: MouseEvent) {
      if (!active) return
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement
      if (!target) return

      const cs = window.getComputedStyle(target)
      const rect = target.getBoundingClientRect()

      // SVG elements expose fill/stroke via computed style
      const fill   = cs.getPropertyValue('fill').trim()
      const stroke = cs.getPropertyValue('stroke').trim()

      window.parent.postMessage({
        type: 'inspect',
        data: {
          tag: target.tagName.toLowerCase(),
          text: (target.innerText || target.textContent || '').trim().slice(0, 100),
          className: (typeof target.className === 'string' ? target.className : '').slice(0, 120),
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fill,
          stroke,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
          borderRadius: cs.borderRadius,
          padding: cs.padding,
          boxShadow: cs.boxShadow.slice(0, 80),
          cssVars: getCssVarSnapshot(),
          rect: {
            x: Math.round(rect.x), y: Math.round(rect.y),
            w: Math.round(rect.width), h: Math.round(rect.height),
          },
        },
      }, '*')
    }

    function onMessage(e: MessageEvent) {
      const msg = e.data
      if (!msg || msg.type !== 'inspectorToggle') return
      active = !!msg.active
      if (!active) restorePrev()   // 즉시 하이라이트 제거
    }

    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('click', onClick, true)
    window.addEventListener('message', onMessage)

    return () => {
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('message', onMessage)
      restorePrev()
    }
  }, [])

  return null
}
