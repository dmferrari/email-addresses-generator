import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Pango from 'gi://Pango';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {handleGenerateButtonClick} from './menu-actions.js';

export const EmailIndicator = GObject.registerClass(
class EmailIndicator extends PanelMenu.Button {
    constructor(settings, generator, openPreferences) {
        super(0.0, 'Test Email Addresses');

        this._settings = settings;
        this._generator = generator;
        this._openPreferences = openPreferences;
        this._history = [];
        this._clipboard = St.Clipboard.get_default();
        this._settingsSignals = [];

        this.add_child(new St.Icon({
            icon_name: 'mail-send-symbolic',
            style_class: 'system-status-icon',
        }));

        this._buildMenu();
        this._settingsSignals.push(this._settings.connect('changed::prefix', () => {
            this._updateGenerateButton();
        }));
        this._settingsSignals.push(this._settings.connect('changed::domain', () => {
            this._updateGenerateButton();
        }));

        this._updateGenerateButton();
    }

    destroy() {
        for (const signalId of this._settingsSignals)
            this._settings.disconnect(signalId);

        this._settingsSignals = [];
        super.destroy();
    }

    async generateAndCopy() {
        try {
            const email = await this._generator.generate();

            this._copyToClipboard(email);
            this._prependHistory(email);
            this._updateGenerateButton();

            return email;
        } catch (error) {
            Main.notify('Test Email Addresses', error.message);
            this._updateGenerateButton();
            return null;
        }
    }

    _buildMenu() {
        const actionItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        const actionContent = new St.BoxLayout({
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            style: 'spacing: 10px;',
        });
        const actionIcon = new St.Icon({
            icon_name: 'mail-send-symbolic',
            style_class: 'popup-menu-icon',
        });
        const actionLabel = new St.Label({
            text: 'Generate and copy',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._generateButton = new St.Button({
            can_focus: true,
            x_expand: true,
            style_class: 'button',
            style: 'padding: 14px 18px; border-radius: 999px;',
        });
        actionContent.add_child(actionIcon);
        actionContent.add_child(actionLabel);
        this._generateButton.set_child(actionContent);
        this._generateButton.connect('clicked', () => {
            handleGenerateButtonClick(
                () => this.generateAndCopy(),
                () => this.menu.close()
            );
        });
        actionItem.add_child(this._generateButton);
        this.menu.addMenuItem(actionItem);

        this._historySeparator = new PopupMenu.PopupSeparatorMenuItem();
        this._historyTitle = this._createLabelItem('Recent addresses');
        this._historySection = new PopupMenu.PopupMenuSection();

        this.menu.addMenuItem(this._historySeparator);
        this.menu.addMenuItem(this._historyTitle);
        this.menu.addMenuItem(this._historySection);
        this._renderHistory();

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._createActionItem('Preferences', () => {
            this._openPreferences();
        }));
    }

    _copyToClipboard(text) {
        this._clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
    }

    _createHistoryItem(email) {
        const item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        const box = new St.BoxLayout({
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style: 'spacing: 8px;',
        });
        const label = new St.Label({
            text: email,
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style: 'padding: 6px 0;',
        });
        const button = new St.Button({
            can_focus: true,
            style_class: 'button',
            style: 'padding: 6px 10px;',
            child: new St.Icon({
                icon_name: 'edit-copy-symbolic',
                style_class: 'popup-menu-icon',
            }),
        });

        label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        button.connect('clicked', () => {
            this._copyToClipboard(email);
            this.menu.close();
        });

        box.add_child(label);
        box.add_child(button);
        item.add_child(box);

        return item;
    }

    _createActionItem(text, callback) {
        const item = new PopupMenu.PopupMenuItem(text);
        item.connect('activate', callback);

        return item;
    }

    _createLabelItem(text) {
        const item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        item.add_child(new St.Label({
            text,
            style: 'font-weight: 700; padding-top: 4px; padding-bottom: 6px;',
        }));

        return item;
    }

    _prependHistory(email) {
        this._history = [email, ...this._history].slice(0, 10);
        this._renderHistory();
    }

    _renderHistory() {
        this._historySection.removeAll();

        const visible = this._history.length > 0;

        this._historySeparator.visible = visible;
        this._historyTitle.visible = visible;

        for (const email of this._history)
            this._historySection.addMenuItem(this._createHistoryItem(email));
    }

    _updateGenerateButton() {
        const enabled = this._generator.canGenerate();

        this._generateButton.reactive = enabled;
        this._generateButton.can_focus = enabled;
        this._generateButton.opacity = enabled ? 255 : 128;
    }
});
