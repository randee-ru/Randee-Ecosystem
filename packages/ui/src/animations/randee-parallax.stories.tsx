import type { Meta, StoryObj } from '@storybook/react'
import { RandeeParallax, type RandeeParallaxProps } from './randee-parallax'

function ParallaxDemo(props: Omit<RandeeParallaxProps, 'children'>) {
  return (
    <div className="space-y-10 py-20">
      <div className="h-40" />
      <RandeeParallax {...props}>
        <div className="rounded-xl bg-neutral-900 p-16 text-center text-3xl font-semibold text-white">
          Parallax block
        </div>
      </RandeeParallax>
      <div className="h-72" />
    </div>
  )
}

const meta = {
  title: 'Animations/RandeeParallax',
  component: ParallaxDemo,
  args: {
    enabled: true,
    speed: 0.25
  }
} satisfies Meta<typeof ParallaxDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
