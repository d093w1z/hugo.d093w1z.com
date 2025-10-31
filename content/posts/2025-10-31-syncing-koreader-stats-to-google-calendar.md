---
author: d093w1z
title: Syncing KOReader Stats to Google Calendar
date: 2025-10-31T15:20:10.000Z
publishDate: 2025-10-31T00:00:00.000Z
description: >-
  Reflections on automating my Kobo reading data using n8n, SQLite, and a bit of
  structure.
tags:
  - automation
  - reading
  - selfhosted
  - n8n
  - kobo
categories: []
slug: syncing-koreader-stats-to-google-calendar
draft: false
toc: true
---
# Syncing KOReader Stats to Google Calendar

For a long time, my Kobo and KOReader setup quietly gathered data — timestamps, durations, page counts — all buried in a small SQLite file inside *KoReader settings folder*. It was good data, but inert. I wanted it to *mean* something — to tell me *when* I read, not just *how much*.  

So I started building a small workflow around it.

---

## Setting the Stage

Everything runs inside my Proxmox setup — a few LXCs doing specific jobs. One of them runs **[Syncthing](https://syncthing.net/)**, syncing my KOReader configuration folder from the Kobo. Another runs **[n8n](https://n8n.io)**, the automation platform that quietly keeps things stitched together.

The idea was simple:  
- Extract reading session data from KOReader’s SQLite database.  
- Push it into Google Calendar as events.  
- Let the calendar become a visual diary of when and what I read.

---

## The First Version

The first pass was straightforward: a cron trigger in n8n every 1 Hour, an SSH node to sync the latest data, and a command node running a small SQLite query:

Query:
```sql
SELECT 
  b.title, 
  p.page, 
  datetime(p.start_time, 'unixepoch') AS start_time, 
  p.duration
FROM page_stat_data p
JOIN book b ON b.id = p.id_book
WHERE p.start_time > strftime('%s', 'now', '-1 day')
ORDER BY p.start_time DESC;
```

Execute Node Command with query:
```bash
sqlite3 -json "/mnt/koreader/KoReader settings folder/statistics.sqlite3" "
SELECT 
  b.title, 
  p.page, 
  datetime(p.start_time, 'unixepoch') AS start_time, 
  p.duration
FROM page_stat_data p
JOIN book b ON b.id = p.id_book
WHERE p.start_time > strftime('%s', 'now', '-1 day')
ORDER BY p.start_time DESC;
"
```

The output was a neat JSON list — one entry per page turn. That data flowed into Google Calendar, creating events with start and end times based on the duration field.

It worked. But it was naive.

KOReader logs every page turn as an entry, so a single reading session could easily spawn ten events in my calendar. The result was chaos — a timeline that looked like someone was flicking through books every few seconds.

## Rethinking What a "Session" Is

The next step was to define sessions. Humans read continuously; the data doesn’t reflect that directly, but it can be inferred.

The rule I ended up with was simple:

    If consecutive entries for the same book are less than 10 minutes apart,
    they belong to the same session.

That grouping cleaned up everything.
A function node in [n8n](https://n8n.io) handled the logic:

```js

const MAX_GAP = 10 * 60; // 10 minutes in seconds

const rows = items
  .map(i => i.json)
  .sort((a, b) => a.title.localeCompare(b.title) || new Date(a.start_time) - new Date(b.start_time));

const sessions = [];
let current = null;

for (const r of rows) {
  const t = new Date(r.start_time).getTime() / 1000;

  if (!current || current.title !== r.title || t - current.lastTime > MAX_GAP) {
    if (current) sessions.push(current);
    current = {
      title: r.title,
      start: r.start_time,
      end: new Date(t * 1000 + r.duration * 1000).toISOString(),
      duration: r.duration,
      pages: [r.page],
      lastTime: t + r.duration
    };
  } else {
    current.duration += r.duration;
    current.pages.push(r.page);
    current.end = new Date(t * 1000 + r.duration * 1000).toISOString();
    current.lastTime = t + r.duration;
  }
}

if (current) sessions.push(current);

return sessions.map(s => {
  const minPage = Math.min(...s.pages);
  const maxPage = Math.max(...s.pages);
  const summary = `📖 Reading: ${s.title}`;
  const desc = `Book: ${s.title}\nPages: ${minPage}-${maxPage}\nDuration: ${(s.duration / 60).toFixed(1)} min`;

  return {
    json: {
      uid: `${s.title.replace(/\W+/g, "_")}_${s.start}`,
      title: s.title,
      start: s.start,
      end: s.end,
      summary,
      description: desc
    }
  };
});
```

The node outputs one clean JSON object per session, merging all the small fragments into a continuous event.

## Preventing Duplicates

Once aggregation worked, another problem surfaced — duplication.
Every 15 minutes, [n8n](https://n8n.io) would re-run and create identical events again.

The fix was to add a small lookup before creating events. The Google Calendar API allows you to search for existing events within a time range and update them instead of recreating them.

So the workflow changed:

    Query SQLite → Aggregate sessions
    For each session:
        Check if an event with the same uid exists
        If yes → Update
        If no → Create

That small check turned the workflow from a fire-hose into a proper sync system.

## Watching It Work

Once it stabilised, the reading sessions began appearing in my Google Calendar like clockwork — timestamped, titled, cleanly grouped.
Each event carries the book name, page range, and reading duration.
The patterns that emerged were surprisingly telling — the quiet pockets of time where I naturally read, the consistency of my evening sessions, the drop-offs during busier weeks.

## Reflection

![Pasted image 20251031225027](Pasted%20image%2020251031225027.png)
This entire automation started as a small curiosity — a way to surface data I already had. But it became something else: a lightweight reflection tool.
There’s a quiet satisfaction in opening Google Calendar and seeing my reading woven between everything else I do.

It’s not quantified self in the strict sense. It’s just a quiet map of focus — a history of pages and pauses.

## Next Steps

There’s still more to refine.
Maybe integrate with [Obsidian](https://obsidian.md/) for weekly summaries, or visualise streaks directly from the data.
For now, it does enough — a small, local system that listens, interprets, and tells me what I’ve already done without needing to ask.
