// Blog API - CRUD operations for blog posts
// GET /api/blog - List all posts
// GET /api/blog?id=xxx - Get single post
// POST /api/blog - Create post (requires auth)
// PUT /api/blog - Update post (requires auth)
// DELETE /api/blog?id=xxx - Delete post (requires auth)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET - Public access
    if (method === 'GET') {
      const id = url.searchParams.get('id');
      const slug = url.searchParams.get('slug');
      
      if (id) {
        const post = await env.PROPERTIES_KV.get(`blog:${id}`, 'json');
        if (!post) {
          return new Response(JSON.stringify({ error: 'Post not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(post), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (slug) {
        // Find post by slug
        const list = await env.PROPERTIES_KV.list({ prefix: 'blog:' });
        for (const key of list.keys) {
          const post = await env.PROPERTIES_KV.get(key.name, 'json');
          if (post && post.slug === slug) {
            return new Response(JSON.stringify(post), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // List all posts
      const list = await env.PROPERTIES_KV.list({ prefix: 'blog:' });
      const posts = await Promise.all(
        list.keys.map(key => env.PROPERTIES_KV.get(key.name, 'json'))
      );
      
      // Sort by date, newest first
      const sortedPosts = posts
        .filter(p => p)
        .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
      
      return new Response(JSON.stringify({ posts: sortedPosts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auth required for POST, PUT, DELETE
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST - Create post
    if (method === 'POST') {
      const body = await request.json();
      const id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate slug from title
      const slug = (body.slug || body.title || id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
      
      const post = {
        id,
        title: body.title || '',
        slug,
        excerpt: body.excerpt || '',
        content: body.content || '',
        author: body.author || 'Properties Mazarrón',
        category: body.category || 'news',
        tags: body.tags || [],
        featuredImage: body.featuredImage || '',
        status: body.status || 'draft', // draft, published
        publishedAt: body.status === 'published' ? (body.publishedAt || new Date().toISOString()) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await env.PROPERTIES_KV.put(`blog:${id}`, JSON.stringify(post));

      return new Response(JSON.stringify({ success: true, post }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT - Update post
    if (method === 'PUT') {
      const body = await request.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'Post ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const existing = await env.PROPERTIES_KV.get(`blog:${body.id}`, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update publishedAt if newly published
      let publishedAt = existing.publishedAt;
      if (body.status === 'published' && existing.status !== 'published') {
        publishedAt = new Date().toISOString();
      }

      const post = {
        ...existing,
        ...body,
        id: existing.id,
        slug: body.slug || existing.slug,
        publishedAt,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      };

      await env.PROPERTIES_KV.put(`blog:${body.id}`, JSON.stringify(post));

      return new Response(JSON.stringify({ success: true, post }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE - Delete post
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Post ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await env.PROPERTIES_KV.delete(`blog:${id}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
