<%*
const title = await tp.system.prompt("Post Title")
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")      // remove non-alphanumeric characters
  .trim()
  .replace(/\s+/g, "-")              // replace spaces with dashes
const date = tp.date.now("YYYY-MM-DDTHH:mm:ssZ")
const filenameDate = tp.date.now("YYYY-MM-DD")
const tagsInput = await tp.system.prompt("Tags (comma-separated)")
const categoriesInput = await tp.system.prompt("Categories (comma-separated)")
const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean)
const categories = categoriesInput.split(",").map(c => c.trim()).filter(Boolean)

const username = await tp.system.prompt("Github Username")
const repo = await tp.system.prompt("Repository Name")
const branch = await tp.system.prompt("Branch")

const newFilename = `${filenameDate}-${slug}`
await tp.file.rename(newFilename)
%>---
title: "<%* tR += title %>"
date: <%* tR += date %>
tags: [<%* tR += tags.join(", ") %>]
categories: [<%* tR += categories.join(", ") %>]
slug: <%* tR += slug %>
username: "<%* tR += username %>"
repo: "<%* tR += repo %>"
branch: "<%* tR += branch %>"
---