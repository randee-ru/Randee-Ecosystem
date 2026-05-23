import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from './modal'

describe('Modal', () => {
  it('renders modal content when open', () => {
    render(
      <Modal open>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Dialog title</ModalTitle>
            <ModalDescription>Dialog description</ModalDescription>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Dialog title')).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(
      <Modal open>
        <ModalContent>
          <ModalTitle>Dialog title</ModalTitle>
          <ModalDescription>Dialog description</ModalDescription>
        </ModalContent>
      </Modal>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
