import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from './modal'

const meta = {
  title: 'UI/Modal',
  component: Modal
} satisfies Meta<typeof Modal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Modal>
      <ModalTrigger asChild>
        <Button>Открыть модалку</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Создание проекта</ModalTitle>
          <ModalDescription>Заполните поля и нажмите «Создать».</ModalDescription>
        </ModalHeader>
      </ModalContent>
    </Modal>
  )
}
