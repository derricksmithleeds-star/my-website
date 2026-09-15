# Quality Assurance Checklist

## Purpose

This file defines what Claude must check before saying a task is complete.

Claude must use this file after making changes and before committing or pushing work.

## Visual checks

Claude must check:

- the page matches the approved Figma design
- there is no unwanted horizontal scrolling
- text is not clipped
- text does not overlap
- images are not stretched
- spacing and alignment look correct
- desktop layout is checked
- tablet layout is checked
- mobile layout is checked

## Interaction checks

If the task changes behaviour, Claude must check:

- buttons work
- links work
- menus open and close correctly
- forms work correctly
- hover behaviour works where appropriate
- touch behaviour works on mobile
- keyboard interaction still works
- Escape closes menus or overlays where expected
- scroll animations work in both directions where required
- animations do not block access to content

## Browser checks

Claude must check the website in the browser.

Claude must check:

- browser console for errors
- failed network requests
- broken images
- broken links
- layout problems
- responsive behaviour

Claude must not say a visual task is complete only because the code looks correct.

## Code checks

Where available, Claude must run:

- lint
- type checking
- tests
- production build

Claude must report any failed check.

## Git checks

Before committing:

- run `git status`
- inspect `git diff`
- confirm no secret files are included
- confirm no unrelated files were changed
- use a clear commit message

Before pushing:

- confirm the correct branch is being used
- do not force push
- do not delete remote branches

## Completion rule

Claude may only describe a task as complete when:

1. the requested change has been implemented
2. the relevant visual and interaction checks have passed
3. browser checks have passed
4. required code checks have passed
5. the Git diff has been reviewed

If something has not been checked, Claude must say so clearly.