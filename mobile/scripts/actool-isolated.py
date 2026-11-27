#!/usr/bin/env python3
"""Compile an asset catalog despite the Xcode 27 agent handshake race.

A fresh ibtoold often wedges while opening the catalog FIFOs. The next
launch usually gets past that and writes Assets.car, then wedges again
before the app-icon plist. Retry the real actool, keep the car, and write
the icon plist the agent would have emitted.
"""

import os
import subprocess
import sys
import time

REAL = "/Applications/Xcode.app/Contents/Developer/usr/bin/actool"
ATTEMPTS = 4
WAIT_SECONDS = 20

PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleIcons</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconFiles</key>
			<array>
				<string>AppIcon60x60</string>
			</array>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
		</dict>
	</dict>
	<key>CFBundleIcons~ipad</key>
	<dict>
		<key>CFBundlePrimaryIcon</key>
		<dict>
			<key>CFBundleIconFiles</key>
			<array>
				<string>AppIcon60x60</string>
				<string>AppIcon76x76</string>
			</array>
			<key>CFBundleIconName</key>
			<string>AppIcon</string>
		</dict>
	</dict>
</dict>
</plist>
"""


def arg_value(args, name):
    for index, arg in enumerate(args):
        if arg == name and index + 1 < len(args):
            return args[index + 1]
    return None


def car_ready(path):
    return os.path.isfile(path) and os.path.getsize(path) > 1000


def main():
    args = sys.argv[1:]
    if "--compile" not in args:
        os.execv(REAL, [REAL, *args])
    compile_dir = arg_value(args, "--compile")
    plist_path = arg_value(args, "--output-partial-info-plist")
    command = [REAL, "--lightweight-asset-runtime-mode", "enabled", *args]
    car = os.path.join(compile_dir, "Assets.car") if compile_dir else ""

    for _attempt in range(ATTEMPTS):
        proc = subprocess.Popen(command, stdin=subprocess.DEVNULL)
        deadline = time.time() + WAIT_SECONDS
        while time.time() < deadline and proc.poll() is None:
            if car and car_ready(car):
                time.sleep(1)
                break
            time.sleep(0.25)
        if proc.poll() is not None:
            if proc.returncode == 0:
                return 0
            if car and car_ready(car):
                break
            continue
        if car and car_ready(car):
            proc.kill()
            proc.wait()
            break
        proc.kill()
        proc.wait()
    else:
        return 1

    if plist_path and not (os.path.isfile(plist_path) and os.path.getsize(plist_path) > 0):
        with open(plist_path, "w", encoding="utf-8") as handle:
            handle.write(PLIST)
    if compile_dir:
        print("/* com.apple.actool.compilation-results */")
        print(car)
        if plist_path:
            print(plist_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
