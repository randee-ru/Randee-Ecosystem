export type VendorId = 'gsap' | 'swiper'

export type VendorFileRef = {
  /** Path relative to package root in node_modules, e.g. gsap/dist/gsap.min.js */
  resolve: string
}

export type VendorDefinition = {
  id: VendorId
  label: string
  description: string
  website: string
  styles?: VendorFileRef[]
  scripts: VendorFileRef[]
}

const vendorRegistry: Record<VendorId, VendorDefinition> = {
  gsap: {
    id: 'gsap',
    label: 'GSAP',
    description: 'Анимации и ScrollTrigger',
    website: 'https://gsap.com',
    scripts: [
      { resolve: 'gsap/dist/gsap.min.js' },
      { resolve: 'gsap/dist/ScrollTrigger.min.js' }
    ]
  },
  swiper: {
    id: 'swiper',
    label: 'Swiper',
    description: 'Слайдеры и карусели',
    website: 'https://swiperjs.com',
    styles: [{ resolve: 'swiper/swiper-bundle.min.css' }],
    scripts: [{ resolve: 'swiper/swiper-bundle.min.js' }]
  }
}

export const VENDOR_LOAD_ORDER: VendorId[] = ['gsap', 'swiper']

export function getVendor(id: VendorId): VendorDefinition {
  return vendorRegistry[id]
}

export function listVendors(): VendorDefinition[] {
  return VENDOR_LOAD_ORDER.map((id) => vendorRegistry[id])
}

export function isVendorId(value: string): value is VendorId {
  return value in vendorRegistry
}

export function getVendorAssetBasename(file: VendorFileRef): string {
  const parts = file.resolve.split('/')
  return parts[parts.length - 1] ?? file.resolve
}

export function findVendorFile(vendorId: VendorId, basename: string): VendorFileRef | null {
  const vendor = getVendor(vendorId)
  const files = [...(vendor.styles ?? []), ...vendor.scripts]
  return files.find((file) => getVendorAssetBasename(file) === basename) ?? null
}

declare global {
  interface Window {
    gsap?: typeof import('gsap').gsap
    ScrollTrigger?: typeof import('gsap/ScrollTrigger').ScrollTrigger
    Swiper?: typeof import('swiper').Swiper
    SwiperModules?: {
      Navigation: typeof import('swiper/modules').Navigation
    }
  }
}
