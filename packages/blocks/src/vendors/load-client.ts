import { type VendorId } from './registry'

const loaded = new Map<VendorId, Promise<void>>()

async function loadGsap(): Promise<void> {
  const gsapModule = await import('gsap')
  const gsap = gsapModule.gsap ?? gsapModule.default
  window.gsap = gsap

  const scrollTriggerModule = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(scrollTriggerModule.ScrollTrigger)
  window.ScrollTrigger = scrollTriggerModule.ScrollTrigger
}

async function loadSwiper(): Promise<void> {
  const swiperModule = await import('swiper')
  window.Swiper = swiperModule.Swiper
}

async function loadVendorOnce(id: VendorId): Promise<void> {
  switch (id) {
    case 'gsap':
      await loadGsap()
      break
    case 'swiper':
      await loadSwiper()
      break
    default: {
      const _exhaustive: never = id
      throw new Error(`Unknown vendor: ${_exhaustive}`)
    }
  }
}

export function isVendorLoaded(id: VendorId): boolean {
  return loaded.has(id) && loaded.get(id) !== undefined
}

export function loadVendor(id: VendorId): Promise<void> {
  const existing = loaded.get(id)
  if (existing) return existing

  const promise = loadVendorOnce(id).catch((error) => {
    loaded.delete(id)
    throw error
  })
  loaded.set(id, promise)
  return promise
}

export function loadVendors(ids: VendorId[]): Promise<void> {
  return Promise.all(ids.map((id) => loadVendor(id))).then(() => undefined)
}

export function resetLoadedVendorsForTests(): void {
  loaded.clear()
}
