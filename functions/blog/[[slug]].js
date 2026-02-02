// Dynamic blog post page
export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug ? params.slug.join('/').replace(/\/$/, '') : null;
  
  if (!slug) {
    return Response.redirect('/blog/', 302);
  }

  // Find post by slug
  const list = await env.PROPERTIES_KV.list({ prefix: 'blog:' });
  let post = null;
  
  for (const key of list.keys) {
    const p = await env.PROPERTIES_KV.get(key.name, 'json');
    if (p && p.slug === slug && p.status === 'published') {
      post = p;
      break;
    }
  }
  
  if (!post) {
    return new Response(generateNotFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response(generatePostPage(post), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Simple markdown to HTML (basic support)
function markdownToHtml(text) {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function generatePostPage(post) {
  const date = new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} - Properties Mazarrón Blog</title>
  <meta name="description" content="${escapeHtml(post.excerpt || post.content?.slice(0, 160))}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a365d; line-height: 1.8; background: #f7fafc; }
    
    .top-bar { background: #1a365d; color: white; padding: 0.5rem 2rem; font-size: 0.875rem; }
    .top-bar-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
    .top-bar a { color: white; text-decoration: none; }
    
    header { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
    .header-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: 700; color: #1a365d; text-decoration: none; }
    .logo span { color: #e53e3e; }
    nav { display: flex; gap: 2rem; }
    nav a { color: #4a5568; text-decoration: none; font-weight: 500; }
    nav a:hover { color: #e53e3e; }
    .mobile-menu { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    
    main { max-width: 800px; margin: 0 auto; padding: 2rem; }
    
    .breadcrumb { margin-bottom: 1.5rem; font-size: 0.9rem; }
    .breadcrumb a { color: #718096; text-decoration: none; }
    .breadcrumb a:hover { color: #e53e3e; }
    
    article { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    
    .featured-image { width: 100%; height: 400px; object-fit: cover; }
    .no-featured { height: 200px; background: linear-gradient(135deg, #1a365d, #2c5282); }
    
    .article-content { padding: 2.5rem; }
    
    .meta { font-size: 0.9rem; color: #718096; margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .category { background: #ebf8ff; color: #2b6cb0; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
    
    h1 { font-size: 2.25rem; margin-bottom: 1.5rem; line-height: 1.3; }
    
    .content { color: #4a5568; }
    .content p { margin-bottom: 1.5rem; }
    .content strong { color: #1a365d; }
    .content code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    
    .author-box { margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #e2e8f0; display: flex; align-items: center; gap: 1rem; }
    .author-avatar { width: 60px; height: 60px; background: #1a365d; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .author-info h4 { margin-bottom: 0.25rem; }
    .author-info p { color: #718096; font-size: 0.9rem; margin: 0; }
    
    .back-link { display: inline-block; margin-top: 2rem; color: #e53e3e; text-decoration: none; font-weight: 500; }
    .back-link:hover { text-decoration: underline; }
    
    footer { background: #0f172a; color: #94a3b8; padding: 2rem; text-align: center; margin-top: 3rem; }
    footer a { color: #94a3b8; }
    
    @media (max-width: 768px) {
      nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; flex-direction: column; padding: 1rem; gap: 1rem; }
      nav.active { display: flex; }
      .mobile-menu { display: block; }
      h1 { font-size: 1.75rem; }
      .featured-image { height: 250px; }
      .article-content { padding: 1.5rem; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="top-bar-inner">
      <span>📞 <a href="tel:+34968153707">+34 968 15 37 07</a></span>
      <span>📧 <a href="mailto:jgalvezrenero@gmail.com">jgalvezrenero@gmail.com</a></span>
    </div>
  </div>

  <header>
    <div class="header-inner">
      <a href="/" class="logo">Properties<span>Mazarrón</span></a>
      <button class="mobile-menu" onclick="document.querySelector('nav').classList.toggle('active')">☰</button>
      <nav>
        <a href="/">Home</a>
        <a href="/properties/">Properties</a>
        <a href="/services/">Services</a>
        <a href="/blog/">Blog</a>
        <a href="/about/">About Us</a>
        <a href="/contact/">Contact</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> / <a href="/blog/">Blog</a> / ${escapeHtml(post.title)}
    </div>

    <article>
      ${post.featuredImage ? `<img src="${escapeHtml(post.featuredImage)}" alt="${escapeHtml(post.title)}" class="featured-image">` : '<div class="no-featured"></div>'}
      
      <div class="article-content">
        <div class="meta">
          <span class="category">${escapeHtml(post.category || 'News')}</span>
          <span>${date}</span>
          <span>By ${escapeHtml(post.author)}</span>
        </div>
        
        <h1>${escapeHtml(post.title)}</h1>
        
        <div class="content">
          <p>${markdownToHtml(post.content)}</p>
        </div>
        
        <div class="author-box">
          <div class="author-avatar">✍️</div>
          <div class="author-info">
            <h4>${escapeHtml(post.author)}</h4>
            <p>Properties Mazarrón</p>
          </div>
        </div>
        
        <a href="/blog/" class="back-link">← Back to all posts</a>
      </div>
    </article>
  </main>

  <footer>
    <p>© 2013-2026 Properties Mazarrón - J. Gálvez Renero S.L.U. | <a href="/aviso-legal/">Aviso Legal</a></p>
  </footer>
</body>
</html>`;
}

function generateNotFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Not Found - Properties Mazarrón</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #1a365d; min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #1a365d; color: white; padding: 1rem 2rem; }
    .logo { font-size: 1.5rem; font-weight: 700; color: white; text-decoration: none; }
    .logo span { color: #e53e3e; }
    main { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { color: #718096; margin-bottom: 2rem; }
    a { color: #e53e3e; }
  </style>
</head>
<body>
  <header><a href="/" class="logo">Properties<span>Mazarrón</span></a></header>
  <main>
    <div>
      <h1>Post Not Found</h1>
      <p>Sorry, this blog post doesn't exist or has been removed.</p>
      <p><a href="/blog/">← Browse all posts</a></p>
    </div>
  </main>
</body>
</html>`;
}
