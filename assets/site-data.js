export const STORAGE_KEY = 'truthlens-posts-v1';

export const CATEGORIES = {
  technology: {
    name: 'Technology',
    description:
      'The bleeding edge of innovation, AI, and digital transformation.',
    tone: 'gold'
  },
  'wars-history': {
    name: 'Wars & History',
    description:
      'Analyzing the conflicts and historical events that shaped our modern world.',
    tone: 'red'
  },
  'current-affairs': {
    name: 'Current Affairs',
    description:
      'In-depth analysis of global politics, economics, and societal shifts.',
    tone: 'blue'
  }
};

const sampleContent = `
<p>The landscape of our modern world is shifting at an unprecedented pace. What we once considered science fiction is rapidly becoming our daily reality, while historical echoes continue to shape our geopolitical boundaries.</p>

<h2>The Catalyst of Change</h2>
<p>Experts argue that the next decade will see more transformation than the entire previous century. This isn't just about new gadgets; it's about a fundamental restructuring of how society operates, communicates, and governs itself.</p>

<blockquote>"We are not just observing history; we are actively writing its most volatile chapter." - Dr. Aris Thorne, Global Strategy Institute</blockquote>

<p>Consider the implications of decentralized systems meeting traditional power structures. The friction between these two paradigms is creating sparks across every sector, from finance to international relations.</p>

<h3>Looking Ahead</h3>
<p>As we navigate these turbulent waters, the need for clear, unbiased, and deep-reaching journalism has never been greater. We must look beyond the headlines to understand the undercurrents driving global events.</p>

<ul>
  <li><strong>Adaptability:</strong> The primary survival trait for modern institutions.</li>
  <li><strong>Foresight:</strong> Anticipating the second and third-order effects of technological leaps.</li>
  <li><strong>Context:</strong> Understanding that no event occurs in a vacuum.</li>
</ul>

<p>In conclusion, the path forward requires a delicate balance of embracing innovation while respecting the profound lessons of our shared history. Only through this dual lens can we hope to make sense of the chaos.</p>
`;

export const INITIAL_POSTS = [];

export function loadPosts() {
  return [];
}

export function persistPosts(posts) {
  // Persistence is now purely dynamic via API calls; local storage is deprecated.
}

export function estimateReadTime(content) {
  const plainText = content.replace(/<[^>]*>/g, ' ').trim();
  return Math.max(1, Math.ceil(plainText.length / 1000));
}

export function createPost(draft) {
  const preparedContent = draft.content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');

  return {
    id: `post-${Date.now()}`,
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    content: preparedContent,
    category: draft.category,
    imageUrl:
      draft.imageUrl.trim() ||
      `https://picsum.photos/seed/${Date.now().toString(36)}/800/500`,
    author: 'Veerapandi',
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    readTime: estimateReadTime(preparedContent)
  };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
