# Secret Santa

A simple Secret Santa name picker that runs entirely in the browser. You can host it for free on GitHub Pages.

## How it works

1. The organiser opens the site, names the group, adds everyone and sets any rules (pairs who can't pick each other).
2. **Draw names** gives a private link for each person.
3. Each person opens their link, spins the wheel and finds out who they're buying for.

There's no server or database. Each link carries its own result, scrambled so it can't be read by looking at the link. The data sits after the `#` in the URL, so it's never sent to GitHub. The setup is saved in the organiser's browser, so it survives a page refresh.

**Things to know**

- The organiser sees the links but not who got whom. If you're taking part too, don't open other people's links.
- The scrambling stops anyone reading a link at a glance. It isn't encryption, so a determined techie could decode their link.
- Links don't expire. Someone can open theirs again if they forget.
- If you draw again, old links still show the **old** result, so send everyone their new link.

## Run it locally

The scripts are ES modules, so serve the folder rather than opening the file directly:

```sh
python3 -m http.server
```

Then open http://localhost:8000.

## Put it on GitHub Pages

1. Create a new repository on GitHub, e.g. `secret-santa`.
2. Push this folder to it:
   ```sh
   git init
   git add .
   git commit -m "Secret Santa app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/secret-santa.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then pick `main` and `/ (root)`, and save.
4. After a minute or so the site is live at `https://<your-username>.github.io/secret-santa/`.

Run the draw from the live site, not from localhost, so the links point to the public address.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `js/organiser.js` | Organiser page |
| `reveal.html`, `js/reveal.js` | The page each person opens |
| `js/wheel.js` | Spinning wheel |
| `js/draw.js` | Draw that follows the rules |
| `js/link.js` | Turns results into links and back |
| `css/style.css` | Styling |
