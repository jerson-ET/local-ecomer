
/**
 * Realiza una búsqueda difusa (fuzzy search) sobre una lista de objetos.
 * Retorna los elementos ordenados por relevancia.
 * 
 * @param items Lista de objetos a buscar
 * @param query Texto de búsqueda
 * @param keys Claves del objeto donde buscar (ej: ['name', 'description'])
 */
export function fuzzySearch<T>(
    items: T[],
    query: string,
    keys: (keyof T)[]
): T[] {
    if (!query) return items

    const normalizedQuery = normalizeText(query)
    const queryWords = normalizedQuery.split(/\s+/)

    const scoredItems = items.map(item => {
        let score = 0

        keys.forEach(key => {
            const value = String(item[key] || '')
            const normalizedValue = normalizeText(value)

            // 1. Coincidencia exacta de frase (prioridad máxima)
            if (normalizedValue.includes(normalizedQuery)) {
                score += 100
            }

            // 2. Coincidencia de palabras individuales
            queryWords.forEach(word => {
                if (normalizedValue.includes(word)) {
                    score += 10
                } else {
                    // 3. Aproximación (fuzzy) simple
                    // Si el 70% de los caracteres de la palabra de búsqueda están en el texto en orden relativo
                    if (fuzzyMatch(word, normalizedValue)) {
                        score += 3
                    }
                }
            })
        })

        return { item, score }
    })

    // Retornamos solo los que tienen alguna coincidencia, ordenados por score
    return scoredItems
        .filter(si => si.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(si => si.item)
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
}

/**
 * Algoritmo simple de coincidencia aproximada.
 * Retorna true si 'pattern' se puede encontrar en 'text' permitiendo
 * algunos errores o caracteres faltantes, pero manteniendo el orden.
 */
function fuzzyMatch(pattern: string, text: string): boolean {
    if (pattern.length < 3) return text.includes(pattern) // Para palabras muy cortas, exigir exactitud

    let patternIdx = 0
    let textIdx = 0

    while (patternIdx < pattern.length && textIdx < text.length) {
        if (pattern[patternIdx] === text[textIdx]) {
            patternIdx++
        }
        textIdx++
    }

    // Si encontramos todos los caracteres del patrón en orden
    // O si encontramos al menos el 80% (útil para typos al final)
    return patternIdx === pattern.length || (patternIdx / pattern.length > 0.8)
}
