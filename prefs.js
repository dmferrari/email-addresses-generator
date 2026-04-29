import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {getPreviewEmail} from './generator.js';
import {
    ensureStorageDirectory,
    getStorageDirectory,
    getStoragePath,
} from './storage.js';

function getExtensionVersion(extensionDir) {
    const path = GLib.build_filenamev([extensionDir, 'metadata.json']);
    const file = Gio.File.new_for_path(path);
    const [, contents] = file.load_contents(null);
    const metadata = JSON.parse(new TextDecoder('utf-8').decode(contents));
    return metadata.version || 'Unknown';
}

export default class TestEmailAddressesPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const signalIds = [];

        window.set_default_size(640, 720);
        window.search_enabled = true;

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'mail-send-symbolic',
        });
        window.add(page);

        const addressGroup = new Adw.PreferencesGroup({
            title: 'Address format',
            description: 'These values are used in the panel menu and for the keyboard shortcut.',
        });
        const prefixRow = new Adw.EntryRow({
            title: 'Prefix',
        });
        const domainRow = new Adw.EntryRow({
            title: 'Domain',
        });
        const previewRow = new Adw.ActionRow({
            title: 'Preview',
        });

        settings.bind('prefix', prefixRow, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('domain', domainRow, 'text', Gio.SettingsBindFlags.DEFAULT);

        const updatePreview = () => {
            previewRow.subtitle = getPreviewEmail(
                settings.get_string('prefix'),
                settings.get_string('domain')
            );
        };

        signalIds.push(settings.connect('changed::prefix', updatePreview));
        signalIds.push(settings.connect('changed::domain', updatePreview));

        updatePreview();

        addressGroup.add(prefixRow);
        addressGroup.add(domainRow);
        addressGroup.add(previewRow);
        page.add(addressGroup);

        const shortcutGroup = new Adw.PreferencesGroup({
            title: 'Keyboard shortcut',
            description: 'Use a global shortcut to generate and copy a new address.',
        });
        const shortcutRow = new Adw.ActionRow({
            title: 'Generate and copy',
        });
        const changeShortcutButton = new Gtk.Button({
            label: 'Set',
            valign: Gtk.Align.CENTER,
        });
        const clearShortcutButton = new Gtk.Button({
            label: 'Clear',
            valign: Gtk.Align.CENTER,
        });

        const updateShortcutSubtitle = () => {
            shortcutRow.subtitle = getShortcutLabel(settings);
        };

        signalIds.push(settings.connect('changed::generate-shortcut', updateShortcutSubtitle));

        changeShortcutButton.connect('clicked', () => {
            this._presentShortcutCapture(window, settings, updateShortcutSubtitle);
        });
        clearShortcutButton.connect('clicked', () => {
            settings.set_strv('generate-shortcut', []);
            updateShortcutSubtitle();
        });

        shortcutRow.add_suffix(changeShortcutButton);
        shortcutRow.add_suffix(clearShortcutButton);
        updateShortcutSubtitle();
        shortcutGroup.add(shortcutRow);
        page.add(shortcutGroup);

        const storageGroup = new Adw.PreferencesGroup({
            title: 'Storage',
            description: 'Recent addresses only live for the current shell session. The used-address set persists to avoid collisions.',
        });
        const storageRow = new Adw.ActionRow({
            title: 'Used addresses file',
            subtitle: getDisplayStoragePath(),
        });
        const openFolderButton = new Gtk.Button({
            label: 'Open folder',
            valign: Gtk.Align.CENTER,
        });

        openFolderButton.connect('clicked', () => {
            ensureStorageDirectory();
            const uri = GLib.filename_to_uri(getStorageDirectory(), null);
            Gio.AppInfo.launch_default_for_uri(uri, null);
        });

        storageRow.add_suffix(openFolderButton);
        storageGroup.add(storageRow);
        page.add(storageGroup);

        const footerGroup = new Adw.PreferencesGroup();
        const version = getExtensionVersion(this.path);
        const versionLabel = new Gtk.Label({
            label: `Version ${version}`,
            margin_top: 16,
            margin_bottom: 16,
        });
        versionLabel.add_css_class('dim-label');
        versionLabel.set_halign(Gtk.Align.CENTER);
        footerGroup.add(versionLabel);
        page.add(footerGroup);

        window.connect('destroy', () => {
            for (const signalId of signalIds)
                settings.disconnect(signalId);
        });
    }

    _presentShortcutCapture(window, settings, updateShortcutSubtitle) {
        const dialog = new Gtk.Window({
            title: 'Set shortcut',
            transient_for: window,
            modal: true,
            resizable: false,
            default_width: 360,
            default_height: 140,
        });
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 24,
            margin_bottom: 24,
            margin_start: 24,
            margin_end: 24,
        });
        const title = new Gtk.Label({
            label: 'Press the new shortcut',
            xalign: 0,
        });
        const subtitle = new Gtk.Label({
            label: 'Press Backspace to clear or Escape to cancel.',
            xalign: 0,
            wrap: true,
        });

        box.append(title);
        box.append(subtitle);
        dialog.set_child(box);

        const controller = new Gtk.EventControllerKey();
        controller.connect('key-pressed', (_, keyval, _keycode, state) => {
            const modifiers = state & Gtk.accelerator_get_default_mod_mask();

            if (keyval === Gdk.KEY_Escape) {
                dialog.close();
                return Gdk.EVENT_STOP;
            }

            if (keyval === Gdk.KEY_BackSpace) {
                settings.set_strv('generate-shortcut', []);
                updateShortcutSubtitle();
                dialog.close();
                return Gdk.EVENT_STOP;
            }

            if (!Gtk.accelerator_valid(keyval, modifiers))
                return Gdk.EVENT_STOP;

            settings.set_strv('generate-shortcut', [
                Gtk.accelerator_name(keyval, modifiers),
            ]);
            updateShortcutSubtitle();
            dialog.close();

            return Gdk.EVENT_STOP;
        });

        dialog.add_controller(controller);
        dialog.present();
    }
}

function getShortcutLabel(settings) {
    const [shortcut] = settings.get_strv('generate-shortcut');

    if (!shortcut)
        return 'Disabled';

    const [ok, keyval, modifiers] = Gtk.accelerator_parse(shortcut);

    if (!ok)
        return shortcut;

    return Gtk.accelerator_get_label(keyval, modifiers);
}

function getDisplayStoragePath() {
    const homeDirectory = GLib.get_home_dir();
    const storagePath = getStoragePath();

    if (storagePath.startsWith(`${homeDirectory}/`))
        return storagePath.replace(homeDirectory, '~');

    return storagePath;
}
