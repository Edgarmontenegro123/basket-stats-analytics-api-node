// src/helpers/normalise-player-name.ts

import {normaliseText} from './normalise-text'

export const normalisePlayerName = (value: string): string => {
    if (!value) return ''

    // 1. Aplicamos tu helper base para limpiar tildes, caracteres raros y espacios múltiples
    const cleanedBase = normaliseText(value)

    if (!cleanedBase) return ''

    // 2. Separamos por espacios y aplicamos formato de título (Capitalize) a cada palabra
    return cleanedBase
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}