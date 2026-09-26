# RSVP Card

An INST630 JavaScript exercise built from the supplied Tutorial 4 starter files. The card responds to a person's attendance choice, name, and guest count without reloading the page.

## Run it

Open `tutorial_4_files/index.html` in a browser, or open the folder in VS Code and use Live Server. There are no packages to install or build steps.

For a local server, run this from the repository folder:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/tutorial_4_files/`.

## What it does

- Going and Can't make it are mutually exclusive. Neither is selected initially.
- Going reveals the guest field and a confirmation. Can't make it hides the guest field and shows a regret message.
- Messages update as the name or guest count changes.
- Blank names use the starter's Someone fallback.
- Guest counts use separate wording for zero, one, and multiple guests.
- The party total adds one for the person responding. It is not an event attendance total.
- Empty, negative, fractional, and over-limit guest counts show an error. The card does not confirm an invalid count.
- Switching choices preserves the name and guest count. Reloading starts over.

This is a practice card. Responses are not sent, stored, or shared with an event organizer. The event details are retained from the supplied starter.

## Files

| File | Purpose |
| --- | --- |
| `tutorial_4_files/index.html` | Card structure, labels, feedback, and original assignment tasks |
| `tutorial_4_files/style.css` | Layout, button states, responsive rules, and focus indicators |
| `tutorial_4_files/script.js` | Attendance state, messages, validation, and event listeners |

The first commit preserves the starter files. Later commits implement the interactions, improve usability, and document the finished exercise.

## JavaScript concepts

| Requirement | Implementation |
| --- | --- |
| Select DOM elements | `document.querySelector()` stores references to the card controls |
| Respond to clicks | Named handlers registered with `addEventListener('click', ...)` select attendance |
| Respond to typing | `input` listeners refresh the selected response |
| Change styling | `classList.add()`, `remove()`, and `toggle()` control active and hidden states |
| Change displayed text | `textContent` inserts messages as text, including user input |
| Read input | `.value` reads the name and guest fields |
| Boolean | `isGoing` and `isNotGoing` track the selected choice |
| String | The trimmed name and template literals build each message |
| Number | `Number(guestInput.value)` converts the input before comparison and addition |

Both booleans are retained to match the exercise. The click handlers set them together so only one can be true. Both are false before a response and after a reset.

In the browser console, `checkStatus()` returns the current values and data types. `resetCard()` clears the card. These helpers do not run automatically or send data anywhere.

## Design choices

The supplied layout and task panel remain recognizable. The main changes support completing and checking the interaction:

- The guest field appears only after Going. This applies progressive disclosure: show the next relevant control when it is needed.
- Zero is the default guest count, so a person attending alone does not need to change it.
- A nearby hint states the guest range, and errors explain how to correct invalid entries.
- Button state is exposed through `aria-pressed`. A status region contains the response, and keyboard focus has a visible outline.
- At narrow widths, the buttons stack and the card stops sticking to the top of the screen.

These choices draw on *Designing Interfaces: Patterns for Effective Interaction Design*, 3rd edition, by Jenifer Tidwell, Charles Brewer, and Aynne Valencia: Chapter 4, Progressive Disclosure, and Chapter 10, Good Defaults and Smart Prefills, Input Hints, and Error Messages. The supplied PDF's page 168 discusses revealing steps progressively; page 795 explains the purpose of reasonable defaults. These are PDF page positions, not printed page numbers.

## Check the behavior

1. Load the page. Neither button should be active, and the guest field should be hidden.
2. Enter a name and choose Going. Check the name appears in the confirmation.
3. Try guest counts 0, 1, 3, and 10. Check the wording and party total.
4. Try an empty count, -1, 1.5, and 11. An error should replace the confirmation.
5. Enter a valid count again. The error should clear.
6. Choose Can't make it. Only that button should be active; the guest field should disappear.
7. Change the name. The regret message should update immediately.
8. Clear the name or enter only spaces. The message should use Someone.
9. Use Tab, Enter, and Space to choose responses without a mouse.
10. Run `resetCard()` in the console. Inputs, messages, and selected states should clear.

Automated Chrome checks passed for these interactions, state and input types, literal display of markup in names, preserved guest counts, and reload behavior. Layout checks passed without horizontal overflow at 320, 375, 480, 768, 1024, and 1440 pixels, including 200% text at 320 pixels. Desktop and mobile screenshots were inspected. Forced color selection styling, the notice shown when JavaScript is disabled, and the browser console were also checked.

JavaScript syntax and Git whitespace checks passed. These checks do not establish Safari, Firefox, or VoiceOver behavior; those have not been tested.

## GitHub Pages

When this repository is published, configure Pages to deploy from `main` and `/ (root)`. The card's path is `tutorial_4_files/`. Submit the live card URL after checking the Pages deployment, rather than a GitHub source file URL.

## Starter source

The HTML, CSS, task wording, event details, and initial JavaScript scaffold come from the course's `tutorial_4_files.zip`. The completed behavior and usability changes build on those materials. The assignment also links to the [in-class CodePen demo](https://codepen.io/Alex-Leitch/pen/MYjWxdZ).
