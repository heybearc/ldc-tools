#!/usr/bin/env python3
"""Recycle an actool that never finishes.

Do not open the HostToRemote FIFO. On Xcode 27 that open makes
AssetCatalogAgent abort before the handshake, and a clean compile
finishes without it. If actool is still alive after STUCK_AFTER seconds,
kill it so the lane can retry the archive.
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
STUCK_AFTER = 90


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
    # Opening HostToRemote while actool is running makes AssetCatalogAgent
    # abort before the handshake. A clean compile finishes on its own.
    return


def recycle_stuck_actool():
    now = time.time()
    current = set(pids_for("actool", exact=True))
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
