import type { GraphNode, Category, CategoryStylesMap, RelationLabelsMap, LaneFractions } from './types'

export const CANVAS_W = 1600
export const CANVAS_H = 720
export const NODE_W = 140
export const NODE_H = 58
export const YEAR_MIN = 1940
export const YEAR_MAX = 2026

export const STORAGE_KEY = 'ai-mind-state-v7'
export const CHANNEL_NAME = 'ai-mind-channel'

export const CATEGORY_STYLES_LIGHT: CategoryStylesMap = {
  foundations:  { fill: '#e8dcc4', stroke: '#7a5c2e', text: '#3a2a14', label: 'Foundations' },
  vision:       { fill: '#d5e0ce', stroke: '#4a6b48', text: '#243a23', label: 'Vision' },
  language:     { fill: '#e8cdbf', stroke: '#9c4a2e', text: '#4a1f10', label: 'Language' },
  rl:           { fill: '#cdd5e0', stroke: '#4a5a78', text: '#1f2a40', label: 'Reinforcement' },
  architecture: { fill: '#e8d8b8', stroke: '#8c6a2e', text: '#3a2a14', label: 'Architecture' },
  other:        { fill: '#dcd4c4', stroke: '#5a5040', text: '#2a2418', label: 'Other' },
}

export const CATEGORY_STYLES_DARK: CategoryStylesMap = {
  foundations:  { fill: '#3a3220', stroke: '#c9a865', text: '#f0e3c2', label: 'Foundations' },
  vision:       { fill: '#2a3528', stroke: '#8eb086', text: '#d8e8d2', label: 'Vision' },
  language:     { fill: '#3a2820', stroke: '#d59072', text: '#f3d8c6', label: 'Language' },
  rl:           { fill: '#252e3c', stroke: '#8aa0c4', text: '#d4ddec', label: 'Reinforcement' },
  architecture: { fill: '#3a3022', stroke: '#d4a868', text: '#f0deb4', label: 'Architecture' },
  other:        { fill: '#2c2820', stroke: '#9a8a6a', text: '#d8cdb0', label: 'Other' },
}

export function getCategoryStyles(theme: 'light' | 'dark'): CategoryStylesMap {
  return theme === 'dark' ? CATEGORY_STYLES_DARK : CATEGORY_STYLES_LIGHT
}

export const LANE_FRACS: LaneFractions = {
  vision: 0.20,
  rl: 0.36,
  foundations: 0.52,
  architecture: 0.64,
  language: 0.80,
  other: 0.90,
}

export const REL_LABELS: RelationLabelsMap = {
  extends:     { en: 'extends',      dash: '' },
  enables:     { en: 'enables',      dash: '' },
  precedes:    { en: 'precedes',     dash: '' },
  applies:     { en: 'applies to',   dash: '4 3' },
  uses:        { en: 'uses',         dash: '4 3' },
  inspired_by: { en: 'inspired by',  dash: '2 4' },
  critiques:   { en: 'critiques',    dash: '6 3' },
}

export function jitter(seed: number, range: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 43758.5453
  return ((x - Math.floor(x)) * 2 - 1) * range
}

export function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function xFromYear(year: number): number {
  const left = 110
  const right = CANVAS_W - 110
  const t = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)
  return left + Math.max(0, Math.min(1, t)) * (right - left)
}

export function yFromCategory(category: Category, seed: number): number {
  const frac = LANE_FRACS[category] ?? 0.5
  return frac * CANVAS_H + jitter(seed, 22)
}

export function rotationFor(seed: number): number {
  return jitter(seed + 7, 1.4)
}

export function rectsOverlap(
  ax: number, ay: number,
  bx: number, by: number,
  padX: number, padY: number,
): boolean {
  return Math.abs(ax - bx) < (NODE_W + padX) && Math.abs(ay - by) < (NODE_H + padY)
}

export function positionNode(node: GraphNode, existingNodes: GraphNode[]): GraphNode {
  if (node.kind === 'concept') {
    return { ...node, x: 0, y: 0, rotation: rotationFor(hashId(node.id) + 3) }
  }

  const baseX = xFromYear(node.year)
  const baseY = yFromCategory(node.category, hashId(node.id))

  const candidates: [number, number][] = [
    [0, 0],
    [0, -80], [0, 80],
    [-28, -80], [28, -80], [-28, 80], [28, 80],
    [0, -160], [0, 160],
    [-40, -160], [40, -160], [-40, 160], [40, 160],
    [0, -240], [0, 240],
    [-60, -240], [60, -240], [-60, 240], [60, 240],
  ]

  let chosenX = baseX
  let chosenY = baseY

  for (const [dx, dy] of candidates) {
    const tx = baseX + dx
    const ty = baseY + dy
    let collide = false
    for (const other of existingNodes) {
      if (other.id === node.id) continue
      if (other.kind === 'concept') continue
      if (rectsOverlap(tx, ty, other.x, other.y, 24, 22)) { collide = true; break }
    }
    if (!collide) { chosenX = tx; chosenY = ty; break }
  }

  chosenY = Math.max(110, Math.min(CANVAS_H - 110, chosenY))
  const rotation = rotationFor(hashId(node.id) + 3)

  return { ...node, x: chosenX, y: chosenY, rotation }
}
