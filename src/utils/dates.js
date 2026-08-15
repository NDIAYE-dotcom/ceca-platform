export function formatDateFr(dateStr){
  if(!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if(Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Returns a human-readable French label for a formation's optional start/end dates,
// or null when neither is set (both fields are optional).
export function formatDateRange(startDate, endDate){
  const start = formatDateFr(startDate)
  const end = formatDateFr(endDate)
  if(start && end) return `Du ${start} au ${end}`
  if(start) return `À partir du ${start}`
  if(end) return `Jusqu'au ${end}`
  return null
}
