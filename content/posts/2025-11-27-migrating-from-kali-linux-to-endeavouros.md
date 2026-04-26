---
author: d093w1z
title: Migrating from Kali Linux to EndeavourOS
date: 2025-11-27T04:57:31.000Z
publishDate: 2025-11-27T00:00:00.000Z
description: I migrated my daily driver from Kali linux to EndeavourOS
tags:
  - migration
  - os
  - linux
  - dev
categories:
  - Development
  - Setup
slug: migrating-from-kali-linux-to-endeavouros
draft: false
toc: true
---

# Migrating My Daily Driver from Kali Linux to EndeavourOS

## Introduction

I used Kali Linux as my primary OS for about two years.

It worked well for what it’s designed for — fast, minimal, and predictable. But over time, my usage shifted more towards development, longer sessions, and heavier workloads (containers, VMs, GPU work).

At that point, Kali started feeling slightly out of place.

This post covers why I moved away, why I chose EndeavourOS, and how the transition went.

---

## Why I Left Kali Linux

Kali is optimized for security workflows. I was using it for general development.

That mismatch showed up in small ways.

### 1. Not a general-purpose environment

Kali comes with:

* custom kernels
* security-focused defaults
* preinstalled tooling

These are useful in its domain, but for day-to-day development and desktop use, things don’t always feel natural.

---

### 2. Small friction points add up

I ran into recurring issues like:

* outdated or missing dev packages
* extra steps for NVIDIA setup
* dependency mismatches

Nothing critical, but enough to slow things down over time.

---

### 3. Occasional regressions

Some updates introduced inconsistencies:

* Bluetooth not working reliably
* GPU offloading behaving unpredictably
* virtualization quirks

These were fixable, but not something I wanted to deal with regularly.

---

### 4. Slower-moving ecosystem

Kali tracks Debian Testing.

For my workflow, I wanted faster updates for:

* Neovim
* Wayland tools
* development toolchains
* GPU libraries

---

### 5. Preference for a minimal base

Kali provides a complete environment out of the box.

I prefer starting with a minimal system and building it up as needed.

---

## Why EndeavourOS

EndeavourOS provides a clean Arch-based system with minimal setup overhead.

---

### 1. Arch ecosystem with a simpler setup

It gives:

* a straightforward installer
* a minimal starting point
* access to Arch repositories and AUR

This removes most of the setup overhead while keeping flexibility.

---

### 2. Package availability

Between official repos and AUR, most tools are readily available.

I rarely need manual workarounds.

---

### 3. Better fit for development workflows

My setup includes:

* Docker and containers
* multiple language toolchains
* Neovim and IDEs
* virtualization
* hybrid GPU usage

On EndeavourOS, these feel more consistent and up to date.

---

### 4. Rolling release model

Updates arrive faster, especially for development tools and system components.

---

### 5. Environment control

I use bspwm and Hyprland.

Setting up a window manager-based environment is straightforward:

```bash
sudo pacman -S bspwm sxhkd polybar rofi dunst picom
```

---

## Migration Process

I wanted to avoid breaking my multiboot setup and preserve configurations.

---

### Phase 1 — Preparation

Backed up:

* dotfiles
* Syncthing data
* Obsidian vault
* SSH and GPG keys
* Docker volumes
* VM images

Also exported installed packages for reference:

```bash
apt list --installed > installed_kali_packages.txt
```

---

### Phase 2 — Installation

* EFI boot
* Btrfs with subvolumes
* GRUB for multiboot
* minimal install

---

### Phase 3 — Environment setup

Installed:

* development tools
* CLI utilities
* window manager setup
* container tooling

Restored dotfiles.

The system was usable within a short time.

---

### Phase 4 — Verification

Checked:

* multi-monitor setup
* Bluetooth
* GPU behavior
* Docker and containers
* virtualization
* general performance

No major issues.

---

## Final Thoughts

Kali Linux is well-suited for security-focused workflows.

For general development, I found EndeavourOS to be a better fit:

* cleaner base
* faster updates
* fewer interruptions

The main difference is not performance, but consistency.

---

## When This Switch Makes Sense

Consider switching if:

* you use Kali primarily for development
* you want more control over your environment
* you prefer a faster-moving ecosystem

If your work is primarily security-focused, Kali remains the better choice.

---

## Closing

The system now stays out of the way, which is what I wanted.
