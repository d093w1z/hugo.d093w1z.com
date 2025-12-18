<%* 
    // Prompt for the title 
    const title = await tp.system.prompt('Enter book name', null, false);
    const author = await tp.system.prompt('Enter book author');
    
    // Rename the file to the entered title 
    await tp.file.rename(title + " — " + author);
    
%>---
aliases:
  - <% title %>
tags:
  - book/review
  - military
  - strategy
  - leadership
type: book-review
title: <% title %>
author: <% author %>
reviewed_by: d093w1z
date_read: <% tp.date.now("YYYY-MM-DD") %>
rating: ⭐️⭐️⭐️⭐️☆
---
# 📘 Book Information

- **Title**: <% title %>
- **Author**: <% author %>
- **Publisher**: 
- **Year Published**: 
- **Pages**: 
- **ISBN**: 
- **Date Reviewed**: <% tp.date.now("dddd, Do MMMM YYYY") %>

---

# 🧭 Executive Summary

> _Write a 3–4 sentence overview of the book’s purpose, thesis, and value._

---

# 📚 Summary of Key Themes

Use bullet points or headings to organize by chapters or concepts.

- **[Theme or Chapter]**:
  - Summary:
  - Relevance:

---

# 🎯 Critical Evaluation

### ✅ Strengths
- 

### ⚠️ Weaknesses
- 

### ✍️ Style & Clarity
- 

---

# ⚔️ Military Relevance

- **Leadership Lessons**:
  - 
- **Strategic or Tactical Application**:
  - 
- **Modern Operational Value**:
  - 

---

# 📝 Personal Reflection

> What did I personally take away from this book?

---

# 🔚 Final Thoughts

> Recommendation and ideal target reader (e.g., junior officers, command staff, historians).

---

# 📌 Notable Quotes

> "*Quote 1*"
>
> "*Quote 2*"

---

# 🔖 Further Reading

- [ ] related-book-1
- [ ] related-book-2
- [ ] journal-article-or-paper

---

# 📂 Related Links

- [Reading List](Reading%20List)
