import { beforeEach, afterEach, vi } from 'vitest'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
    // GET
    if (!options || options.method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      })
    }

    // POST
    if (options.method === 'POST') {
      const body = JSON.parse(options.body as string)
      return {
        ok: true,
        json: async () => ({
          ...body,
          id: Math.floor(Math.random() * 1000), // Dummy-ID
        }),
      }
    }

    // PUT / DELETE
    return {
      ok: true,
      json: async () => ({}),
    }
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
})
