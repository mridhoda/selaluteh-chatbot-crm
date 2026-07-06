export function getStorefrontThemeVars(theme = {}) {
  return {
    '--store-primary': theme.primaryColor || '#14532d',
    '--store-primary-soft': theme.primarySoftColor || '#dcfce7',
  }
}
