import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {EmailAddressGenerator} from './generator.js';
import {EmailIndicator} from './indicator.js';
import {UsedAddressStore} from './storage.js';

export default class TestEmailAddressesExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._store = new UsedAddressStore();
        this._generator = new EmailAddressGenerator(this._settings, this._store);
        this._indicator = new EmailIndicator(
            this._settings,
            this._generator,
            () => this.openPreferences()
        );

        Main.panel.addToStatusArea(this.uuid, this._indicator);
        Main.wm.addKeybinding(
            'generate-shortcut',
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => {
                this._indicator.generateAndCopy();
            }
        );
    }

    disable() {
        Main.wm.removeKeybinding('generate-shortcut');
        this._indicator?.destroy();

        this._indicator = null;
        this._generator = null;
        this._store = null;
        this._settings = null;
    }
}
