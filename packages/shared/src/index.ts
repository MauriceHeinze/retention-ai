export type HealthStatus = 'ok' | 'error'

export type HealthResponse = {
  status: HealthStatus
  service: string
  timestamp: string
}
