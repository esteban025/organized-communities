export const getInitialsName = (name: string) => {
  // Juan Sn y Maria Sn  -> JM
  // Paul Esteban -> PE
  // Paul -> PA
  const normalized = name.trim()
  if (!normalized) return ""

  // Caso matrimonio: "Juan Sn y Maria Sn" -> tomar inicial del primer nombre de cada lado
  const coupleSeparator = " y "
  if (normalized.toLowerCase().includes(coupleSeparator)) {
    const parts = normalized.split(coupleSeparator).map((part) => part.trim()).filter(Boolean)
    const initials = parts
      .map((part) => {
        const [firstWord] = part.split(/\s+/).filter(Boolean)
        return firstWord ? firstWord[0].toUpperCase() : ""
      })
      .join("")
    return initials
  }

  // Caso persona individual
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    // Tomar inicial de los dos primeros nombres: "Paul Esteban" -> PE
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  // Un solo nombre: tomar las dos primeras letras: "Paul" -> PA
  const word = words[0]
  if (!word) return ""
  if (word.length === 1) return word[0].toUpperCase()
  return (word[0] + word[1]).toUpperCase()
}