import { usePageMeta } from '../lib/meta';

export default function Privacy() {
  usePageMeta(
    'Privacy',
    'ShotWorker processes images entirely in your browser. Learn what we collect — spoiler: your files never leave your device.',
  );

  return (
    <div className="wrap wrap-narrow page-prose">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: October 2026</p>

      <h2>Your files never leave your device</h2>
      <p>
        ShotWorker tools run the AI model directly in your browser. Images and GIFs you
        process are decoded, matted and encoded locally — they are <strong>never uploaded
        to our servers</strong> for inference or storage. Closing the tab discards them.
      </p>

      <h2>What gets downloaded to your device</h2>
      <p>
        On first use, the matting model (~94 MB) is fetched from a public model CDN and
        cached by your browser so later runs start instantly. This request contains only
        the model URL — none of your files.
      </p>

      <h2>Analytics</h2>
      <p>
        If enabled, we collect anonymous usage events (e.g. that a tool was used, whether
        processing succeeded or failed, file size) to improve the product. We never
        receive your images or their contents. No account, email or payment information
        is collected because the service has none.
      </p>

      <h2>Cookies &amp; storage</h2>
      <p>
        The site uses browser storage only for the model cache and (optionally) an
        analytics identifier. There are no advertising trackers.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:hello@shotworker.com">hello@shotworker.com</a>.
      </p>
    </div>
  );
}
