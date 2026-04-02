export function assert(condition, message = 'Assertion failed') {
    if (!condition)
        throw new Error(message);
}

export function assertEqual(actual, expected, message = null) {
    if (actual !== expected) {
        throw new Error(message ?? `Expected ${formatValue(expected)}, got ${formatValue(actual)}`);
    }
}

export function assertMatch(value, pattern, message = null) {
    if (!pattern.test(value))
        throw new Error(message ?? `Expected ${formatValue(value)} to match ${pattern}`);
}

function formatValue(value) {
    return JSON.stringify(value);
}
