import {assertEqual} from './assert.js';
import {handleGenerateButtonClick} from '../menu-actions.js';

export default [
    {
        name: 'generate button closes the menu after a successful generation',
        async run() {
            let closeCount = 0;

            await handleGenerateButtonClick(
                async () => 'tester+test-abcd0123@example.com',
                () => {
                    closeCount += 1;
                }
            );

            assertEqual(closeCount, 1);
        },
    },
    {
        name: 'generate button leaves the menu open when generation fails',
        async run() {
            let closeCount = 0;

            await handleGenerateButtonClick(
                async () => null,
                () => {
                    closeCount += 1;
                }
            );

            assertEqual(closeCount, 0);
        },
    },
];
