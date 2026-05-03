// Safety score calculator
// Incidents ke basis par route ka score calculate karta hai

const INCIDENT_WEIGHTS = {
  VIOLENCE:       20,
  ROBBERY:        20,
  HARASSMENT:     15,
  STREET_FIGHT:   12,
  PROTEST:        10,
  ACCIDENT:       8,
  SUSPICIOUS:     8,
  ROAD_BLOCKED:   6,
  UNSAFE_LIGHTING: 5,
  OTHER:          5,
}

export function calculateSafetyScore(incidents) {
  let deductions = 0
  const now      = new Date()
  const hour     = now.getHours()
  const isNight  = hour >= 21 || hour <= 5

  for (const incident of incidents) {
    // Base weight
    let weight = INCIDENT_WEIGHTS[incident.type] || 5

    // Night time — double penalty
    if (isNight) weight *= 2

    // Recency decay — purani incidents ka kam asar
    const ageInDays = (now - new Date(incident.createdAt)) / (1000 * 60 * 60 * 24)

    if (ageInDays > 30)     weight *= 0.1
    else if (ageInDays > 7) weight *= 0.5
    else if (ageInDays > 1) weight *= 0.8
    // 24 ghante se kam purani = full weight

    // Verified incidents ka zyada asar
    if (incident.status === 'VERIFIED') weight *= 1.5

    deductions += weight
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - deductions)))
  return score
}

export function getRiskLevel(score) {
  if (score >= 70) return 'SAFE'
  if (score >= 40) return 'CAUTION'
  return 'DANGER'
}

export function getRiskColor(score) {
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}