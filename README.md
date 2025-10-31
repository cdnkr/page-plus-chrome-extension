## Page+

Analyze, extract, and act on any web page instantly - with privacy built in, zero context switching, and seamless on-device intelligence.

### Test Locally (Load Unpacked)
1. Clone repo: `https://github.com/cdnkr/page-plus-chrome-extension`
2. Navigate to the project directory
3. Run `npm i` in the project root
4. Run `npm run build` in the project root
5. Open `chrome://extensions/` in Google Chrome
6. Enable "Developer mode"
7. Click "Load unpacked" and select the `./build` folder in the project
8. Page+ will now be available as an extension on any web page—click the extension icon to open the sidebar

### Notes
- The build step outputs the extension assets into the `build/` directory (including `manifest.json`, `content.js`, `background.js`, and the sidebar HTML).
- After making changes, re-run `npm run build` and refresh the extension on `chrome://extensions/`.