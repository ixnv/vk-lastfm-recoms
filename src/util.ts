export const addCssToElement = (qs: string, rules: object) => {
  const el = document.querySelector(qs) as HTMLElement
  if (!el) {
    return
  }
  Object.entries(rules).forEach(([rule, value]) => {
    el.style[rule] = value
  })
}
