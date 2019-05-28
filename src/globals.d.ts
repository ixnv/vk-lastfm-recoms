declare module 'js-levenshtein' {
    function levenshtein(a: string, b: string): number;
}

interface MouseEvent {
    originalEvent: MouseEvent
}