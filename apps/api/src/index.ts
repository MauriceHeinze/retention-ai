import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { HealthResponse } from '@retention-ai/shared'

const port = Number(process.env.PORT ?? 3001)
const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  }),
)

app.get('/api/health', (c) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  }
  return c.json(body)
})

app.get('/', (c) => c.json({ name: 'retention-ai-api' }))

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://127.0.0.1:${info.port}`)
})
