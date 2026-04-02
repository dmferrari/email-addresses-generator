import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {assert, assertEqual} from './assert.js';
import {UsedAddressStore, ensureStorageDirectory} from '../storage.js';

function createTempDirectory() {
    const directory = GLib.build_filenamev([
        GLib.get_current_dir(),
        `.test-tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ]);

    GLib.mkdir_with_parents(directory, 0o700);

    return directory;
}

function createTempPath(fileName) {
    const directory = createTempDirectory();

    return GLib.build_filenamev([directory, fileName]);
}

function removeTree(path) {
    const file = Gio.File.new_for_path(path);

    if (!file.query_exists(null))
        return;

    const info = file.query_info(
        'standard::type',
        Gio.FileQueryInfoFlags.NONE,
        null
    );

    if (info.get_file_type() === Gio.FileType.DIRECTORY) {
        const enumerator = file.enumerate_children(
            'standard::name',
            Gio.FileQueryInfoFlags.NONE,
            null
        );
        let childInfo;

        while ((childInfo = enumerator.next_file(null)) !== null) {
            removeTree(GLib.build_filenamev([path, childInfo.get_name()]));
        }

        enumerator.close(null);
    }

    file.delete(null);
}

export default [
    {
        name: 'store persists added addresses across reloads',
        run() {
            const path = createTempPath('used-addresses.json');
            const directory = GLib.path_get_dirname(path);

            try {
                const store = new UsedAddressStore(path);

                assertEqual(store.add('tester+test-abcdefgh@example.com'), true);
                assertEqual(store.add('tester+test-abcdefgh@example.com'), false);

                const reloadedStore = new UsedAddressStore(path);

                assert(reloadedStore.has('tester+test-abcdefgh@example.com'));
            } finally {
                removeTree(directory);
            }
        },
    },
    {
        name: 'store clear removes persisted addresses',
        run() {
            const path = createTempPath('used-addresses.json');
            const directory = GLib.path_get_dirname(path);

            try {
                const store = new UsedAddressStore(path);

                store.add('tester+test-abcdefgh@example.com');
                store.clear();

                const reloadedStore = new UsedAddressStore(path);

                assertEqual(reloadedStore.has('tester+test-abcdefgh@example.com'), false);
            } finally {
                removeTree(directory);
            }
        },
    },
    {
        name: 'ensureStorageDirectory creates parent directories for a custom path',
        run() {
            const baseDirectory = createTempDirectory();
            const nestedPath = GLib.build_filenamev([
                baseDirectory,
                'nested',
                'storage',
                'used-addresses.json',
            ]);

            try {
                ensureStorageDirectory(nestedPath);

                assert(GLib.file_test(
                    GLib.path_get_dirname(nestedPath),
                    GLib.FileTest.IS_DIR
                ));
            } finally {
                removeTree(baseDirectory);
            }
        },
    },
];
