# Timothy Darcy — portfolio website

A static, dependency-free HTML / CSS / JavaScript website, designed to open locally on your laptop and be uploaded to GitHub Pages.

## Open it

1. Unzip the folder, preserving its internal structure.
2. Double-click `index.html` to open in your web browser.
3. If you use VS Code, you can alternatively open the folder and run it with Live Server.
4. Every project card links to its own page, including Money Doors.

## To add this to the GitHub repository you already have

**Back up your current repository folder first.** Copy the files from this ZIP into the root of the existing website repository. Don't replace your whole repository folder and don't delete the `.git` folder. Preserve any original images, videos and audio in your existing repository folders. Inspect the changes in GitHub Desktop, commit, then push.

## Missing media

The chat upload only supplied the project cover artwork (three thumbnail PNGs and Sidekick PNG) plus source HTML/CSS/JS. The old project HTML referenced video, audio and gallery images which were not uploaded, so the ZIP cannot include them. All their original file paths remain referenced in the project pages. The site itself loads even when those files are missing; media areas show placeholders.

Keep/copy the media from your existing repository as follows:

- `images/` — original in-game screenshots (as referenced by the project HTML files)
- `videos/` — original project trailers, e.g. `videos/project4-video.mp4`
- `audio/` — original audio previews, e.g. `audio/project4-maintheme.wav`

**Filename capitalization matters on GitHub Pages.** Existing screenshot paths use `.PNG` in several places. Match those names exactly.

## Add your portrait later

The homepage has an empty `.portrait-slot` in `index.html`. To insert your photo, put an image in `images/profile.jpg`, then replace:

`<div class="portrait-slot" role="img" aria-label="Empty space reserved for your portrait"></div>`

with:

`<div class="portrait-slot"><img src="images/profile.jpg" alt="Portrait of Timothy Darcy"></div>`

No portrait was generated or included.

## Money Doors

- `money-doors.html` is a complete new page and its homepage card is clickable.
- No game artwork was created; there are intentional placeholder areas for a trailer and scenes/process.
- Overview and contributions are provisional starter copy. Edit them once the final game description and roles are confirmed.
- To add media, follow the HTML structure used by `project4.html`.

## Styling and performance

- Styles: `styles/style.css`; behaviors: `scripts/main.js`.
- All design uses system fonts (Arial / Helvetica), so no font downloads are required.
- The four original cover images are copied unchanged.
- The soft background drifts via a small CSS animation; no mouse tracking or JavaScript animation loops.
- Normal operating-system cursor, reduced-motion support, keyboard-operable tabs, image pop-up, slide-up navigation.
- Page transitions use a progressive enhancement and may vary between `file://` and GitHub Pages. Everything remains navigable if the animation isn't available.

## Site structure

```
index.html
project4.html       Dad's Day Out
project5.html       Demure
project6.html       IceAge
project7.html       Sidekick
money-doors.html    Money Doors
styles/style.css
styles/images/project4-thumb.png
styles/images/project5-thumb.png
styles/images/project6-thumb.png
scripts/main.js
images/Sidekick.png
images/             Add your other screenshots & portrait here
videos/             Add your original trailers here
audio/              Add your original tracks here
```
