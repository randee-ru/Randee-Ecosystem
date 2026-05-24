let elementIdCounter = 1

export function createElementId(elementType: string): string {
  const slug = elementType.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'el'
  const id = `el_${slug}_${String(elementIdCounter).padStart(4, '0')}`
  elementIdCounter += 1
  return id
}

export function resetElementIdCounter(nextValue = 1): void {
  elementIdCounter = nextValue
}
