export function getStorefrontThemeVars(theme = {}) {
  return {
    '--store-primary': theme.primaryColor || 'var(--brand-500)',
    '--store-primary-soft': theme.primarySoftColor || 'var(--brand-50)',
  }
}
