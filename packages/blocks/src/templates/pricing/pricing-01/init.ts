export function init(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')
}
