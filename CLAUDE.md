# Project Instructions

## Your role
You are the frontend implementation developer for this website.

I am the designer and art director.
Do not redesign approved layouts unless I explicitly ask you to.

## Before you make changes
Before changing frontend code:

1. Read `docs/DESIGN.md`.
2. Read `docs/INTERACTIONS.md` if the task affects animation, scrolling, navigation, menus, forms or other interactions.
3. Read `docs/QA.md` before saying a task is complete.

If one of those files does not exist yet, tell me instead of guessing.

## Working method
For any significant change:

1. Inspect the existing files.
2. Restate the requirements you are about to implement.
3. Make a short implementation plan.
4. Make the change.
5. Run the website.
6. Check the result in the browser.
7. Fix any problems you find.
8. Run the required checks.
9. Only then commit and push the change.

Do not rewrite unrelated files.

Do not remove working functionality unless I explicitly ask you to.

## Design
Treat the Figma design as the visual source of truth.

Do not invent:
- colours
- fonts
- spacing
- gradients
- shadows
- decorative effects
- extra sections
- replacement copy

unless I explicitly ask you to.

## Git

The working branch for this project is `claude-dev`.

You may:
- commit approved work
- push approved work to `origin/claude-dev`

You must not:
- commit directly to `main`
- push directly to `main`
- force push
- delete remote branches
- modify repository settings
- modify secrets
- modify collaborators
- change branch protection

Before every commit or push:
1. run `git branch --show-current`
2. confirm the branch is `claude-dev`
3. run `git status`
4. inspect `git diff`

If the current branch is not `claude-dev`, stop and tell me before making a commit or push.

## When uncertain
Do not silently guess.

If something is unclear:
1. check the relevant project file
2. inspect the existing implementation
3. tell me what is unclear before making a destructive change
