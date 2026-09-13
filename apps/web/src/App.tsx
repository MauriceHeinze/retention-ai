import { useEffect, useState } from 'react'
import type { HealthResponse } from '@retention-ai/shared'
import './App.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; data: HealthResponse }
  | { status: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/health', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return (await response.json()) as HealthResponse
      })
      .then((data) => setHealth({ status: 'ok', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'Unknown error'
        setHealth({ status: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <p className="eyebrow">retention-ai</p>
      <h1>Frontend + API</h1>
      <p className="lede">
        React (Vite) spricht über <code>/api</code> mit der Hono-API.
      </p>

      <section className="card" aria-live="polite">
        <h2>API health</h2>
        {health.status === 'loading' && <p>Prüfe Verbindung…</p>}
        {health.status === 'ok' && (
          <dl>
            <div>
              <dt>status</dt>
              <dd>{health.data.status}</dd>
            </div>
            <div>
              <dt>service</dt>
              <dd>{health.data.service}</dd>
            </div>
            <div>
              <dt>timestamp</dt>
              <dd>{health.data.timestamp}</dd>
            </div>
          </dl>
        )}
        {health.status === 'error' && (
          <p className="error">
            API nicht erreichbar ({health.message}). Starte beide Apps mit{' '}
            <code>pnpm dev</code>.
          </p>
        )}
      </section>
    </main>
  )
}

export default App
