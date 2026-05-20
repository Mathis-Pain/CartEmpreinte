export function createMarkerElement(color: string, icon?: string): HTMLElement {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#6b7280'
  const safeIcon = typeof icon === 'string' && icon.trim() ? icon : '📍'

  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('width', '36')
  svg.setAttribute('height', '44')
  svg.setAttribute('viewBox', '0 0 36 44')
  svg.style.cssText = 'pointer-events:auto;display:block;overflow:visible;'

  const path = document.createElementNS(NS, 'path')
  path.setAttribute('d', 'M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z')
  path.setAttribute('fill', safeColor)
  path.setAttribute('stroke', 'white')
  path.setAttribute('stroke-width', '2')
  path.style.pointerEvents = 'auto'

  const text = document.createElementNS(NS, 'text')
  text.setAttribute('x', '18')
  text.setAttribute('y', '23')
  text.setAttribute('text-anchor', 'middle')
  text.setAttribute('font-size', '14')
  text.setAttribute('fill', 'white')
  text.style.pointerEvents = 'auto'
  text.textContent = safeIcon

  svg.append(path, text)

  const el = document.createElement('div')
  el.style.cssText = 'cursor:pointer;user-select:none;pointer-events:auto;width:36px;height:44px;'
  el.append(svg)
  return el
}
