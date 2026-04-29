import {
    EmailAddressGenerator,
    canGenerateEmail,
    getPreviewEmail,
    normalizeDomain,
    normalizePrefix,
} from '../generator.js';

import {assert, assertEqual, assertMatch} from './assert.js';

class FakeSettings {
    constructor(values) {
        this._values = values;
    }

    get_string(key) {
        return this._values[key] ?? '';
    }
}

class InMemoryStore {
    constructor(initialValues = []) {
        this._values = new Set(initialValues);
    }

    async add(address) {
        if (this._values.has(address))
            return false;

        this._values.add(address);
        return true;
    }
}

export default [
    {
        name: 'normalizePrefix trims surrounding spaces',
        run() {
            assertEqual(normalizePrefix('  tester  '), 'tester');
        },
    },
    {
        name: 'normalizeDomain strips leading at-signs and lowercases',
        run() {
            assertEqual(normalizeDomain('@@Example.COM '), 'example.com');
        },
    },
    {
        name: 'canGenerateEmail rejects blank or malformed inputs',
        run() {
            assert(!canGenerateEmail('', 'example.com'));
            assert(!canGenerateEmail('tester', ''));
            assert(!canGenerateEmail('test user', 'example.com'));
            assert(!canGenerateEmail('tester', '@bad@domain.com'));
        },
    },
    {
        name: 'getPreviewEmail reflects the requested address format',
        run() {
            assertEqual(
                getPreviewEmail('tester', 'example.com'),
                'tester+test-abcdefgh@example.com'
            );
        },
    },
    {
        name: 'generator creates a unique address with the expected format',
        async run() {
            const generator = new EmailAddressGenerator(
                new FakeSettings({
                    prefix: 'tester',
                    domain: 'example.com',
                }),
                new InMemoryStore()
            );

            const email = await generator.generate();

            assertMatch(email, /^tester\+test-[a-z0-9]{8}@example\.com$/);
        },
    },
    {
        name: 'generator retries until it finds a unique address',
        async run() {
            const generator = new EmailAddressGenerator(
                new FakeSettings({
                    prefix: 'tester',
                    domain: 'example.com',
                }),
                new InMemoryStore(['tester+test-aaaaaaaa@example.com'])
            );

            const originalRandom = Math.random;
            const sequence = [
                0, 0, 0, 0, 0, 0, 0, 0,
                1 / 36, 1 / 36, 1 / 36, 1 / 36, 1 / 36, 1 / 36, 1 / 36, 1 / 36,
            ];
            let index = 0;

            Math.random = () => sequence[index++] ?? (1 / 36);

            try {
                assertEqual(
                    await generator.generate(),
                    'tester+test-bbbbbbbb@example.com'
                );
            } finally {
                Math.random = originalRandom;
            }
        },
    },
];
