<%*
const title = await tp.system.prompt("Post Title")
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")      // remove non-alphanumeric characters
  .trim()
  .replace(/\s+/g, "-")              // replace spaces with dashes
const date = tp.date.now("YYYY-MM-DDTHH:mm:ssZ")
const publishDate = tp.date.now("YYYY-MM-DD")
const filenameDate = tp.date.now("YYYY-MM-DD")
const tagsInput = await tp.system.prompt("Tags (comma-separated)")
const categoriesInput = await tp.system.prompt("Categories (comma-separated)")
const description = await tp.system.prompt("Description")

const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean)
const categories = categoriesInput.split(",").map(c => c.trim()).filter(Boolean)

const newFilename = `${filenameDate}-${slug}`
await tp.file.rename(newFilename)
%>---
author: d093w1z
title: "<%* tR += title %>"
date: <%* tR += date %>
publishDate: <%* tR += publishDate %>
description: "<%* tR += description %>"
tags: [<%* tR += tags.join(", ") %>]
categories: [<%* tR += categories.join(", ") %>]
slug: <%* tR += slug %>
draft: true
toc: true
---
# <%* tR += title %>

Start writing here...
