import { MessageCatalog } from './message-catalog';
import { english } from './english';

// One entry per language. Adding a language means writing a catalog and listing it here.
const CATALOGS = {
    en: english
} as const;

export type LanguageCode = keyof typeof CATALOGS;

let currentCatalog: MessageCatalog = english;

/**
 * The words for the language in use. Read when drawing, not when building, so a change of language needs no rebuild.
 */
export function getMessages(): MessageCatalog {
    return currentCatalog;
}

export function setLanguage(code: LanguageCode): void {
    currentCatalog = CATALOGS[code];
}

/**
 * Swaps in a catalog that is not in the list. Checks use it to prove no English is left hard-coded.
 */
export function setMessages(catalog: MessageCatalog): void {
    currentCatalog = catalog;
}
