'use client'

import * as React from 'react'
import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import './style.css'

function parseFeatures(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as string[]
  } catch {
    // ignore
  }
  return []
}

type PricingCardProps = {
  name: string
  price: string
  period: string
  features: string[]
  buttonText: string
  buttonUrl: string
  highlighted?: boolean
}

function PricingCard({ name, price, period, features, buttonText, buttonUrl, highlighted }: PricingCardProps) {
  return (
    <div className={`randee-pricing-01__card${highlighted ? ' randee-pricing-01__card--highlight' : ''}`}>
      {highlighted ? <span className="randee-pricing-01__badge">Популярный</span> : null}
      <p className="randee-pricing-01__plan-name">{name}</p>
      <div className="randee-pricing-01__price-row">
        <span className="randee-pricing-01__currency">₽</span>
        <span className="randee-pricing-01__amount">{price}</span>
        <span className="randee-pricing-01__period">{period}</span>
      </div>
      <hr className="randee-pricing-01__divider" />
      <ul className="randee-pricing-01__features">
        {features.map((feat, i) => (
          <li key={i} className="randee-pricing-01__feature">{feat}</li>
        ))}
      </ul>
      <a href={buttonUrl} className="randee-pricing-01__cta">{buttonText}</a>
    </div>
  )
}

export function Pricing01Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? 'Тарифные планы'
  const subtitle = block.props.subtitle ?? 'Выберите подходящий план'
  const variant = (block.props.variant ?? 'A') as 'A' | 'B'

  const plan1 = {
    name: block.props.plan1Name ?? 'Free',
    price: block.props.plan1Price ?? '0',
    period: block.props.plan1Period ?? '/мес',
    features: parseFeatures(block.props.plan1Features ?? '[]'),
    buttonText: block.props.plan1ButtonText ?? 'Начать',
    buttonUrl: block.props.plan1ButtonUrl ?? '#'
  }

  const plan2 = {
    name: block.props.plan2Name ?? 'Pro',
    price: block.props.plan2Price ?? '990',
    period: block.props.plan2Period ?? '/мес',
    features: parseFeatures(block.props.plan2Features ?? '[]'),
    buttonText: block.props.plan2ButtonText ?? 'Выбрать Pro',
    buttonUrl: block.props.plan2ButtonUrl ?? '#'
  }

  const plan3 = {
    name: block.props.plan3Name ?? 'Team',
    price: block.props.plan3Price ?? '2990',
    period: block.props.plan3Period ?? '/мес',
    features: parseFeatures(block.props.plan3Features ?? '[]'),
    buttonText: block.props.plan3ButtonText ?? 'Контакты',
    buttonUrl: block.props.plan3ButtonUrl ?? '#'
  }

  return (
    <TemplateFrame block={block} className="randee-pricing-01" initScript={init} data-variant={variant}>
      <div className="randee-pricing-01__header">
        <h2 className="randee-pricing-01__title">{title}</h2>
        <p className="randee-pricing-01__subtitle">{subtitle}</p>
      </div>
      <div className="randee-pricing-01__grid">
        <PricingCard {...plan1} />
        <PricingCard {...plan2} highlighted />
        <PricingCard {...plan3} />
      </div>
    </TemplateFrame>
  )
}
