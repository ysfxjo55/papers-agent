export type NodeKind = 'paper' | 'concept'

export type Category = 'foundations' | 'vision' | 'language' | 'rl' | 'architecture' | 'other'

export type RelationType = 'extends' | 'enables' | 'precedes' | 'applies' | 'uses' | 'inspired_by' | 'critiques'

export type MessageRole = 'user' | 'assistant'

export interface Annotation {
  text: string
  ts: number
}

export interface GraphNode {
  id: string
  kind: NodeKind
  parent_id?: string
  label: string
  year: number
  category: Category
  summary: string
  annotations: Annotation[]
  x: number
  y: number
  rotation: number
}

export interface GraphEdge {
  from: string
  to: string
  type: RelationType
}

export interface ChatMessage {
  role: MessageRole
  content: string
  addedNodes?: number
  addedAnnots?: number
}

export interface AppState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  messages: ChatMessage[]
  focusId: string | null
  newIds: string[]
  pending?: boolean
}

export interface CategoryStyle {
  fill: string
  stroke: string
  text: string
  label: string
}

export interface RelationLabel {
  en: string
  dash: string
}

export type CategoryStylesMap = Record<Category, CategoryStyle>

export type RelationLabelsMap = Record<RelationType, RelationLabel>

export type LaneFractions = Record<Category, number>
