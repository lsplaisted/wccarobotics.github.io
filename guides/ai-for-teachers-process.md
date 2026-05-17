---
layout: page
title: "How This Guide Was Made"
description: "A behind-the-scenes look at the prompts and back-and-forth used to create the AI for Teachers guide with an AI coding agent."
noindex: true
sitemap: false
---

# How This Guide Was Made

*The actual conversation that produced the [AI for Teachers guide](./ai-for-teachers.html), so you can see what "working with an AI agent" looks like in practice.*

This took about **41 minutes** end-to-end, in a single sitting. Total: 7 prompts from me, plus answers to 4 clarifying questions the agent asked. The agent did all the writing, file edits, site build verification, and even caught its own mistakes when I pointed at the older version saved in my browser.

**Tool used:** GitHub Copilot CLI (Claude Opus model), running locally in a terminal with access to my robotics website repo on disk.

---

## The conversation, step by step

### Prompt 1 — The initial ask

> I have a friend who wants to learn how to use AI to help make money. He is a teacher. I think he wants to sell some teaching materials he's made, but I'm not sure.
>
> Probably he could use help setting up a website and marketing, as well as generally using AI to help him.
>
> I'd like to create a guide for him. What could that look like?

**What the agent did:** Proposed an 8-section outline (orientation, picking products, where to sell, building a website, marketing, daily AI toolkit, 30-day plan, appendix) and then asked three clarifying questions before writing anything.

**Clarifying questions the agent asked:**

**1. *"What format would you like the guide in?"***

- ✓ **A single Markdown document (easy to share/print)**
- A PDF-ready document with sections
- A short web page
- A slide deck outline

**2. *"What's his tech comfort level?"***

- ✓ **Beginner-friendly — assume he's new to AI and e-commerce**
- Intermediate — he knows ChatGPT basics
- Mixed — beginner on business/web, comfortable with AI

**3. *"How broad should the scope be?"***

- Selling teaching materials (TPT + own site)
- Broader: selling materials + tutoring/courses + general AI productivity
- Just the website + marketing piece
- ✓ **Cover everything in the outline above**

**Result:** The agent drafted a ~21KB Markdown guide covering all 8 sections and saved it to my session workspace.

---

### Prompt 2 — Adding context

> He's a middle school history teacher.

**What the agent did:** Edited 9 places in the existing draft to make it history-specific — added a note about social studies being a strong, under-served TPT niche; replaced generic worksheet examples with DBQs, one-pagers, stations, and escape rooms; rewrote AI prompts to flag historical accuracy and primary source verification; pointed to the Library of Congress and National Archives as trustworthy source repos; added Charlotte Mason / classical homeschool as a real adjacent market; and called out that "AI hallucinates dates, invents quotes, and fabricates primary sources" as a reputation risk specific to a history seller.

**Key insight:** I didn't have to ask for any of those changes individually. "Middle school history teacher" was enough context for the agent to make a coordinated set of edits across the document.

---

### Prompt 3 — Choosing a delivery format

> What would be a good way to share this with him? I could post it as a gist, or add it as an unlinked page to the robotics site. Generating a PDF would also be an option.

**What the agent did:** Laid out a pros/cons table for the three options, recommended a secret gist + PDF combo, and asked which I wanted.

**The follow-up question:** *"Want me to set up the secret gist and PDF for you?"*

