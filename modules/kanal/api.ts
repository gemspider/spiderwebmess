import { apiFetch, ApiError } from '@/lib/api'
import type { KanalHaltung, KanalSchacht, KanalReinigung, KanalWartung } from './types'

type Feature<T> = { type: 'Feature'; properties: T; geometry: unknown }

async function fetchOne<T>(path: string): Promise<T | null> {
  try {
    const feature = await apiFetch<Feature<T>>(path)
    return feature.properties
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export function fetchHaltung(id: number): Promise<KanalHaltung | null> {
  return fetchOne<KanalHaltung>(`/kanal/haltungen/${id}`)
}

export function fetchSchacht(id: number): Promise<KanalSchacht | null> {
  return fetchOne<KanalSchacht>(`/kanal/schaechte/${id}`)
}

export function fetchReinigung(id: number): Promise<KanalReinigung | null> {
  return fetchOne<KanalReinigung>(`/kanal/reinigungen/${id}`)
}

export function fetchWartung(id: number): Promise<KanalWartung | null> {
  return fetchOne<KanalWartung>(`/kanal/wartungen/${id}`)
}

export async function saveHaltung(row: Partial<KanalHaltung>): Promise<void> {
  if (!row.id) throw new Error('id required for update')
  await apiFetch(`/kanal/haltungen/${row.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  })
}

export async function saveSchacht(row: Partial<KanalSchacht>): Promise<void> {
  if (!row.id) throw new Error('id required for update')
  await apiFetch(`/kanal/schaechte/${row.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  })
}

export async function createSchacht(body: Omit<Partial<KanalSchacht>, 'id'>): Promise<number> {
  const res = await apiFetch<{ id: number }>('/kanal/schaechte', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.id
}

export async function deleteSchacht(id: number): Promise<void> {
  await apiFetch(`/kanal/schaechte/${id}`, { method: 'DELETE' })
}

export async function createHaltung(body: Omit<Partial<KanalHaltung>, 'id'>): Promise<number> {
  const res = await apiFetch<{ id: number }>('/kanal/haltungen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.id
}

export async function deleteHaltung(id: number): Promise<void> {
  await apiFetch(`/kanal/haltungen/${id}`, { method: 'DELETE' })
}

export async function saveWartung(row: Partial<KanalWartung>): Promise<void> {
  if (!row.id) throw new Error('id required for update')
  await apiFetch(`/kanal/wartungen/${row.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  })
}

export async function saveReinigung(row: Partial<KanalReinigung>): Promise<void> {
  if (!row.id) throw new Error('id required for update')
  await apiFetch(`/kanal/reinigungen/${row.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  })
}
