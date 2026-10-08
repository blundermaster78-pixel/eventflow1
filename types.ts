export type Page = 'dashboard' | 'calendar' | 'resources' | 'reservations' | 'conflicts' | 'analytics'

export type ResourceId = 'stage' | 'generator' | 'sound' | 'led' | 'projector' | 'chairs'
export type Category = 'Staging' | 'Power' | 'Audio' | 'Visual' | 'Furniture'

export interface Resource {
  id: ResourceId
  name: string
  short: string
  category: Category
  description: string
  spec: string
}

export type ReservationStatus = 'confirmed' | 'pending'

export interface Reservation {
  id: string
  event: string
  organizer: string
  date: string // YYYY-MM-DD
  start: string // HH:mm
  end: string // HH:mm
  resourceIds: ResourceId[]
  status: ReservationStatus
}

export interface Conflict {
  id: string
  resourceId: ResourceId
  date: string
  start: string // overlap window start
  end: string // overlap window end
  existingId: string
  incomingId?: string
  incomingName: string
  incomingStart: string
  incomingEnd: string
  incomingResourceIds: ResourceId[]
  kind: 'overlap' | 'blocked'
  status: 'open' | 'resolved'
  loggedAt: number
}

export interface AvailabilityRequest {
  date: string
  start: string
  end: string
  resourceIds: ResourceId[]
}

export interface ResourceHit {
  resourceId: ResourceId
  reservation: Reservation
}

export interface AltSlot {
  date: string
  start: string
  end: string
  note: string
}

export interface Prefill {
  name?: string
  organizer?: string
  date?: string
  start?: string
  end?: string
  resourceIds?: ResourceId[]
  replaceId?: string
  autoCheck?: boolean
}

export interface EventTemplate {
  id: string
  label: string
  name: string
  hours: number
  resources: ResourceId[]
}
