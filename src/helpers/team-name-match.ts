import { normaliseText } from './normalise-text';

export const teamNamesMatch = (
    firstName: string,
    secondName: string,
): boolean => {
    const first = normaliseText(firstName);
    const second = normaliseText(secondName);

    return (
        first === second ||
        first.includes(second) ||
        second.includes(first)
    );
};