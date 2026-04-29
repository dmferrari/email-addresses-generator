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
        this._addresses = new Set();
        this._loaded = this._loadAsync();
    }

    async add(address) {
        await this._loaded;

        if (this._addresses.has(address))
            return false;

        this._addresses.add(address);
        await this._saveAsync();
        return true;
    }

    async clear() {
        await this._loaded;
        this._addresses.clear();
        await this._saveAsync();
    }

    has(address) {
        return this._addresses.has(address);
    }

    get path() {
        return this._path;
    }

    async _loadAsync() {
        const file = Gio.File.new_for_path(this._path);

        try {
            const [, contents] = await new Promise((resolve, reject) => {
                file.load_contents_async(null, (_source, result) => {
                    try {
                        resolve(file.load_contents_finish(result));
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            const data = JSON.parse(new TextDecoder('utf-8').decode(contents));

            if (Array.isArray(data)) {
                this._addresses = new Set(
                    data.filter(address => typeof address === 'string')
                );
            } else if (Array.isArray(data?.addresses)) {
                this._addresses = new Set(
                    data.addresses.filter(address => typeof address === 'string')
                );
            }
        } catch (error) {
            if (!error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                logError(error, 'Failed to load used addresses');
        }
    }

    _saveAsync() {
        ensureStorageDirectory(this._path);

        const file = Gio.File.new_for_path(this._path);
        const payload = `${JSON.stringify({
            addresses: [...this._addresses].sort(),
        }, null, 2)}\n`;

        return new Promise((resolve, reject) => {
            file.replace_contents_bytes_async(
                new TextEncoder().encode(payload),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null,
                (_source, result) => {
                    try {
                        file.replace_contents_finish(result);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }
}
