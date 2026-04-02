import distributionTests from './distribution.test.js';
import generatorTests from './generator.test.js';
import menuActionsTests from './menu-actions.test.js';
import storageTests from './storage.test.js';

const suites = [
    ['distribution', distributionTests],
    ['generator', generatorTests],
    ['menu-actions', menuActionsTests],
    ['storage', storageTests],
];

let failures = 0;

for (const [suiteName, tests] of suites) {
    for (const test of tests) {
        try {
            test.run();
            print(`PASS ${suiteName} ${test.name}`);
        } catch (error) {
            failures += 1;
            printerr(`FAIL ${suiteName} ${test.name}`);
            printerr(error instanceof Error ? error.message : `${error}`);
        }
    }
}

if (failures > 0)
    throw new Error(`${failures} test(s) failed`);

print('PASS all tests');
