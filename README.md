# ElderSurf

## What it does
**ElderSurf** is a lightweight, one-click accessibility tool that radically simplifies web browsing for seniors.

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