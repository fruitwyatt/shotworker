import { usePageMeta } from '../lib/meta';
import { privacyMeta } from '../content/meta';

export default function Privacy() {
  usePageMeta(privacyMeta.title, privacyMeta.description);

  return (
    <div className="wrap wrap-narrow page-prose">
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: October 2026</p>

      <h2>Your files never leave your device</h2>
      <p>
        ShotWorker tools process your images and GIFs on your own device, inside your
        browser. Your files are read, processed and saved locally — they are{' '}
        <strong>never uploaded to our servers</strong> and never stored by us. Closing the
        tab discards them.
      </p>

      <h2>First use</h2>
      <p>
        The first time you use a tool, your browser fetches the files the tool needs to run
        on your device from public content delivery networks. This may take a moment; later runs are faster. These requests never
        include your images, GIFs or anything about them.
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
        The site uses browser storage only to keep the tool files on your device for faster
        later runs and (optionally) an anonymous analytics identifier. There are no
        advertising trackers.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:hello@shotworker.com">hello@shotworker.com</a>.
      </p>
    </div>
  );
}
