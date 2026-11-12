# Install the demonstration extension

1. Download `windchill-extension-demo-VERSION-unpacked.zip` from this project's GitHub Release. Extract it to a folder you will keep.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge.
3. Enable **Developer mode**, choose **Load unpacked**, and select the extracted folder containing `manifest.json` directly.
4. Visit [the demo portal](https://walk-me-demo-silk.vercel.app/) and refresh the tab after installation. Allow site access to this hostname if the browser asks.
5. Acknowledge the demonstration announcement. Use **?** for contextual help. Parts, Documents and Change Requests start their published guidance automatically. Escape cancels guidance.
6. Click the extension toolbar icon to open the User screen. Use the **User / Developer** buttons to choose the portal launcher or developer editor. In Developer, create/edit a workflow, Save draft, then Publish to make it available in this browser. Save your draft before switching modes. This local Publish action does not publish a GitHub release or deploy a website.

## Use the local development portal

From the project folder, run `npm run dev` in one terminal and leave it running. In another terminal run `npm run build:extension`. Load `dist/extension` in Chrome or Edge, or click Reload if that folder is already loaded. Refresh `http://127.0.0.1:5173`.

The extension's User screen and **Open user experience** links use the configured build origin, so this development build opens the local portal. Use the exact `127.0.0.1` address; `localhost` is a different origin. Developer and User are interface modes, independent of the build environment. Neither mode changes host permissions.

To return to the hosted portal, run `npm run build:extension:production`, reload the extension and refresh the hosted site. Build commands replace `dist/extension`; existing loaded files require Reload. A custom local port can be set with `$env:PORTAL_ORIGIN='http://127.0.0.1:5174'` before building, provided the portal is started on that port too.

You do not need Node.js or a local web server. This release supports the specified hosted domain; it does not run on arbitrary websites or actual customer Windchill systems. Keep all authoring content synthetic. The developer editor is a local demonstration interface, not authenticated enterprise administration.

For updates, replace the extracted files with the new release, click Reload on the extension card, and refresh portal tabs. Keep the folder at the same path where possible. To remove the extension, choose Remove and refresh open portal tabs to clear injected UI. Portal demonstration records are stored separately in browser site storage.

If help is missing, confirm you installed the production ZIP, selected the directory containing `manifest.json`, enabled the extension and site access, and refreshed the exact hosted URL. Report the release version and browser version with any issue. Managed browsers may restrict unpacked extensions; your organization's browser policy controls installation.
