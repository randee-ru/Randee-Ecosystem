'use client'

import * as React from 'react'

type TemplateRevisionContextValue = {
  revisions: Record<string, number>
}

const TemplateRevisionContext = React.createContext<TemplateRevisionContextValue>({ revisions: {} })

export function TemplateRevisionProvider({
  revisions,
  children
}: {
  revisions: Record<string, number>
  children: React.ReactNode
}) {
  return <TemplateRevisionContext.Provider value={{ revisions }}>{children}</TemplateRevisionContext.Provider>
}

export function useTemplateRevision(templateId: string): number {
  return React.useContext(TemplateRevisionContext).revisions[templateId] ?? 0
}

export function invalidateTemplateStyles(templateId: string): void {
  document.querySelector(`link[data-randee-template-styles="${templateId}"]`)?.remove()
}
