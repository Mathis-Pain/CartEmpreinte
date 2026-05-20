import Dexie, { type EntityTable } from 'dexie'

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  createdAt: number
}

export interface Itinerary {
  id: string
  name: string
  categoryId: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface MapPoint {
  id: string
  itineraryId?: string
  lat: number
  lng: number
  categoryId: string
  description?: string
  address?: string
  photoIds: string[]
  createdAt: number
}

export interface Photo {
  id: string
  pointId: string
  filename: string
  caption?: string
  takenAt?: number
}

export interface Setting {
  key: string
  value: unknown
}

class CartEmpreinteDB extends Dexie {
  itineraries!: EntityTable<Itinerary, 'id'>
  points!: EntityTable<MapPoint, 'id'>
  photos!: EntityTable<Photo, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('CartEmpreinteDB')
    this.version(1).stores({
      itineraries: 'id, categoryId, updatedAt',
      points: 'id, itineraryId, categoryId',
      photos: 'id, pointId',
      categories: 'id',
      settings: 'key',
    })
    this.version(2).stores({
      categories: 'id, createdAt',
    })
  }
}

export const db = new CartEmpreinteDB()
