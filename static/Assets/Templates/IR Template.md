<%* 
//await sleep(3000)
const clipItems = await navigator.clipboard.read()
const html = await clipItems[0].getType("text/html");
const clip = await html.text()


const parser = new DOMParser();
const doc = parser.parseFromString(clip, "text/html");


const link = doc.querySelector("a[href]");


const bugId = link.textContent.trim();
const url = link.getAttribute("href");

// Get remaining text (title)
const title = link.getAttribute("title").replace(bugId, "").trim().split('\n').join(" ");
await tp.file.rename(bugId)
%>---
title: "<%* tR += title %>"
url: <%* tR += link%>
created: <%* tR += tp.date.now("YYYY-MM-DD") %>
priority: unknown
stage: todo        # todo | ws1 | ws2 | ws3 | done
bug_id: <%* tR += bugId %>
---
# <% bugId %>
<% url ? `[${bugId}](${url} "${title}")` : bugId %>

> **Title:** <% title || "❗Add title" %>

---

## 📌 Status
- [ ] Reproduced
- [ ] Root cause identified
- [ ] Fix in progress
- [ ] Code review
- [ ] QA verified
- [ ] Closed

---

## 🧪 Reproduction Steps
1.
2.
3.

---

## 🔍 Root Cause
<!-- What actually broke? -->

---

## 🛠 Fix Notes
<!-- What changed, why it works -->

---

## 🧩 Affected Areas
- Module:
- Component:
- Build / Version:

---

## 🔗 Linked Workspaces
- <!-- ws-BUG-XXX-description -->

---

## 🧠 Notes / Observations
- 
