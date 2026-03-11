import { createClient } from '@blinkdotnew/sdk'

export function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  return match ? match[1] : 'softball-audio-cards-snq5edgf'
}

export const blink = createClient({
  projectId: getProjectId(),
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_aC3Kfy-f14X86yC00q71uPcO4X_M6qRm',
  auth: { mode: 'managed' },
})
