#!/usr/bin/env python3
"""Keep Xcode 27 from hanging forever in CompileAssetCatalog.

Two failures show up on this toolchain:

1. AssetCatalogAgent blocks in open() on HostToRemote until some writer
   exists, and ibtoold will not open its write end until that returns.
   A non-blocking write open fails with ENXIO in that window, so it never
   breaks the wait. A read-write open succeeds with nobody else attached
   and lets both sides finish the handshake. The extra descriptor has to
   close once both sides have their own, or it swallows the compile message.

2. After the handshake, actool sometimes sits forever with unread bytes in
   both pipes. A normal catalog compile for this app finishes in a few
   seconds. An actool that is still alive after 20 seconds is stuck. Kill
   it, and the ibtoold/agent pair with it, so xcodebuild returns and the
   archive can be retried instead of waiting out the agent.
"""

import errno
import glob
import os
import signal
import subprocess
import time

HELD = {}
HELD_AT = {}
ACTOOL_SEEN = {}
DONE = set()
STUCK_AFTER = 20
HOLD_LIMIT = 2


def pid_alive(pid):
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def ibtoold_pid(path):
    for part in path.split(os.sep):
        if part.startswith("ibtoold-") and part[8:].isdigit():
            return int(part[8:])
    return None


def pids_for(pattern, exact=False):
    flag = "-x" if exact else "-f"
    result = subprocess.run(["pgrep", flag, pattern], capture_output=True, text=True)
    found = []
    for line in result.stdout.split():
        if line.isdigit():
            found.append(int(line))
    return found


def process_has_fd(pid, path, mode):
    real = os.path.realpath(path)
    listing = subprocess.run(["lsof", "-p", str(pid)], capture_output=True, text=True).stdout
    for line in listing.splitlines():
        if "HostToRemote" not in line:
            continue
        if real not in line and path not in line:
            continue
        parts = line.split()
        fd = parts[3] if len(parts) > 3 else ""
        if mode in fd or (mode == "r" and "u" in fd) or (mode == "w" and "u" in fd):
            return True
    return False


def ibtoold_has_write(path):
    pid = ibtoold_pid(path)
    if not pid or not pid_alive(pid):
        return False
    return process_has_fd(pid, path, "w")


def agent_has_read(path):
    for pid in pids_for("AssetCatalogAgent"):
        if process_has_fd(pid, path, "r"):
            return True
    return False


def fifos():
    tmp = os.environ.get("TMPDIR", "/tmp")
    pattern = os.path.join(tmp, "ibtoold-*", "IB", "*.HostToRemote")
    return glob.glob(pattern)


def release(path, reason):
    fd = HELD.pop(path, None)
    HELD_AT.pop(path, None)
    DONE.add(path)
    if fd is not None:
        os.close(fd)
        print(f"asset-catalog pipe: released {path} ({reason})", flush=True)


def open_handshake():
    now = time.time()
    live = set(fifos())
    for path in list(HELD):
        if path not in live:
            release(path, "gone")
    for path in live:
        pid = ibtoold_pid(path)
        if not pid or not pid_alive(pid) or path in DONE:
            continue
        if path in HELD:
            if ibtoold_has_write(path) and agent_has_read(path):
                release(path, "both sides connected")
            elif now - HELD_AT.get(path, now) > HOLD_LIMIT:
                release(path, "hold limit")
            continue
        if ibtoold_has_write(path):
            continue
        try:
            fd = os.open(path, os.O_RDWR | os.O_NONBLOCK)
        except OSError as error:
            if error.errno != errno.ENOENT:
                print(f"asset-catalog pipe: {path}: {error}", flush=True)
            continue
        HELD[path] = fd
        HELD_AT[path] = now
        print(f"asset-catalog pipe: opened {path}", flush=True)


def recycle_stuck_actool():
    now = time.time()
    current = set(pids_for("actool", exact=True))
    for pid in list(ACTOOL_SEEN):
        if pid not in current:
            del ACTOOL_SEEN[pid]
    for pid in current:
        ACTOOL_SEEN.setdefault(pid, now)
        if now - ACTOOL_SEEN[pid] < STUCK_AFTER:
            continue
        print(f"asset-catalog pipe: actool {pid} is still running after {STUCK_AFTER}s; recycling", flush=True)
        for stuck in current:
            try:
                os.kill(stuck, signal.SIGKILL)
            except OSError:
                pass
        subprocess.run(["killall", "-9", "ibtoold"], capture_output=True)
        subprocess.run(["pkill", "-9", "-f", "AssetCatalogAgent"], capture_output=True)
        ACTOOL_SEEN.clear()
        for path in list(HELD):
            release(path, "recycled")
        return


def main():
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
    parent = os.getppid()
    print(f"asset-catalog pipe: watching parent {parent}", flush=True)
    while pid_alive(parent):
        open_handshake()
        recycle_stuck_actool()
        time.sleep(0.2)
    for path in list(HELD):
        release(path, "parent exited")


if __name__ == "__main__":
    main()
