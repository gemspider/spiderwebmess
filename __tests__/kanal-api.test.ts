import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock lib/api so tests don't hit real fetch
const mockApiFetch = vi.fn()
vi.mock('@/lib/api', () => ({
  apiFetch: mockApiFetch,
  ApiError: class ApiError extends Error {
    constructor(readonly status: number, message: string) { super(message) }
  },
}))

const {
  fetchSchacht, fetchHaltung, fetchReinigung, fetchWartung,
  saveSchacht, saveHaltung, saveWartung, saveReinigung,
  createSchacht, deleteSchacht, createHaltung, deleteHaltung,
} = await import('../modules/kanal/api')

// Re-import ApiError after mock
const { ApiError } = await import('@/lib/api')

beforeEach(() => {
  mockApiFetch.mockReset()
})

function feature<T>(props: T) {
  return { type: 'Feature', properties: props, geometry: null }
}

describe('fetchSchacht', () => {
  it('calls /kanal/schaechte/{id} and returns properties', async () => {
    mockApiFetch.mockResolvedValue(feature({ id: 42, bezeichnung: 'S1' }))
    const result = await fetchSchacht(42)
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/schaechte/42')
    expect(result).toEqual({ id: 42, bezeichnung: 'S1' })
  })

  it('returns null on 404', async () => {
    mockApiFetch.mockRejectedValue(new ApiError(404, 'Not found'))
    expect(await fetchSchacht(99)).toBeNull()
  })

  it('re-throws non-404 errors', async () => {
    mockApiFetch.mockRejectedValue(new ApiError(500, 'Server error'))
    await expect(fetchSchacht(1)).rejects.toBeInstanceOf(ApiError)
  })
})

describe('fetchHaltung', () => {
  it('calls /kanal/haltungen/{id}', async () => {
    mockApiFetch.mockResolvedValue(feature({ id: 7 }))
    await fetchHaltung(7)
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/haltungen/7')
  })
})

describe('fetchReinigung', () => {
  it('calls /kanal/reinigungen/{id}', async () => {
    mockApiFetch.mockResolvedValue(feature({ id: 3 }))
    await fetchReinigung(3)
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/reinigungen/3')
  })
})

describe('fetchWartung', () => {
  it('calls /kanal/wartungen/{id}', async () => {
    mockApiFetch.mockResolvedValue(feature({ id: 5 }))
    await fetchWartung(5)
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/wartungen/5')
  })
})

describe('saveSchacht', () => {
  it('calls PUT /kanal/schaechte/{id} with JSON body', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await saveSchacht({ id: 42, tiefe: 2.5 })
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/schaechte/42', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 42, tiefe: 2.5 }),
    })
  })

  it('throws when id is missing', async () => {
    await expect(saveSchacht({ bezeichnung: 'no-id' })).rejects.toThrow('id required for update')
  })
})

describe('saveHaltung', () => {
  it('calls PUT /kanal/haltungen/{id}', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await saveHaltung({ id: 10, bezeichnung: 'H1' })
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/haltungen/10', expect.objectContaining({ method: 'PUT' }))
  })

  it('throws when id is missing', async () => {
    await expect(saveHaltung({})).rejects.toThrow('id required for update')
  })
})

describe('createSchacht', () => {
  it('calls POST /kanal/schaechte and returns new id', async () => {
    mockApiFetch.mockResolvedValue({ id: 99, created: true })
    const id = await createSchacht({ bezeichnung: 'Neu' })
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/schaechte', expect.objectContaining({ method: 'POST' }))
    expect(id).toBe(99)
  })
})

describe('deleteSchacht', () => {
  it('calls DELETE /kanal/schaechte/{id}', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await deleteSchacht(42)
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/schaechte/42', { method: 'DELETE' })
  })
})

describe('createHaltung', () => {
  it('calls POST /kanal/haltungen and returns new id', async () => {
    mockApiFetch.mockResolvedValue({ id: 7, created: true })
    const id = await createHaltung({ bezeichnung: 'H-Neu' })
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/haltungen', expect.objectContaining({ method: 'POST' }))
    expect(id).toBe(7)
  })
})

describe('deleteHaltung', () => {
  it('calls DELETE /kanal/haltungen/{id}', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await deleteHaltung(10)
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/haltungen/10', { method: 'DELETE' })
  })
})

describe('saveWartung', () => {
  it('calls PUT /kanal/wartungen/{id} with JSON body', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await saveWartung({ id: 5, status: 1, beschreibung: 'done' })
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/wartungen/5', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 5, status: 1, beschreibung: 'done' }),
    })
  })

  it('throws when id is missing', async () => {
    await expect(saveWartung({ status: 0 })).rejects.toThrow('id required for update')
  })
})

describe('saveReinigung', () => {
  it('calls PUT /kanal/reinigungen/{id} with JSON body', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await saveReinigung({ id: 3, letzte_reinigung: '2026-06-01' })
    expect(mockApiFetch).toHaveBeenCalledWith('/kanal/reinigungen/3', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 3, letzte_reinigung: '2026-06-01' }),
    })
  })

  it('throws when id is missing', async () => {
    await expect(saveReinigung({ letzte_reinigung: '2026-01-01' })).rejects.toThrow('id required for update')
  })
})
