let elementIdCounter = 1

function uniqueSuffix(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}${random}`
}

export function createElementId(elementType: string): string {
  const slug = elementType.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'el'
  const id = `el_${slug}_${String(elementIdCounter).padStart(4, '0')}_${uniqueSuffix()}`
  elementIdCounter += 1
  return id
}

export function resetElementIdCounter(nextValue = 1): void {
  elementIdCounter = nextValue
}
