# Dash Platform Architecture Map

An interactive, source-linked page within the DashHQ Platform door: Tenderdash, Drive, GroveDB proofs, DAPI, SDKs and client-side verification.

GitHub Pages serves the static files without a build step or backend. `architecture.css` uses the family tokens in light and dark. `architecture.js` draws the connections and opens the component drawer. The drawer supports Escape, trapped keyboard focus, related-component navigation and focus restoration; the page behind it is inert while open.

The pinned family bar, footer, Archivo font and mark are self-hosted under `dashhq/`. See `SHELL.md` for the version and checksum. The shell resolves the live Radar and Radar Explorer links (`data-family`) through `dashhq.href()`. There are no third-party font or asset requests, and scripts/styles use a first-party CSP.

On phones the map becomes a vertical component list; component details still open with one tap. Source links lead to the relevant Dash repositories.

Local checks: `node --check architecture.js` and the static copy build. There is no package-managed test, lint or typecheck suite. In the family lab, use `../../lab/build.sh arch` and the guarded screenshot runner from the lab root.
