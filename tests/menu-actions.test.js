import {assertEqual} from './assert.js';
import {handleGenerateButtonClick} from '../menu-actions.js';

export default [
    {
        name: 'generate button closes the menu after a successful generation',
        run() {
            let closeCount = 0;

            handleGenerateButtonClick(
                () => 'tester+test-abcd0123@example.com',
                () => {
                    closeCount += 1;
                }
            );

            assertEqual(closeCount, 1);
        },
    },
    {
        name: 'generate button leaves the menu open when generation fails',
        run() {
            let closeCount = 0;

            handleGenerateButtonClick(
                () => null,
                () => {
                    closeCount += 1;
                }
            );

            assertEqual(closeCount, 0);
        },
    },
];
