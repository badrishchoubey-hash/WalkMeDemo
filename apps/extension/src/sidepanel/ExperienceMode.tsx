import { useEffect, useState } from 'react';
import { PORTAL_ORIGIN, portalUrl } from '../../../../packages/shared/config';

type Mode = 'user' | 'developer';
const readMode = (): Mode =>
  location.hash === '#developer' ? 'developer' : 'user';

export function ExperienceMode({ developer }: { developer: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => {
    const update = () => setMode(readMode());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const local = ['127.0.0.1', 'localhost'].includes(
    new URL(PORTAL_ORIGIN).hostname,
  );
  return (
    <>
      <nav className="experience-mode" aria-label="Experience mode">
        <strong>Choose experience</strong>
        <div
          className="mode-buttons"
          role="group"
          aria-label="Choose experience"
        >
          {(['user', 'developer'] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              onClick={() => {
                location.hash = value;
                setMode(value);
              }}
            >
              {value === 'user' ? 'User' : 'Developer'}
            </button>
          ))}
        </div>
      </nav>
      {mode === 'developer' && (
        <p className="mode-note">Save your draft before switching to User.</p>
      )}
      {mode === 'developer' ? (
        developer
      ) : (
        <main>
          <section className="admin-workspace" aria-label="User experience">
            <span className="section-label">USER EXPERIENCE</span>
            <h1>Get guidance on your portal</h1>
            <p>
              Open the portal, then use its floating ? button for walkthroughs
              and tips.
            </p>
            <p>
              <strong>
                {local ? 'Local development portal' : 'Hosted portal'}:
              </strong>{' '}
              {PORTAL_ORIGIN}
            </p>
            <a href={portalUrl()} target="_blank" rel="noreferrer">
              Open user experience ↗
            </a>
            <p>
              Use Developer above to create, edit, preview, and publish
              workflows in this browser.
            </p>
            <details>
              <summary>Run with the local portal</summary>
              <p>
                From the windchill-smartguide project folder, start the portal
                in one terminal:
              </p>
              <pre>
                <code>npm run dev</code>
              </pre>
              <p>
                In another terminal, build the extension for the local portal:
              </p>
              <pre>
                <code>npm run build:extension</code>
              </pre>
              <p>
                In chrome://extensions or edge://extensions, load the project's
                dist/extension folder (or reload it if already loaded). Use Open
                user experience in the local build to open your website, refresh
                it, then click ? for guidance.
              </p>
              <p>
                To return to the hosted portal, run npm run
                build:extension:production, reload the extension, and refresh
                the hosted portal. The mode switch changes the interface; it
                does not change which website the installed build supports.
              </p>
            </details>
          </section>
        </main>
      )}
    </>
  );
}
