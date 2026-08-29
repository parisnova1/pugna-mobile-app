// Extracted from scan.tsx so QR-scanned URLs, pasted links, and (later)
// notification deep-links all resolve an event identifier the same way.
const EVENT_PATH = /\/(?:events|e)\/([^/?#]+)/

export function extractEventIdentifier(raw: string): string {
  const match = EVENT_PATH.exec(raw.trim())
  return match ? match[1] : raw.trim()
}
