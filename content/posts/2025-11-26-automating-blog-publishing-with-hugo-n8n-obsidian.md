---
author: d093w1z
title: 'Automating Blog Publishing With Hugo, n8n & Obsidian'
date: 2025-11-26T11:42:14.000Z
publishDate: 2025-11-26T00:00:00.000Z
description: >-
  A fully automated workflow that takes a markdown file from Obsidian and turns
  it into a published blog post - without me touching Git.
tags:
  - hugo
  - automation
  - n8n
  - obsidian
  - github
  - self-hosted
categories: []
slug: automating-blog-publishing-with-hugo-n8n-obsidian
draft: false
toc: true
---

# How I Automated Blog Publishing With Hugo, n8n & Obsidian

## Introduction

For a long time, my blog publishing workflow looked like this:

- Write notes in Obsidian
- Manually copy them into my Hugo repo
- Fix frontmatter, rename files, and format slugs
- Update my `Blog` page manually
- Commit → push → wait for deployment

This seems simple, but the _friction_ adds up over time. I wanted something extremely straightforward:

**“Write in Obsidian → Move it to Published → It publishes itself.”**

So I automated the entire pipeline using:

- **[Obsidian](https://obsidian.md/)** for writing
- **[Syncthing](https://syncthing.net/)** to sync notes across devices
- **[A Proxmox LXC container](https://www.proxmox.com/)** to host the automation
- **[n8n](https://n8n.io/)** as the workflow engine
- **[GitHub](https://github.com/)** for version control
- **[Hugo](https://gohugo.io/) + [GitHub Pages](https://docs.github.com/en/pages)** for building and deploying the website

Now, whenever I place a markdown file in my `Published` folder:

➜ My blog updates automatically
➜ Frontmatter gets normalized
➜ Git commits are generated and pushed

This post explains exactly how I built it — and how you can too.

---

## 🧩 Architecture Overview

Here’s the full pipeline:

`Obsidian → Syncthing → Proxmox LXC → n8n → GitHub → Hugo → GitHub Pages → d093w1z.com`

Here’s how the pieces fit together:

### 1. Obsidian Folder Structure (Synced via Syncthing)

My notes live inside the Syncthing container (ID 105):

```
/root/Obsidian/obsidian-notes/
└─ Notes/
    └─ Personal/
        └─ Blog/
            ├─ Drafts/
            └─ Published/
```

Anything moved into **Published/** is considered “ready.”
I write posts in **Drafts/** and simply move them when done.

### 2. Syncthing Keeps Everything in Sync

My laptop, desktop, phone, and the Proxmox LXC container all sync automatically through my Cloudflare-exposed Syncthing instance.
No manual copying. No version mismatches.

### 3. n8n Syncs the Changes Into the Hugo Repo

n8n runs in its own LXC (ID 106) with:

- The Hugo repo cloned locally
- GitHub access configured
- A shared folder mapped from the Syncthing container

It monitors the Published folder, picks up changes, copies them into the Hugo repo, and standardizes everything.

### 4. n8n Pushes to GitHub

- Commit message is auto-generated
- GitHub workflow triggers a Hugo build
- Blog deploys automatically

Zero ceremony.

---

## 🛠 Step-by-Step Setup

### Step 1: Prepare Obsidian for Publishing

Create two folders:

Blog/Drafts/
Blog/Published/

I use the Templater plugin to generate consistent frontmatter, filenames, tags, categories, and slugs.
Here’s what it ensures:

- Standardized filenames: `YYYY-MM-DD-slug.md`
- Auto-generated slug
- Auto-date + publish date
- Prompt-driven tags, categories, descriptions
- Draft flag set to true by default

No accidental publishing. No broken frontmatter.

### Step 2: Shared Folder Between Containers

In Proxmox:

- Syncthing container → ID 105
- n8n container → ID 106

Mount a shared folder (e.g., `/mnt/shared/blog-src/`) into both.

This gives n8n direct access to Obsidian’s `Published` folder without exposing Syncthing externally.

### Step 3: n8n Workflow — The Heart of the System

![Pasted image 20251126212034](../../../../Assets/Files/Pasted%20image%2020251126212034.png)

My workflow runs every 15 minutes and does the following:

1. Cron trigger
2. Git pull to ensure the local clone is up to date
3. SSH node to sync from Syncthing folder → shared folder
4. Execute Command node to synchronize markdown files into Hugo’s `content/` directory
5. Conditional router:
   - If there were any changes, Execute Command node to commit and push changes and shoot an email for alert and logging
   - Otherwise do nothing

This is the automation layer that removes 90% of the manual work.

### Step 4: GitHub Workflow for Auto Deployment

Inside the repo, the GitHub Action is simple:

- Trigger on any change inside `content/**`
- Build Hugo (extended version)
- Upload artifacts
- Deploy to GitHub Pages

Every n8n push = an automatic deployment.

---

## 🧠 Why I Built This

I write in multiple places — laptop at home, desktop at my workstation, sometimes even my phone.
But publishing used to be tedious:

- Copying files
- Fixing frontmatter
- Creating slugs
- Committing manually
- Remembering to update my projects page

Now?
I just move a file to the Published folder and forget about it.

Everything else happens automatically.

This means:

```text
✔️ More posts
✔️ Cleaner project documentation
✔️ No context switching
✔️ No manual Git busywork
✔️ Zero-pressure publishing
✔️ Zero-friction blogging
```

This single system removed the biggest barrier to writing consistently.

## 🏁 Conclusion

This setup took a few iterations to get right, but the result is a _hands-off_ publishing pipeline.  
It's not perfect — even while writing this post, I found improvements I want to add — but the important thing is:  
**It just works™**

And it has saved me hours of repetitive manual work.

Tools like Hugo, n8n, Syncthing, GitHub, and Obsidian become incredibly powerful when you stitch them together with a simple workflow.
