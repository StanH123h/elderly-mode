# ElderSurf 🏄‍♂️👴

**Making the web accessible for the elderly, one click at a time.**

ElderSurf is a **smart bookmarklet** designed to help elderly users when they feel lost or confused on a complex webpage. Instead of restructuring the entire web, ElderSurf acts as an **"On-demand Logic Extractor"**.

When a user is confused, they simply click the bookmarklet. ElderSurf instantly analyzes the page and extracts the **key interactive logic** (Search bars, Login forms, Action buttons) into a clear, large, and easy-to-use side panel.

> "I don't need a new internet. I just need to find the search bar."

## What it does
By simply clicking a bookmarklet in their browser, our custom script (`main.js`) instantly injects into the current webpage and transforms the interface into a clean, high-contrast **Split-Screen Mode**:

* **The Left Pane (The "View" Zone):** This area preserves the **entire original website**, ensuring you don't miss any context, layout, or visual details. It's the full browsing experience you're used to.
* **The Right Pane (The "Action" Zone):** This area isolates the interactive JavaScript behaviors and control elements. Here, the user finds simplified buttons for critical actions like **Search**, **Login**, **Submit**, or **Buy**. Interactions here are automatically synchronized with the main site on the left.

**ElderSurf** effectively untangles the "Structure" from the "Behavior." It is designed to work on the high-traffic sites seniors visit most, such as:
* **News Portals** (reading articles on the left, searching archives on the right).
* **Healthcare & Utility Sites** (reviewing bill details on the left, clicking "Pay" on the right).
* **Social Media** (viewing family photos on the left, liking/commenting on the right).

It requires no heavy installation—just a single click to ride the web with ease.

## Tool

Bookmarklet:
`javascript:(function()%7Bvar s=document.createElement('script');s.src='https://stanh123h.github.io/elderly-mode/main.js';document.body.appendChild(s);%7D)();`