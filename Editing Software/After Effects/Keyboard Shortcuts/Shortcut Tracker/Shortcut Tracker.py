from pynput import keyboard
from AppKit import NSWorkspace
import json
import os
import atexit

# ----------------------------
# CONFIG
# ----------------------------

OUTPUT_FILE = "ae_shortcuts.json"

MODIFIER_NAMES = {
    keyboard.Key.cmd: "Cmd",
    keyboard.Key.cmd_l: "Cmd",
    keyboard.Key.cmd_r: "Cmd",
    keyboard.Key.ctrl: "Ctrl",
    keyboard.Key.ctrl_l: "Ctrl",
    keyboard.Key.ctrl_r: "Ctrl",
    keyboard.Key.alt: "Opt",
    keyboard.Key.alt_l: "Opt",
    keyboard.Key.alt_r: "Opt",
    keyboard.Key.shift: "Shift",
    keyboard.Key.shift_l: "Shift",
    keyboard.Key.shift_r: "Shift",
}

MODIFIER_ORDER = ["Ctrl", "Opt", "Shift", "Cmd"]

# ----------------------------
# LOAD COUNTS
# ----------------------------

if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "r") as f:
        shortcut_counts = json.load(f)
else:
    shortcut_counts = {}

pressed_modifiers = set()
pressed_keys = set()

# ----------------------------
# Helpers
# ----------------------------

def ae_is_active():
    app = NSWorkspace.sharedWorkspace().frontmostApplication()

    if app is None:
        return False

    name = app.localizedName()
    return "After Effects" in name


def save():
    with open(OUTPUT_FILE, "w") as f:
        json.dump(
            dict(sorted(shortcut_counts.items(), key=lambda x: x[1], reverse=True)),
            f,
            indent=4,
        )


atexit.register(save)


def normalize_key(key):
    if hasattr(key, "char") and key.char:
        return key.char.upper()

    if hasattr(key, "name") and key.name:
        return key.name.upper()

    return str(key).replace("Key.", "").upper()


def build_shortcut(key):
    mods = sorted(
        pressed_modifiers,
        key=lambda x: MODIFIER_ORDER.index(x)
    )

    return "+".join(mods + [normalize_key(key)])

# ----------------------------
# Keyboard Events
# ----------------------------

def on_press(key):
    if not ae_is_active():
        return

    if key in MODIFIER_NAMES:
        pressed_modifiers.add(MODIFIER_NAMES[key])
        return

    if not pressed_modifiers:
        return

    if key in pressed_keys:
        return

    pressed_keys.add(key)

    shortcut = build_shortcut(key)
    shortcut_counts[shortcut] = shortcut_counts.get(shortcut, 0) + 1

    print(f"{shortcut:<30} {shortcut_counts[shortcut]}")


def on_release(key):
    if key in MODIFIER_NAMES:
        pressed_modifiers.discard(MODIFIER_NAMES[key])

    pressed_keys.discard(key)

# ----------------------------
# Start
# ----------------------------

print("Tracking After Effects shortcuts...")
print("Press Ctrl+C to stop.\n")

listener = keyboard.Listener(
    on_press=on_press,
    on_release=on_release,
)

listener.start()

try:
    listener.join()
except KeyboardInterrupt:
    pass
finally:
    save()
    print(f"\nSaved shortcut usage to:\n{os.path.abspath(OUTPUT_FILE)}")