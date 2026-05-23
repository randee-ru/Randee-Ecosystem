import type { Meta, StoryObj } from '@storybook/react'
import { RandeeReveal, type RandeeRevealProps } from './randee-reveal'

function RevealDemo(props: Omit<RandeeRevealProps, 'children'>) {
  return (
    <div className="min-h-[120vh] pt-32">
      <RandeeReveal {...props}>
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-xl font-semibold shadow-sm">
          Reveal on scroll
        </div>
      </RandeeReveal>
    </div>
  )
}

const meta = {
  title: 'Animations/RandeeReveal',
  component: RevealDemo,
  args: {
    enabled: true,
    duration: 0.8,
    y: 24,
    once: true,
    delay: 0
  }
} satisfies Meta<typeof RevealDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
