<%* 
const today = tp.date.now("YYYY-MM-DD dddd");
const timeNow = tp.date.now("HH:mm");
const timeSpent = await tp.system.prompt("Time spent (e.g., 1h 30m)");
const task = await tp.system.prompt("Task/Feature/Bugfix?");
const file = tp.file.content;

let header = `## ${today}\n\n`;

let entry = `### ${timeNow}\n`
+ `**Time Spent:** ⏱ ${timeSpent}\n\n`
+ `**Task/Feature:** 🛠 ${task}\n\n`
+ `**Context / Reasoning:**\n- \n\n`
+ `**Steps Taken:**\n1. \n2. \n3. \n\n`
+ `**Decisions Made:**\n- \n\n`
+ `**Code / Commands:**\n\`\`\`plaintext\n# Commands, scripts, or snippets\n\`\`\`\n\n`
+ `**Results / Outcomes:**\n- \n\n`
+ `**Next Steps:**\n- \n\n`
+ `**Notes / References:**\n- \n\n`;

// If today's date header already exists, insert below it
if (file.includes(`## ${today}`)) {
    tR += file.replace(`## ${today}`, `## ${today}\n\n${entry}`);
} else {
    // Append today's log at the end
    tR += file + `\n${header}${entry}`;
}
%>
