const DEFAULT_USD_TO_FCFA = Number(import.meta.env.VITE_USD_TO_FCFA) || 600

export function usdToFcfa(usd){
  if(typeof usd !== 'number') return null
  return Math.round(usd * DEFAULT_USD_TO_FCFA)
}

export function formatFcfa(amount){
  if(amount == null) return ''
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export default { usdToFcfa, formatFcfa }
