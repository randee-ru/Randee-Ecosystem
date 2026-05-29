'use client'

import * as React from 'react'
import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import './style.css'

type FooterLink = { label: string; url: string }

function parseLinks(raw: string): FooterLink[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as FooterLink[]
  } catch {
    // ignore
  }
  return []
}

function FooterColumn({ title, linksRaw }: { title: string; linksRaw: string }) {
  const links = parseLinks(linksRaw)
  return (
    <div>
      <p className="randee-footer-01__col-title">{title}</p>
      <ul className="randee-footer-01__col-links">
        {links.map((link, i) => (
          <li key={i}>
            <a href={link.url} className="randee-footer-01__col-link">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer01Preview({ block }: BlockTemplatePreviewProps) {
  const logo = block.props.logo ?? 'Компания'
  const col1Title = block.props.col1Title ?? 'Продукт'
  const col1Links = block.props.col1Links ?? '[]'
  const col2Title = block.props.col2Title ?? 'Компания'
  const col2Links = block.props.col2Links ?? '[]'
  const col3Title = block.props.col3Title ?? 'Поддержка'
  const col3Links = block.props.col3Links ?? '[]'
  const copyright = block.props.copyright ?? `© ${new Date().getFullYear()} Компания. Все права защищены.`
  const variant = (block.props.variant ?? 'A') as 'A' | 'B'

  return (
    <TemplateFrame block={block} className="randee-footer-01" initScript={init} data-variant={variant}>
      <div className="randee-footer-01__top">
        {/* Бренд */}
        <div>
          <a href="#" className="randee-footer-01__brand-logo">{logo}</a>
        </div>

        {/* Колонки */}
        <FooterColumn title={col1Title} linksRaw={col1Links} />
        <FooterColumn title={col2Title} linksRaw={col2Links} />
        <FooterColumn title={col3Title} linksRaw={col3Links} />
      </div>

      {/* Копирайт */}
      <div className="randee-footer-01__bottom">
        <span>{copyright}</span>
      </div>
    </TemplateFrame>
  )
}
