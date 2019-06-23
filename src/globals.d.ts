declare module 'js-levenshtein' {
    function levenshtein(a: string, b: string): number;

    export = levenshtein
}

interface MouseEvent {
    originalEvent: MouseEvent
}