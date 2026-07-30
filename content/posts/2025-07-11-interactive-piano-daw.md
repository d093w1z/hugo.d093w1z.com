---
author: d093w1z
title: Interactive Piano DAW
date: 2025-07-11T15:51:10.000Z
publishDate: 2025-07-11T00:00:00.000Z
description: A light-weight standalone DAW implementation for Piano.
tags:
  - piano
  - synthesis
  - daw
  - audio
  - music
categories: []
slug: interactive-piano-daw
draft: false
toc: true
---

# Interactive Piano DAW

A lightweight, browser-based piano roll DAW — an attempt to see how much of a real digital audio workstation could be built with nothing but vanilla JS, [Tone.js](https://tonejs.github.io/) for synthesis, and [MidiWriter.js](https://github.com/grimmdude/MidiWriterJS) for MIDI export.

## What it does

- A 16-step piano roll grid spanning three octaves (C3–B5), click-and-drag to toggle notes
- Adjustable BPM and a choice between a synth or piano-style voice
- Play / Stop / Clear transport controls
- Save/Load to persist a pattern, and Export MIDI to pull a sequence out as a real `.mid` file

## Why

I wanted something I could open in a single browser tab and sketch a quick melody in, without booting a full DAW. Keeping it to one static HTML file — no build step, no backend — also made it a decent stress-test for how far the Web Audio API can be pushed before you actually need a "real" audio engine.

The trickiest part was keeping playback honest: the visual step highlighting and the actual Tone.js transport clock will drift out of sync if you drive playback off `setInterval` instead of scheduling ahead of the audio clock.

Try it below:

<iframe src="/piano-daw.html" width="100%" height="700" style="border:1px solid #ccc;">
    Your browser does not support iframes.
</iframe>
