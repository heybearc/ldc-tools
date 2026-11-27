#!/usr/bin/env python3
"""Open the asset-catalog FIFO only after actool is already stuck.

A healthy catalog compile finishes in a few seconds. Opening HostToRemote
during that window makes AssetCatalogAgent abort. Once actool has been
alive longer than that, ibtoold still has no write end and both sides are
waiting. Open the write end until ibtoold has its own, then close it.
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
OPEN_AFTER = 8


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


def actool_age(now):
    current = set(pids_for("actool", exact=True))
    oldest = 0
    for pid in current:
        ACTOOL_SEEN.setdefault(pid, now)
        oldest = max(oldest, now - ACTOOL_SEEN[pid])
    for pid in list(ACTOOL_SEEN):
        if pid not in current:
            del ACTOOL_SEEN[pid]
    return oldest


def open_handshake(now):
    if actool_age(now) < OPEN_AFTER:
        return
    for path in fifos():
        if path in DONE or path in HELD:
            if path in HELD and ibtoold_has_write(path):
                release(path, "ibtoold has the write end")
            continue
        if ibtoold_has_write(path):
            DONE.add(path)
            continue
        try:
            fd = os.open(path, os.O_WRONLY | os.O_NONBLOCK)
        except OSError as error:
            if error.errno != errno.ENXIO:
                print(f"asset-catalog pipe: {path}: {error}", flush=True)
            continue
        os.set_blocking(fd, True)
        HELD[path] = fd
        HELD_AT[path] = now
        print(f"asset-catalog pipe: opened {path}", flush=True)
        if ibtoold_has_write(path):
            release(path, "ibtoold has the write end")


def main():
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
    parent = os.getppid()
    print(f"asset-catalog pipe: watching parent {parent}", flush=True)
    while pid_alive(parent):
        open_handshake(time.time())
        time.sleep(0.2)
    for path in list(HELD):
        release(path, "parent exited")


if __name__ == "__main__":
    main()
