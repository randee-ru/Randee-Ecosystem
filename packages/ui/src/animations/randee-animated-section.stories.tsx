import type { Meta, StoryObj } from '@storybook/react'
import { RandeeAnimatedSection } from './randee-animated-section'

const meta = {
  title: 'Animations/RandeeAnimatedSection',
  component: RandeeAnimatedSection,
  args: {
    title: 'Animated section title',
    description: 'This section is wrapped with RandeeReveal animation.',
    enabled: true
  }
} satisfies Meta<typeof RandeeAnimatedSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
