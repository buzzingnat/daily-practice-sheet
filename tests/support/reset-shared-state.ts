import { afterEach, vi } from 'vitest';
import { setLanguage } from '../../src/text/messages';

// Test files share their modules (see vitest.config.mts), so a test that leaves something changed
// hands the change to the next file. The tests change two things: the message catalog and spies on
// Math.random. Both go back after every test, whether or not the test remembered.
afterEach(() => {
    setLanguage('en');
    vi.restoreAllMocks();
});
