import { MAX_SIDE } from '../worker/protocol';
import type { PageContent } from './types';

export const imagePage: PageContent = {
  path: '/background-remover',
  title: 'Background Remover — Free Transparent PNG for Product Photos | ShotWorker',
  description:
    'Remove the background from product photos for free. Get a clean transparent PNG or a solid-color background in seconds — runs on your device, private, no signup, no watermark.',
  h1: 'Background Remover for Product Photos',
  sub: 'Upload a product photo and get a clean transparent PNG with soft, natural edges — free, private, no signup.',
  limits: `Free: PNG, JPG, WebP or AVIF up to 8 MB · longest side ${MAX_SIDE}px (resized automatically)`,
  breadcrumbs: [
    { name: 'Home', path: '/' },
    { name: 'Background Remover', path: '/background-remover' },
  ],
  app: {
    name: 'ShotWorker Background Remover',
    description:
      'Remove the background from product photos and download a transparent PNG or a solid-color PNG. Processing runs on your device.',
    features: [
      'Transparent PNG export with soft edges',
      'Solid-color background PNG with a color picker',
      'Accepts PNG, JPG, WebP and AVIF',
      'Keeps detail around fabric, hair, glass and packaging',
      'Runs on your device — photos are never uploaded',
    ],
  },
  sections: [
    {
      kind: 'text',
      id: 'what-it-does',
      h2: 'Remove the background from product photos',
      paragraphs: [
        'ShotWorker detects the product in your photo, removes the background and gives you a transparent PNG you can place on any page, banner or listing template. You can also put the product on a solid color in one click.',
        'Everything happens on this page: drop a photo, compare the result with the original and download — no account, no credits, no watermark.',
      ],
      bullets: [
        'Clean cutouts around fabric, hair, glass and printed packaging',
        'True transparency that looks right on light and dark themes',
        'Before and after preview on a checkerboard',
      ],
    },
    {
      kind: 'examples',
      id: 'before-after',
      h2: 'Before and after',
      intro:
        'A product photographed on a cluttered backdrop, and the same product after the background is removed. The checkerboard shows the transparent areas.',
      examples: [
        {
          before: '/examples/photo-before.png',
          after: '/examples/photo-after.png',
          beforeAlt: 'Product photo on a busy patterned background',
          afterAlt: 'The same product with a transparent background',
          caption: 'Illustrative sample: product photo in, transparent PNG out.',
        },
      ],
    },
    {
      kind: 'steps',
      id: 'how-it-works',
      h2: 'How to remove the background from a product photo',
      intro: 'Three steps, all on this page:',
      steps: [
        {
          name: 'Drop your photo',
          text: 'Drag a PNG, JPG, WebP or AVIF image into the upload box, or click to choose one. It stays on your device.',
        },
        {
          name: 'Let ShotWorker remove the background',
          text: 'The product is separated from the background automatically, usually in a few seconds.',
        },
        {
          name: 'Download your PNG',
          text: 'Download the transparent PNG, or switch to Color Background, pick a color and download that version.',
        },
      ],
    },
    {
      kind: 'text',
      id: 'who-its-for',
      h2: 'Made for online sellers and product listings',
      paragraphs: [
        'Consistent, clean product images make a catalog look professional and help shoppers focus on the product.',
      ],
      bullets: [
        'Online store owners preparing product pages and collections',
        'Marketplace sellers who need plain or white backgrounds',
        'Marketers building ads, banners and social posts',
        'Designers who need a quick cutout to drop into a layout',
        'Small brands shooting products at home without a studio',
      ],
    },
    {
      kind: 'text',
      id: 'formats',
      h2: 'Transparent PNG or solid-color background',
      paragraphs: ['Every result comes in two versions:'],
      bullets: [
        'Transparent PNG — full transparency with soft edges, ready for any background or design tool',
        'Color background PNG — the product on a solid color you choose, such as pure white for listings',
      ],
    },
    {
      kind: 'text',
      id: 'privacy',
      h2: 'Your photos never leave your device',
      paragraphs: [
        'Photos are processed on your own device. They are never uploaded to our servers, never stored and never used for anything else. Close the tab and they are gone.',
        'The first photo may take a moment while the tool prepares; later runs are faster.',
      ],
    },
    {
      kind: 'text',
      id: 'limits',
      h2: 'Free plan limits',
      paragraphs: ['The Background Remover is free with no signup. A few fair-use limits keep it fast on any device:'],
      bullets: [
        'File size up to 8 MB',
        'PNG, JPG, WebP and AVIF images',
        `Longest side up to ${MAX_SIDE}px — larger photos are resized automatically, never rejected`,
      ],
    },
    {
      kind: 'text',
      id: 'tips',
      h2: 'Photo tips for cleaner cutouts',
      paragraphs: [],
      bullets: [
        'Shoot with even lighting so the product edges are clearly visible',
        'Keep the whole product in frame with a little space around it',
        'Avoid backgrounds that are the same color as the product',
        'Use the transparent PNG when you will place the product on your own design',
        'Use a white color background for listings that require one',
      ],
    },
    {
      kind: 'related',
      id: 'related',
      h2: 'Working with animated GIFs?',
      paragraphs: [
        'The ShotWorker GIF Background Remover does the same for animations: it clears the background on every frame and exports a transparent GIF, APNG or WebP.',
      ],
      link: { to: '/', label: 'Open the GIF Background Remover' },
    },
  ],
  faqTitle: 'Background remover FAQ',
  faq: [
    {
      q: 'How do I remove the background from a product photo for free?',
      a: 'Drop a PNG, JPG, WebP or AVIF photo into the upload box at the top of this page. ShotWorker removes the background and shows a preview next to the original. Download the transparent PNG or a version on a solid color.',
    },
    {
      q: 'Is the Background Remover really free?',
      a: `Yes. There is no signup, no credits and no watermark. Fair-use limits apply: files up to 8 MB and up to ${MAX_SIDE}px on the longest side.`,
    },
    {
      q: 'Are my photos uploaded anywhere?',
      a: 'No. Your photos are processed on your own device and never leave it. Nothing is uploaded or stored on our servers.',
    },
    {
      q: 'Is the quality good enough for product listings?',
      a: 'Yes for most product shots. Edges around fabric, hair, glass and packaging are kept soft and natural. Photos with even lighting and a background that contrasts with the product give the cleanest results.',
    },
    {
      q: 'Can I get a white background instead of transparency?',
      a: 'Yes. Open the Color Background tab after processing. White is the default, and you can pick any other color before downloading.',
    },
    {
      q: 'Why is my result smaller than my original photo?',
      a: `The free version works at up to ${MAX_SIDE}px on the longest side so it stays fast on any device. Larger photos are resized automatically.`,
    },
    {
      q: 'Why does the first photo take a little longer?',
      a: 'The first use may take a moment to prepare. Later runs are faster.',
    },
  ],
};
