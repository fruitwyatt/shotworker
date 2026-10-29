import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/meta';
import { notFoundMeta } from '../content/meta';

export default function NotFound() {
  usePageMeta(notFoundMeta.title, notFoundMeta.description);
  return (
    <div className="wrap wrap-narrow page-prose">
      <h1>Page not found</h1>
      <p>This page does not exist. Try one of our free tools:</p>
      <p>
        <Link to="/">GIF Background Remover</Link> ·{' '}
        <Link to="/background-remover">Background Remover for product photos</Link>
      </p>
    </div>
  );
}
