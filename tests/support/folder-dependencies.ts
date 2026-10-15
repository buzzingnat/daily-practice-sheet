// The folder dependency rule from AGENTS.md section 7, as code. Pure: it takes file
// paths and source text and returns complaints, so tests can feed it made-up projects.

export type Area = 'app' | 'leaf' | 'worksheet' | 'exercises' | 'generator' | 'settings' | 'ui';

// Paths throughout are posix-style and start with "src/", for example "src/generator/shuffled-deck.ts"
export type SourceFiles = Readonly<Record<string, string>>;

const APP_FILES: readonly string[] = ['src/main.ts', 'src/make-example-sheet.ts', 'src/utils.ts'];
const LEAF_FILES: readonly string[] = ['src/types.ts', 'src/constants.ts', 'src/asset-manager.ts'];
const FOLDER_AREAS: Readonly<Record<string, Area>> = {
    worksheet: 'worksheet',
    exercises: 'exercises',
    generator: 'generator',
    settings: 'settings',
    ui: 'ui'
};

// What each area may import, itself included. The app-level files may import anything.
const ALLOWED_TARGETS: Readonly<Record<Area, readonly Area[]>> = {
    app: ['app', 'leaf', 'worksheet', 'exercises', 'generator', 'settings', 'ui'],
    leaf: ['leaf'],
    worksheet: ['worksheet', 'leaf'],
    exercises: ['exercises', 'worksheet', 'leaf'],
    generator: ['generator', 'exercises', 'worksheet', 'leaf'],
    settings: ['settings', 'leaf'],
    ui: ['ui', 'settings', 'leaf']
};

const ENTRY_POINT = 'src/main.ts';
const APP_ONLY_FILE = 'src/utils.ts';

/**
 * The area a file belongs to, or undefined when it sits somewhere the rule does not
 * know about. A new top-level folder lands here until someone adds it to the rule.
 */
export function classifyFile(path: string): Area | undefined {
    if (APP_FILES.includes(path)) {
        return 'app';
    } else if (LEAF_FILES.includes(path)) {
        return 'leaf';
    }
    const segments = path.split('/');
    const folder = segments[1];
    if (segments[0] !== 'src' || segments.length < 3 || folder === undefined) {
        return undefined;
    }
    return FOLDER_AREAS[folder];
}

// Under exercises/, each topic (kana, geography) has its own folder and the topics stay independent
function exerciseTopic(path: string): string {
    const segments = path.split('/');
    return segments[1] === 'exercises' && segments.length > 3 ? (segments[2] ?? '') : '';
}

// Relative specifiers in "from '...'", "import '...'" and "import('...')"
export function findRelativeImports(source: string): string[] {
    const specifiers: string[] = [];
    const pattern = /(?:\bfrom\s+|\bimport\s+|\bimport\s*\(\s*)(['"])(\.{1,2}(?:\/[^'"]*)?)\1/g;
    let match = pattern.exec(source);
    while (match !== null) {
        const specifier = match[2];
        if (specifier !== undefined) {
            specifiers.push(specifier);
        }
        match = pattern.exec(source);
    }
    return specifiers;
}

// Joins a relative specifier onto the importing file's folder. Returns undefined if it climbs out of the project root.
export function resolveImport(fromPath: string, specifier: string): string | undefined {
    const resolved = fromPath.split('/').slice(0, -1);
    for (const segment of specifier.split('/')) {
        if (segment === '..') {
            if (resolved.length === 0) {
                return undefined;
            }
            resolved.pop();
        } else if (segment !== '.' && segment !== '') {
            resolved.push(segment);
        }
    }
    return `${resolved.join('/')}.ts`;
}

/**
 * Every way the given files break the folder dependency rule, one sentence each.
 * An empty list means the rule holds.
 */
export function findViolations(files: SourceFiles): string[] {
    const violations: string[] = [];

    Object.keys(files).sort().forEach((importer) => {
        const importerArea = classifyFile(importer);
        if (importerArea === undefined) {
            violations.push(`${importer} is in a folder the rule does not know; add its area to tests/support/folder-dependencies.ts and AGENTS.md section 7.`);
            return;
        }

        findRelativeImports(files[importer] ?? '').forEach((specifier) => {
            const target = resolveImport(importer, specifier);
            if (target === undefined || !(target in files)) {
                violations.push(`${importer} imports "${specifier}", which resolves to no file in src/.`);
                return;
            }
            const targetArea = classifyFile(target);
            if (targetArea === undefined) {
                return;
            }

            if (!ALLOWED_TARGETS[importerArea].includes(targetArea)) {
                violations.push(`${importer} imports ${target}: ${importerArea} may not import ${targetArea}.`);
            }
            if (target === ENTRY_POINT) {
                violations.push(`${importer} imports ${ENTRY_POINT}: nothing imports the entry point.`);
            }
            if (target === APP_ONLY_FILE && importerArea !== 'app') {
                violations.push(`${importer} imports ${APP_ONLY_FILE}: only the app-level files use it.`);
            }
            if (importerArea === 'exercises' && targetArea === 'exercises' && exerciseTopic(importer) !== exerciseTopic(target)) {
                violations.push(`${importer} imports ${target}: exercise topics stay independent of each other.`);
            }
        });
    });

    return violations;
}
