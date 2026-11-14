#!/usr/bin/env python3
"""Unblock Xcode's asset-catalog handshake, then get out of the way.

actool waits for AssetCatalogAgent to open a HostToRemote FIFO. The agent
blocks in open() until a writer exists, and ibtoold does not open its write
end until that handshake returns. Open the write end just long enough for
ibtoold to open its own, then close it. Leaving it open past that point
breaks the compile message that follows.
"""

import errno
import glob
import os
import signal
import subprocess
import time

HELD = {}
RELEASED = set()


def ibtoold_has_write(path):
    real = os.path.realpath(path)
    result = subprocess.run(["pgrep", "-x", "ibtoold"], capture_output=True, text=True)
    for pid in result.stdout.split():
        listing = subprocess.run(["lsof", "-p", pid], capture_output=True, text=True).stdout
        for line in listing.splitlines():
            if "HostToRemote" not in line or real not in line and path not in line:
                continue
            parts = line.split()
            fd = parts[3] if len(parts) > 3 else ""
            if "w" in fd:
                return True
    return False


def scan():
    tmp = os.environ.get("TMPDIR", "/tmp")
    pattern = os.path.join(tmp, "ibtoold-*", "IB", "*.HostToRemote")
    for path in glob.glob(pattern):
        if path in RELEASED:
            continue
        if path in HELD:
            if ibtoold_has_write(path):
                os.close(HELD.pop(path))
                RELEASED.add(path)
                print(f"asset-catalog pipe: released {path}", flush=True)
            continue
        if ibtoold_has_write(path):
            RELEASED.add(path)
            continue
        try:
            fd = os.open(path, os.O_WRONLY | os.O_NONBLOCK)
        except OSError as error:
            if error.errno != errno.ENXIO:
                print(f"asset-catalog pipe: {path}: {error}", flush=True)
            continue
        os.set_blocking(fd, True)
        HELD[path] = fd
        print(f"asset-catalog pipe: opened {path}", flush=True)
        if ibtoold_has_write(path):
            os.close(HELD.pop(path))
            RELEASED.add(path)
            print(f"asset-catalog pipe: released {path}", flush=True)


def build_alive():
    result = subprocess.run(
        ["pgrep", "-fl", "xcodebuild|actool|ibtoold|gym|fastlane"],
        capture_output=True,
        text=True,
    )
    for line in result.stdout.splitlines():
        if "hold-asset-catalog-pipes" in line or " pgrep " in line:
            continue
        return True
    return False


def main():
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
    deadline = time.time() + 45 * 60
    seen = False
    idle_checks = 0
    while time.time() < deadline:
        scan()
        if build_alive():
            seen = True
            idle_checks = 0
        elif seen:
            idle_checks += 1
            if idle_checks >= 15:
                return
        time.sleep(0.05)


if __name__ == "__main__":
    main()
