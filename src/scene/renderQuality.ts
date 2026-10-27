// Bound framebuffer cost independently of the browser's display scale. HTML
// labels retain native resolution while only the WebGL canvas is scaled.
export function initialRenderDpr(width: number, height: number, displayDpr: number, compact: boolean) {
  const pixels = Math.max(1, width * height)
  const budget = compact ? 1_000_000 : 2_400_000
  // Keep at least one render pixel per CSS pixel. Resolution stays fixed during
  // movement; scaling below this made thin edges crawl as the camera followed.
  return Math.max(1, Math.min(displayDpr, compact ? 1.15 : 1.25, Math.sqrt(budget / pixels)))
}