- Yes — create a secret gist and generate a PDF *(the agent's recommendation)*
- Just the secret gist
- Just the PDF
- ✓ **Add it to the robotics site anyway**
- I'll handle it from here

**What happened next:** I overrode the agent's recommendation. It accepted that gracefully and switched gears:

1. Looked at the existing site conventions (`_layouts/default.html`, `_config.yml`, an existing page like `about.md`)
2. Added a small `noindex` hook to the layout so any future "unlisted" page can opt out of search engines
3. Created the page at `/guides/ai-for-teachers.html` with proper front matter
4. Ran `bundle exec jekyll build` to confirm it built cleanly
5. Verified the `noindex` meta tag landed in the rendered HTML

**Key insight:** It didn't just dump the file. It studied the existing patterns first, then added a tiny reusable feature (the `noindex` hook) instead of hardcoding a one-off. Then it tested its own work.

---

### Prompt 4 — Asking the agent for its opinion

> What has made AI super powerful for me is "agents" running locally like Copilot CLI or Claude Code. Is it worth including that or is that maybe too advanced for him?

**What the agent did:** Gave a real opinion — said local agents are overkill for the core "polish worksheets and upload to TPT" workflow, but named four specific places they become genuinely transformative (batch processing, bulk Pinterest pin generation, catalog-wide rewrites, maintaining a self-hosted website). Recommended adding it as a short appendix labeled "skip this for now" rather than scaring the reader away in chapter 1.

**The follow-up question:** *"Want me to add it as a short appendix section?"*

- ✓ **Yes — add a short "Level Up" appendix section**
- Yes — but make it more prominent (full section, not appendix)
- Skip it — keep the guide beginner-only
- Make it a separate "part 2" document for later

**What happened next:** The agent wrote a new section with:
- A "skip this section for now" disclaimer up top
- A comparison table of Claude Code, Copilot CLI, Cursor, and ChatGPT Desktop
- Five concrete teacher-seller examples of agent tasks
- A "when it's worth the setup pain" checklist
- A friendly nudge to *"ask a friend who codes to do the initial setup with you — that's how you got this guide."*

**Key insight:** When you ask an AI agent for its honest opinion, it'll give one. It pushed back gently against my instinct to include everything by suggesting framing that protects the beginner reader.

---

### Prompt 5 — Catching a structural mistake

> Section 9 isn't in the table of contents. And it seems like the appendix should maybe be the last section.

**What the agent did:** Renumbered the sections so Appendix is now #9 and Level Up is now #8, physically moved the Level Up block before the Appendix, updated the TOC, fixed the internal "Sections 1–8" cross-reference to "Sections 1–7," and — while in there — noticed that an earlier edit had accidentally deleted the "Final thought" heading at the very end of the doc and restored it.

**The interesting part:** This took the agent 4–5 tries with PowerShell because of mixed CRLF/LF line endings in the file (an artifact of how earlier edits had been written). It debugged its own scripts, restored from a backup when one attempt corrupted the file, and finally got it right. The whole thing happened without me intervening — I just saw the final "all correct" report.

**Key insight:** A good AI agent doesn't pretend to succeed. It tells you when something went wrong, fixes it, and verifies the fix. Mine literally said *"File got nuked by my buggy script. Restoring from git and trying again — this time with proper error handling."*

---

### Prompt 6 — A correctness check I almost didn't think to ask for

> Here's the old version saved from the browser I had it open in: "C:\Users\Daniel\Downloads\AI for Teachers — A Practical Guide _ WCCA Robotics.html"
>
> Can you make sure you didn't lose anything?

**What the agent did:** Extracted the plaintext from both the old browser-saved HTML and the newly-built HTML, ran a diff, and reported back that all differences were exactly the intended changes (TOC entry added, section order swapped, "Final thought" heading restored) and that the 51-character size difference between the two versions matched the additions precisely.

**Key insight:** This is the kind of verification you can ask for in plain English, and the agent will do it with real tools (a real diff against real bytes) instead of just saying "looks good." That's the difference between chat-AI and agent-AI.

---

### Prompt 7 — The trivia question

> When did I start working on this guide? (I want to know how long it took to create)

**What the agent did:** Queried the session database to find the timestamp of my first message in this conversation (10:54 AM EDT), checked the current time (11:35 AM), and reported the 41-minute elapsed time along with a summary of everything that fit into those 41 minutes.

---

## What this whole exercise illustrates

For anyone reading this who's curious about what "using an AI agent" feels like in 2026:

1. **The agent did the work, not just the advice.** It wrote, edited, debugged, built, verified, and even diffed against a saved backup. I never had to copy-paste anything between a chat window and my files.

2. **I steered, it executed.** Most of my prompts were one to three sentences. The agent asked clarifying questions when my intent was ambiguous, and made independent judgment calls (like adding a reusable `noindex` hook to the layout) when there was a clearly better way.

3. **It told me when it made mistakes.** When a PowerShell script corrupted a file, the agent reported it plainly, restored from backup, and tried a different approach. No hiding, no spin.

4. **Total cost:** about 41 minutes of my time, plus the running cost of the AI model (a few dollars at most for a conversation this size).

If you want to try this yourself, see **Section 8** of the [guide](./ai-for-teachers.html) — but only after you've shipped your first 30+ products. Until then, regular chat AI is plenty.
