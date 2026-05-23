import type { Meta, StoryObj } from '@storybook/react'
import { RandeeScrollSection, type RandeeScrollSectionProps } from './randee-scroll-section'

function ScrollSectionDemo(props: Omit<RandeeScrollSectionProps, 'children'>) {
  return (
    <div>
      <div className="h-[60vh]" />
      <RandeeScrollSection {...props} className="bg-neutral-900 p-12 text-white">
        <h3 className="text-3xl font-semibold">Pinned scroll section</h3>
      </RandeeScrollSection>
      <div className="h-[80vh]" />
    </div>
  )
}

const meta = {
  title: 'Animations/RandeeScrollSection',
  component: ScrollSectionDemo,
  args: {
    enabled: true,
    pin: true,
    scrub: true
  }
} satisfies Meta<typeof ScrollSectionDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
