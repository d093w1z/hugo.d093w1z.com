---
author: d093w1z
title: Recovering a Broken Proxmox LXC After Running Out of Disk Space
date: 2026-05-15T00:00:00.000Z
publishDate: 2026-05-15T00:00:00.000Z
description: >-
  A short overview of recovering broken Proxmox LXCs after a storage exhaustion
  incident, restructuring a Calibre deployment, and improving long-term storage
  reliability.
tags:
  - proxmox
  - docker
  - calibre
  - homelab
  - self-hosting
categories:
  - Homelab
slug: proxmox-calibre-storage-recovery
draft: false
toc: true
---
# Recovering a Broken Proxmox LXC After Running Out of Disk Space

Recently I ran into a serious issue with my homelab setup where multiple LXC containers on my Proxmox server suddenly stopped starting.

The root cause turned out to be a completely full storage volume combined with large RAW disk images and duplicated data.

This post is a short overview of how I recovered the system, migrated my Calibre setup to a cleaner structure, and improved the deployment architecture.

---

# The Initial Problem

Several containers began failing with errors similar to:

```bash
Failed to run lxc.hook.pre-start
can't read superblock on /dev/loopXX
```

After checking disk usage, I discovered one of my storage directories had reached 100% utilization.

The main offender was a large Calibre LXC containing:

* duplicated Calibre libraries
* large RAW rootfs images
* Docker overlay data
* old backups and temporary copies

---

# Immediate Recovery

The first step was reclaiming space quickly:

* stopped all affected containers
* identified large RAW images
* moved unnecessary data off the full storage pool
* removed stale duplicate copies
* cleaned up unused LXC disks

Once enough free space was available again, the containers started working normally.

---

# Calibre GUI Issues

After recovering the storage, the LinuxServer Calibre GUI stopped functioning correctly.

The newer Calibre container now uses a Selkies/WebSocket-based remote GUI stack which requires additional ports and HTTPS handling.

The fix was exposing the required ports correctly:

```yaml
ports:
  - 8080:8080
  - 8081:8081
  - 8082:8082
  - 8181:8181
```

Without the WebSocket port, the frontend would partially load but fail to function properly.

---

# Reorganizing the Deployment

Originally, the deployment stored everything under `/root/calibre`, including:

* library files
* metadata
* configs
* GUI state
* temporary caches

This made backups and recovery difficult.

I migrated everything to a cleaner structure:

```txt
/mnt/pve/StorageDirectory/docker/
├── calibre-gui/config
├── calibre-web/config
├── calibre-library
├── backups
└── compose
```

This separates:

* persistent library data
* application configs
* runtime state
* backups

which makes the system much easier to maintain.

---

# Backup Improvements

I also added:

* metadata database backups
* config backups
* periodic library snapshots
* retention cleanup

The most important file in a Calibre deployment is:

```txt
metadata.db
```

Protecting that file is critical.

---

# Shrinking the LXC Root Filesystem

Even after moving the library externally, the LXC still had a large 69GB RAW root disk.

Instead of attempting risky in-place shrinking, I used a safer workflow:

1. create a vzdump backup
2. restore to a temporary CT with a smaller rootfs
3. verify functionality
4. destroy old CT
5. restore back using the original CTID

This allowed me to safely reduce the container size while keeping the same container ID.

---

# Final Result

The final setup is:

* cleaner
* easier to back up
* easier to recover
* less prone to storage exhaustion
* easier to scale

The biggest lesson from this incident:

> separate large persistent data from container root filesystems as early as possible.

This dramatically simplifies recovery when something eventually goes wrong.

---

# Closing Thoughts

This incident was a good reminder that homelab infrastructure needs:

* storage monitoring
* backup planning
* clean separation of stateful data
* periodic cleanup

Even relatively small mistakes like duplicated directories or oversized RAW images can cascade into larger failures when disk space runs out.

Fortunately, with some cleanup and restructuring, the system is now much healthier and easier to maintain going forward.
