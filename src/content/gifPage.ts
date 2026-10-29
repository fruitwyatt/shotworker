import { MAX_FRAMES, MAX_SIDE } from '../worker/protocol';
import type { PageContent } from './types';

export const gifPage: PageContent = {
  path: '/',
  title: 'GIF Background Remover — Free Transparent GIF & APNG | ShotWorker',
  description:
    'Free GIF background remover. Remove the background from animated GIFs and download a transparent GIF, APNG or WebP. Runs on your device — private, no signup, no watermark.',
  h1: 'GIF Background Remover',
  sub: 'Remove the background from any animated GIF and download a transparent GIF, APNG or WebP — free, private and right here on this page.',
  limits: `Free: GIF up to 8 MB · up to ${MAX_FRAMES} frames · longest side ${MAX_SIDE}px (resized automatically)`,
  breadcrumbs: [],
  app: {
    name: 'ShotWorker GIF Background Remover',
    description:
      'Remove the background from animated GIFs and export transparent APNG, transparent GIF, animated WebP or a solid-color GIF. Processing runs on your device.',
    features: [
      'Removes the background from every frame of an animated GIF',
      'Transparent APNG export with soft edges',
      'Transparent GIF export',
      'Animated WebP export',
      'Solid-color background GIF with a color picker',
      'Keeps original frame order and timing',
      'Runs on your device — files are never uploaded',
    ],
  },
  sections: [
    {
      kind: 'text',
      id: 'what-it-does',
      h2: 'Remove the background from an animated GIF in seconds',
      paragraphs: [
        'ShotWorker finds the main subject in every frame of your GIF, removes everything behind it and rebuilds the animation with a transparent background. Frame order and timing stay exactly as they were, so the motion looks the same — just without the backdrop.',
        'There is nothing to install and no account to create. Drop a GIF into the box above, wait a few seconds, preview the result next to the original and download the format you need.',
      ],
      bullets: [
        'Works on product spins, unboxing loops, reaction GIFs, stickers and logo animations',
        'Soft, natural edges around hair, fabric, shadows and packaging',
        'Side-by-side preview on a checkerboard so you can see real transparency',
      ],
    },
    {
      kind: 'examples',
      id: 'before-after',
      h2: 'Before and after',
      intro:
        'A short product animation on a busy studio backdrop, and the same animation after the background is removed. The checkerboard shows the transparent areas.',
      examples: [
        {
          before: '/examples/gif-before.gif',
          after: '/examples/gif-after.png',
          beforeAlt: 'Animated product GIF with a striped studio background',
          afterAlt: 'The same animated product with a transparent background',
          caption: 'Illustrative sample: animated GIF in, transparent APNG out.',
        },
      ],
    },
    {
      kind: 'steps',
      id: 'how-it-works',
      h2: 'How to remove the background from a GIF',
      intro: 'Three steps, all on this page:',
      steps: [
        {
          name: 'Drop your GIF',
          text: 'Drag an animated GIF into the upload box or click to choose a file. It stays on your device.',
        },
        {
          name: 'Let ShotWorker clear the background',
          text: 'Every frame is processed automatically and you can follow the progress frame by frame.',
        },
        {
          name: 'Preview and download',
          text: 'Compare the result with the original, pick transparent APNG, GIF, WebP or a solid color, and download.',
        },
      ],
    },
    {
      kind: 'text',
      id: 'who-its-for',
      h2: 'Built for ecommerce and product animations',
      paragraphs: [
        'Animated product shots grab attention on store pages, in ads and in email — but only if they blend into the page. A transparent GIF sits cleanly on any background color or theme.',
      ],
      bullets: [
        'Online stores: put spinning or looping product shots on any page color',
        'Marketplace sellers: reuse one animation across listings and banners',
        'Social media and ads: drop animated cutouts onto branded backgrounds',
        'Email marketing: match the animation to your template instead of a white box',
        'Creators: turn clips into stickers, overlays and emotes',
      ],
    },
    {
      kind: 'text',
      id: 'formats',
      h2: 'Export formats: transparent GIF, APNG and WebP',
      paragraphs: [
        'Each result is available in four formats, so you can choose between maximum compatibility and maximum quality.',
      ],
      bullets: [
        'Transparent APNG — best quality with smooth, soft edges; plays in all modern browsers',
        'Transparent GIF — the classic format; edges are either fully visible or fully transparent, so soft details can look slightly jagged',
        'Animated WebP — small files with soft edges, ideal for websites',
        'Color background GIF — an opaque GIF on any solid color you pick, for places that do not support transparency',
      ],
    },
    {
      kind: 'text',
      id: 'privacy',
      h2: 'Private by design: your GIFs stay on your device',
      paragraphs: [
        'Your GIF is processed on your own device. It is never uploaded to our servers, never stored and never seen by anyone else. Close the tab and it is gone.',
        'The first GIF may take a moment while the tool prepares; later runs are faster.',
      ],
    },
    {
      kind: 'text',
      id: 'limits',
      h2: 'Free plan limits',
      paragraphs: [
        'The GIF background remover is free with no signup and no watermark. To keep it fast on laptops and phones, a few fair-use limits apply:',
      ],
      bullets: [
        'File size up to 8 MB',
        `Up to ${MAX_FRAMES} frames — longer GIFs are trimmed to the first ${MAX_FRAMES} frames with a notice`,
        `Longest side up to ${MAX_SIDE}px — larger GIFs are resized automatically, never rejected`,
      ],
    },
    {
      kind: 'text',
      id: 'tips',
      h2: 'Tips for the cleanest transparent GIF',
      paragraphs: [],
      bullets: [
        'Use GIFs where the subject clearly stands out from the background',
        'Keep the subject fully in frame — cropped edges stay cropped',
        'Choose APNG or WebP when soft edges, hair or shadows matter',
        'Choose transparent GIF when a tool or platform only accepts .gif files',
        'If your GIF already has transparency, ShotWorker keeps the original transparent areas',
      ],
    },
    {
      kind: 'related',
      id: 'related',
      h2: 'Need a still image instead?',
      paragraphs: [
        'For single product photos, use the ShotWorker Background Remover. It turns a JPG, PNG or WebP photo into a transparent PNG or a clean solid-color image — same privacy, same no-signup workflow.',
      ],
      link: { to: '/background-remover', label: 'Open the Background Remover for product photos' },
    },
  ],
  faqTitle: 'GIF background remover FAQ',
  faq: [
    {
      q: 'How do I remove the background from a GIF?',
      a: 'Drop your animated GIF into the upload box at the top of this page. ShotWorker removes the background from every frame and shows a preview next to the original. Then download a transparent APNG, transparent GIF, animated WebP or a solid-color GIF.',
    },
    {
      q: 'Is the GIF background remover free?',
      a: `Yes. It is free with no signup and no watermark. Fair-use limits apply: files up to 8 MB, up to ${MAX_FRAMES} frames and ${MAX_SIDE}px on the longest side.`,
    },
    {
      q: 'Are my GIFs uploaded to a server?',
      a: 'No. Your GIF is processed on your own device and never leaves it. Nothing is uploaded or stored on our servers.',
    },
    {
      q: 'Should I download APNG or transparent GIF?',
      a: 'Choose APNG for the best quality: it keeps soft, smooth edges and plays in all modern browsers. Transparent GIF can only make each pixel fully visible or fully transparent, so soft edges such as hair or shadows can look jagged. Use GIF when a platform only accepts .gif files.',
    },
    {
      q: 'Does it keep the animation speed and frame order?',
      a: 'Yes. Every frame keeps its original position and timing, so the animation plays at the same speed as your original GIF.',
    },
    {
      q: 'Can I put the animation on a solid color instead of transparency?',
      a: 'Yes. Open the Color Background tab after processing, pick any color, and download an opaque GIF on that color.',
    },
    {
      q: 'Why does the first GIF take a little longer?',
      a: 'The first use may take a moment to prepare. Later runs are faster.',
    },
    {
      q: 'Does it work on my phone?',
      a: 'Yes. ShotWorker works in modern mobile browsers. Short GIFs process fastest on phones.',
    },
  ],
};
