import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const DATA_DIRECTORY_NAME = 'test-email-addresses';
const FILE_NAME = 'used-addresses.json';

export function getStorageDirectory() {
    return GLib.build_filenamev([GLib.get_user_data_dir(), DATA_DIRECTORY_NAME]);
}

export function getStoragePath() {
    return GLib.build_filenamev([getStorageDirectory(), FILE_NAME]);
}

export function ensureStorageDirectory(path = getStoragePath()) {
    const directoryPath = GLib.path_get_dirname(path);
    const directory = Gio.File.new_for_path(directoryPath);

    try {
        directory.make_directory_with_parents(null);
    } catch (error) {
        if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
            throw error;
    }
}

export class UsedAddressStore {
    constructor(path = getStoragePath()) {
        this._path = path;
        this._addresses = this._load();
    }

    add(address) {
        if (this._addresses.has(address))
            return false;

        this._addresses.add(address);
        this._save();
        return true;
    }

    clear() {
        this._addresses.clear();
        this._save();
    }

    has(address) {
        return this._addresses.has(address);
    }

    get path() {
        return this._path;
    }

    _load() {
        const file = Gio.File.new_for_path(this._path);

        try {
            const [, contents] = file.load_contents(null);
            const data = JSON.parse(new TextDecoder('utf-8').decode(contents));

            if (Array.isArray(data))
                return new Set(data.filter(address => typeof address === 'string'));

            if (Array.isArray(data?.addresses))
                return new Set(data.addresses.filter(address => typeof address === 'string'));
        } catch (error) {
            if (!error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                logError(error, 'Failed to load used addresses');
        }

        return new Set();
    }

    _save() {
        ensureStorageDirectory(this._path);

        const file = Gio.File.new_for_path(this._path);
        const payload = `${JSON.stringify({
            addresses: [...this._addresses].sort(),
        }, null, 2)}\n`;

        file.replace_contents(
            new TextEncoder().encode(payload),
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION,
            null
        );
    }
}
