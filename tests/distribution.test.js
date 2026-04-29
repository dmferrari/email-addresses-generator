import Gio from 'gi://Gio';

import {assert} from './assert.js';

const RUNTIME_FILES = [
    'extension.js',
    'generator.js',
    'indicator.js',
    'menu-actions.js',
    'metadata.json',
    'prefs.js',
    'storage.js',
];

export default [
    {
        name: 'all runtime files referenced by packaging scripts exist',
        run() {
            for (const path of RUNTIME_FILES) {
                assert(
                    Gio.File.new_for_path(path).query_exists(null),
                    `Missing runtime file: ${path}`
                );
            }
        },
    },
    {
        name: 'metadata.json supports the expected GNOME versions',
        run() {
            const file = Gio.File.new_for_path('metadata.json');
            const [, contents] = file.load_contents(null);
            const metadata = JSON.parse(new TextDecoder('utf-8').decode(contents));
            const versions = metadata['shell-version'];

            assert(versions.includes('49'), 'Should support GNOME 49');
            assert(versions.includes('50'), 'Should support GNOME 50');
        },
    },
];
