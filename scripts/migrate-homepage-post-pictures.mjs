import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TARGETS = [
  path.join(ROOT, 'src', 'public_html', 'index.html'),
  path.join(ROOT, 'index.html'),
];

const SIZES = '(min-width: 901px) 338px, (min-width: 681px) 418px, 84vw';
const WIDTHS = [280, 340, 420, 680];

function widthLadder(base, ext) {
  return WIDTHS.map((w) => `${base}-${w}w.${ext} ${w}w`).join(',\n            ');
}

function postPicture(slug, alt) {
  const base = `/images/blog/${slug}`;
  return `<picture>
            <source
              type="image/avif"
              srcset="
            ${widthLadder(base, 'avif')}
              "
              sizes="${SIZES}">
            <source
              type="image/webp"
              srcset="
            ${widthLadder(base, 'webp')}
              "
              sizes="${SIZES}">
            <img
              src="${base}-340w.jpg"
              srcset="
            ${widthLadder(base, 'jpg')}
              "
              sizes="${SIZES}"
              width="338"
              height="225"
              alt="${alt}"
              loading="lazy"
              decoding="async">
          </picture>`;
}

const POSTS = [
  {
    href: '/post/gold-coast-theme-park-accommodation-guide-stay-smart-save-big/',
    aria: 'Read: Gold Coast Theme Park Accommodation Guide — Stay Smart, Save Big',
    slug: 'warner-bros-movie-world-gold-coast-attraction-burleigh-motel-accommodation',
    alt: 'Warner Bros. Movie World Gold Coast theme park entrance',
    cat: 'Theme Parks',
    title: 'Gold Coast Theme Park Accommodation Guide',
    excerpt: 'How to stay close to Movie World, Sea World and Wet&apos;n&apos;Wild without paying theme park hotel prices. The practical comparison.',
    readMore: 'Read the guide →',
  },
  {
    href: '/post/why-burleigh-best-place-stay-gold-coast/',
    aria: 'Read: Why Burleigh Heads is the Best Place to Stay on the Gold Coast',
    slug: 'why-burleigh-best-place-stay-gold-coast',
    alt: 'Burleigh Heads beach with surfers and families — Gold Coast skyline in the background',
    cat: 'Stays',
    title: 'Why Burleigh Heads is the Best Place to Stay',
    excerpt: 'Why locals send out-of-town friends here over Surfers and Broadbeach — beach, cafés, and a calmer base.',
    readMore: 'Read the guide →',
  },
  {
    href: '/post/best-gold-coast-beaches-surf-guide/',
    aria: 'Read: Best Gold Coast Beaches — Surfer&apos;s Guide',
    slug: 'best-gold-coast-beaches-surf-guide',
    alt: 'Surfers at Burleigh Heads headland at golden hour with the Gold Coast skyline behind',
    cat: 'Weekends',
    title: 'Best Gold Coast Beaches — Surfer&apos;s Guide',
    excerpt: 'Kirra, Burleigh headland, Broadbeach and Tallebudgera — distances from the motel included.',
    readMore: 'Read the guide →',
  },
];

function postCard(post) {
  return `      <article class="post-card card-stretched-host">
        <a href="${post.href}" class="card-link" aria-label="${post.aria}"></a>
        <div class="post-img">
          ${postPicture(post.slug, post.alt)}
        </div>
        <div class="post-body">
          <div class="post-cat">${post.cat}</div>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <span class="post-read-more" aria-hidden="true">${post.readMore}</span>
        </div>
      </article>`;
}

const postsGrid = `    <div class="posts-grid">
${POSTS.map(postCard).join('\n')}
    </div>`;

for (const file of TARGETS) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(
    /<div class="posts-grid">[\s\S]*?<\/div>\s*<p class="swipe-hint"/,
    `${postsGrid}\n    <p class="swipe-hint"`,
  );
  fs.writeFileSync(file, html, 'utf8');
  console.log('Updated', file);
}
