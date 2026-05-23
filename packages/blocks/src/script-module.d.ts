declare module '*.js' {
  export function init(root: HTMLElement | null): void | Promise<void>
}

declare module '*/script.js' {
  export function init(root: HTMLElement | null): void | Promise<void>
}
