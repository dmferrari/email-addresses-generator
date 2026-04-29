const RANDOM_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_PREFIX = 'test';
const TOKEN_RANDOM_LENGTH = 8;

export function normalizePrefix(prefix) {
    return prefix.trim();
}

export function normalizeDomain(domain) {
    return domain.trim().replace(/^@+/, '').toLowerCase();
}

export function canGenerateEmail(prefix, domain) {
    const normalizedPrefix = normalizePrefix(prefix);
    const normalizedDomain = normalizeDomain(domain);

    return normalizedPrefix.length > 0 &&
        normalizedDomain.length > 0 &&
        !/\s/.test(normalizedPrefix) &&
        !/\s/.test(normalizedDomain) &&
        !normalizedDomain.includes('@');
}

export function getPreviewEmail(prefix, domain) {
    if (!canGenerateEmail(prefix, domain))
        return 'Set a prefix and domain to preview the format.';

    return `${normalizePrefix(prefix)}+${TOKEN_PREFIX}-abcdefgh@${normalizeDomain(domain)}`;
}

export class EmailAddressGenerator {
    constructor(settings, store) {
        this._settings = settings;
        this._store = store;
    }

    canGenerate() {
        return canGenerateEmail(
            this._settings.get_string('prefix'),
            this._settings.get_string('domain')
        );
    }

    async generate() {
        const prefix = normalizePrefix(this._settings.get_string('prefix'));
        const domain = normalizeDomain(this._settings.get_string('domain'));

        if (!canGenerateEmail(prefix, domain))
            throw new Error('Prefix and domain are required.');

        for (let attempt = 0; attempt < 4096; attempt++) {
            const candidate = `${prefix}+${TOKEN_PREFIX}-${randomString(TOKEN_RANDOM_LENGTH)}@${domain}`;

            if (await this._store.add(candidate))
                return candidate;
        }

        throw new Error('Unable to create a unique test email address.');
    }
}

function randomString(length) {
    let output = '';

    for (let index = 0; index < length; index++) {
        const randomIndex = Math.floor(Math.random() * RANDOM_CHARACTERS.length);
        output += RANDOM_CHARACTERS[randomIndex];
    }

    return output;
}
