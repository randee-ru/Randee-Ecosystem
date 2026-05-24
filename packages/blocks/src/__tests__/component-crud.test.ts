import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  createComponentTemplate,
  deleteComponentTemplate,
  getUserComponentDirectory,
  renameComponentTemplate
} from '../create-component'
import { readComponentMeta } from '../component-io'

describe('component CRUD', () => {
  it('creates, renames, and deletes a user component template', () => {
    const created = createComponentTemplate('CRUD Test Component')
    const { templateId } = created

    try {
      expect(templateId).toMatch(/^component-\d+$/)
      expect(existsSync(getUserComponentDirectory(templateId)!)).toBe(true)

      const meta = readComponentMeta(templateId)
      expect(meta?.name).toBe('CRUD Test Component')

      const renamed = renameComponentTemplate(templateId, { name: 'Renamed Component' })
      expect(renamed?.manifest.name).toBe('Renamed Component')
      expect(renamed?.manifest.defaultProps.title).toBe('Renamed Component')

      const afterRename = readComponentMeta(templateId)
      expect(afterRename?.name).toBe('Renamed Component')

      const deleted = deleteComponentTemplate(templateId)
      expect(deleted).toBe(true)
      expect(readComponentMeta(templateId)).toBeNull()
      expect(existsSync(getUserComponentDirectory(templateId)!)).toBe(false)
    } finally {
      if (readComponentMeta(templateId)) {
        deleteComponentTemplate(templateId)
      }
    }
  })

  it('returns null when renaming unknown template', () => {
    expect(renameComponentTemplate('component-99999', { name: 'Missing' })).toBeNull()
  })

  it('returns false when deleting unknown template', () => {
    expect(deleteComponentTemplate('component-99999')).toBe(false)
  })
})
