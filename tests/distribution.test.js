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
];
