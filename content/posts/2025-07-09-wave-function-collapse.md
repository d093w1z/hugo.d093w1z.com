---
author: d093w1z
title: Wave Function Collapse
date: 2025-07-08T00:28:58.000Z
lastmod: 2025-07-09T00:28:58.000Z
description: Wave function collapse algorithm overview
tags:
  - wave-function-collapse
  - entropy
  - procedural-generation
  - algorithm-explained
categories:
  - algorithms
  - computer
  - technology
slug: wave-function-collapse
draft: false
toc: true
---
# Wave Function Collapse: Turning Chaos into Structure

Wave Function Collapse (WFC) is a **constraint-based procedural generation algorithm** that turns randomness into structured, coherent output — and it's one of the most satisfying ideas in computer science to actually watch run.

<iframe src="https://d093w1z.com/wfc-demo.html" width="420" height="520"></iframe>

---

## The Core Idea

At the start, every position in your output — a grid, a map, a texture — is completely ambiguous. It can be _anything_. As the algorithm runs, it makes one decision at a time, and each decision constrains what can happen next.

> You don't design the final result directly. You define the _rules_, and the system figures out a valid outcome.

Each choice reduces uncertainty in neighboring cells until the entire system settles into a valid configuration. It's a journey from maximum entropy to fully constrained structure.

Despite borrowing its name from quantum mechanics, WFC has nothing to do with quantum computing. The "superposition" language is just a useful metaphor — every cell starts in a superposition of all possible states, and "collapsing" it means picking one.

---

## How It Works

WFC operates on a grid. Each cell begins as a **superposition** — a set of all valid states. Here's the loop:

### 1. Initialization

Every cell starts with all possible options. No constraints, maximum chaos.

### 2. Pick the Most Constrained Cell

Select the cell with the **lowest entropy** — the fewest remaining possibilities. It's the most "ready" to be decided.

### 3. Collapse It

Pick one valid state, usually at random but optionally weighted. That cell is now fixed.

### 4. Propagate Constraints

The chosen state restricts what neighboring cells can be. Invalid options are pruned. This effect ripples outward, cascading through the grid.

### 5. Repeat

Keep collapsing and propagating until:

- All cells are resolved → ✅ done
- A contradiction occurs → ❌ restart or backtrack

Over enough iterations: **maximum entropy → fully constrained structure**.

---

## Why It's Interesting

WFC is a clean demonstration of a deep idea:

> **Complex global structure can emerge from simple local rules.**

You never specify what the final output looks like. You only specify:

- What's allowed adjacent to what
- How often each tile appears

The rest emerges on its own. This principle shows up across computer science — in cellular automata, constraint solvers, and SAT solvers. WFC packages it in a form that's unusually visual and intuitive.

---

## Origins

WFC was popularized by **Maxim Gumin** in 2016, building on Paul Merrell's earlier _Model Synthesis_ work from 2007. It spread quickly through the game development and creative coding communities.

Notable uses include **Townscaper** (organic city generation), **Bad North** (island layouts), and **Caves of Qud** (world structure).

---

## Two Flavors

**Tiled Model** — Works with a predefined tile set and explicit adjacency rules. Fast, predictable, and common in games.

**Overlapping Model** — Learns patterns directly from an input image by extracting all N×N patches and using those as constraints. More flexible and organic, slightly more complex to implement.

---

## Where It Shines

WFC is especially effective for:

- Procedural maps — dungeons, terrains, cities
- Textures that look handcrafted rather than tiled
- Architectural layouts with coherent structure
- Creative tools that give artists _controlled randomness_ instead of noise

---

## Where It Breaks

WFC isn't bulletproof. Common failure modes:

- **Contradictions** — a cell ends up with zero valid states, requiring a restart
- **Bad rules** — if your adjacency rules are too tight or inconsistent, contradictions are frequent
- **Global structure** — WFC only reasons locally, so long-range structure (like a connected path through a maze) needs extra help

The fix is usually a combination of better-designed rules, backtracking, and retry logic.

---

## Practical Tips

- Start with a small, well-tested tile set before scaling up
- Visualize constraint propagation early — it reveals rule mistakes quickly
- Weight your tiles — uniform randomness rarely looks natural
- Add retry logic before you add backtracking; retries are cheaper
- For mazes or paths, consider a two-pass approach: WFC for texture, pathfinding for structure

---

## Resources

- **Official repo**: [github.com/mxgmn/WaveFunctionCollapse](https://github.com/mxgmn/WaveFunctionCollapse)
- **Robert Heaton's deep-dive**: excellent annotated walkthrough
- Implementations exist in JS, Python, Unity, Rust, and most major environments

---

## Closing Thought

WFC is one of those rare algorithms that feels both simple to grasp and genuinely surprising in behavior.

It's a reminder that in generative systems — and perhaps more broadly —

> You don't always need to design the outcome. Just design the rules well enough, and order will emerge from chaos.
