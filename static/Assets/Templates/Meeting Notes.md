<%*
const date = tp.date.now("YYYY-MM-DDTHH:mm:ssZ")
const time = tp.date.now("HH:mm");
const weekday = tp.date.now("dddd");
// const title = await tp.system.prompt("Meeting Title", null, false, false);
let title = await tp.system.suggester(["test", "Sad", "Confused"], ["Happy", "Sad", "Confused"]);

if(title===null){
    title = await tp.system.prompt("Meeting Title", null, false, false);
}
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")      // remove non-alphanumeric characters
  .trim()
  .replace(/\s+/g, "-")              // replace spaces with dashes

const filenameDate = tp.date.now("YYYY-MM-DD")
const newFilename = `${filenameDate}-${slug}`
await tp.file.rename(newFilename)
%>---
title: "<%* tR += title %>"
date: <%* tR += date %>
time: <%* tR += time %>
day: <%* tR += weekday %>
author: d093w1z
---
# 📝 <% title %> 

---

## 📍 Meeting Info

- **Project / Team:**  
- **Attendees:**     
  - [ ] Omkar Kulkarni
  - [ ] Shubham Kapote
  - [ ] Bhushan Modak
  - [ ] d093w1z

- **Meeting Type:** (Stand-up / Sprint Planning / Retrospective / Technical Discussion / 1:1 / Stakeholder)

---

## 🎯 Agenda & Objectives

- 
- 
- 

---

## 🧠 Discussion Summary

> *Summarize key points discussed, technical blockers, decisions made*

- 
- 
- 

---

## ✅ Decisions Made

- [ ] Decision 1
- [ ] Decision 2

---

## 🛠️ Action Items

| Task | Owner | Due Date | Status |
| ---- | ----- | -------- | ------ |
|      |       |          |        |
|      |       |          | ☐      |

---

## 🔁 Follow-ups / Next Steps

- 
- 
- 

---

## 📎 Attachments / References

- 
