<%*
let Name = await tp.system.prompt("Name of the person")

let relationship = await tp.system.prompt( "Relationship (friend / family / partner / other)")
const slug = Name.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")      // remove non-alphanumeric characters
  .trim()
  .replace(/\s+/g, "-")              // replace spaces with dashes

let zone = await tp.system.suggester(["Hot", "Warm","Cold"], ["Hot", "Warm","Cold"], false, "Select zone")
let last_ping= tp.date.now("YYYY-MM-DD") 
let ping_interval_days = await tp.system.prompt("Ping interval (days)", "14")
let energy_cost = await tp.system.suggester(["Low", "Medium","High"],["Low", "Medium","High"], false, "Select energy cost")
await tp.file.rename(slug)

%>---
relationship: <% relationship %>
zone: <% zone %>
last_ping: <% last_ping %>
ping_interval_days: <% ping_interval_days %>
energy_cost: <% energy_cost %>
---

# <% Name %>

## Snapshot
- Relationship: <% relationship %>
- Zone: <% zone %>
- How we usually interact:
- Energy cost: <% energy_cost %>
- Effort expectation:

## Last Ping
- Date: <% last_ping %>
- Type:
- Context:

## Connected People
- 
## Notes
- 