import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORIES, INITIAL_POSTS } from '../assets/site-data.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const routes = [
  '/',
  '/about/',
  '/terms/',
  '/privacy/',
  '/admin/',
  '/search/',
  '/category/',
  '/post/',
  ...Object.keys(CATEGORIES).map((category) => `/category/${category}/`),
  ...INITIAL_POSTS.map((post) => `/post/${post.id}/`)
];

for (const route of routes) {
  const relativeFile = route === '/' ? 'index.html' : join(route.slice(1), 'index.html');
  const filePath = join(rootDir, relativeFile);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buildPage(route), 'utf8');
}

function buildPage(route) {
  const basePrefix = getBasePrefix(route);

  return `<!doctype html>
<html lang="en" data-base-prefix="${basePrefix}" data-route-path="${route}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Truthlens is a premium editorial publication covering technology, wars and history, and current affairs."
    />
    <title>Truthlens</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${basePrefix}assets/styles.css" />
    <script type="module" src="${basePrefix}assets/app.js"></script>
  </head>
  <body>
    <div class="site-shell">
      <div data-site-header></div>
      <main data-site-main></main>
      <div data-site-footer></div>
    </div>
  </body>
</html>
`;
}

function getBasePrefix(route) {
  if (route === '/') {
    return './';
  }

  const depth = route.split('/').filter(Boolean).length;
  return '../'.repeat(depth);
}
