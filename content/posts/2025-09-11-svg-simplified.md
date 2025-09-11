---
author: d093w1z
title: SVG Simplified
date: 2025-09-11T10:55:24.000Z
publishDate: 2025-09-11T00:00:00.000Z
description: Notes on SVG
tags:
  - svg
  - image
  - graphics
  - computer-graphics
categories:
  - Graphics
slug: svg-simplified
draft: false
toc: true
---

# SVG Simplified

Scalable Vector Graphics (SVG) is an image format.
what makes it special?
Inline SVGs exist, no need to have the data stored on disk.
Also, scalable!

most other file formats are binary formats, bunch of bits packed together, illegible for a human

SVG uses XML syntax and can be edited with a text editor. making it one of the most human friendly way to create and edit computer graphics.
This means the SVG can be added directly to HTML code for web rendering.
The svg can also be modified on the fly, using css or javascript. This makes animations too easy.

```xml
<svg height="100" width="100">
  <circle r="45" cx="50" cy="50" fill="hotpink" />
  Sorry, your browser does not support inline SVG.
</svg>
```
Output:
<svg height="100" width="100">
  <circle r="45" cx="50" cy="50" fill="hotpink" />
  Sorry, your browser does not support inline SVG.  
</svg>

| ```xml<br><svg height="100" width="100"><br>  <circle r="45" cx="50" cy="50" fill="hotpink" /><br>  Sorry, your browser does not support inline SVG.<br></svg><br>``` | <svg height="100" width="100"> <circle r="45" cx="50" cy="50" fill="hotpink" /> Sorry, your browser does not support inline SVG. </svg> |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |

svgs can be created by hand using any text editor.
can also be created with professional graphics software. best option ive worked with is inkscape.
