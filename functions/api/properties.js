// Properties API - CRUD operations
// GET /api/properties - List all properties
// GET /api/properties?id=xxx - Get single property
// POST /api/properties - Create property (requires auth)
// PUT /api/properties - Update property (requires auth)
// DELETE /api/properties?id=xxx - Delete property (requires auth)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS headers
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
      
      if (id) {
        // Get single property
        const property = await env.PROPERTIES_KV.get(`property:${id}`, 'json');
        if (!property) {
          return new Response(JSON.stringify({ error: 'Property not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(property), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // List all properties
        const list = await env.PROPERTIES_KV.list({ prefix: 'property:' });
        const properties = await Promise.all(
          list.keys.map(key => env.PROPERTIES_KV.get(key.name, 'json'))
        );
        return new Response(JSON.stringify({ properties: properties.filter(p => p) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Auth required for POST, PUT, DELETE
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST - Create property
    if (method === 'POST') {
      const body = await request.json();
      const id = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const property = {
        id,
        title: body.title || '',
        description: body.description || '',
        price: body.price || 0,
        currency: body.currency || 'EUR',
        type: body.type || 'house', // house, apartment, villa, land, commercial
        bedrooms: body.bedrooms || 0,
        bathrooms: body.bathrooms || 0,
        size: body.size || 0, // m²
        plotSize: body.plotSize || 0, // m²
        location: body.location || '',
        area: body.area || '', // Mazarrón, Puerto de Mazarrón, etc.
        epc: body.epc || '', // Energy Performance Certificate: A-G, pending, exempt
        features: body.features || [], // pool, garage, terrace, etc.
        images: body.images || [], // array of image URLs
        status: body.status || 'active', // active, sold, reserved
        featured: body.featured || false,
        ref: body.ref || id.slice(-8).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await env.PROPERTIES_KV.put(`property:${id}`, JSON.stringify(property));

      return new Response(JSON.stringify({ success: true, property }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT - Update property
    if (method === 'PUT') {
      const body = await request.json();
      if (!body.id) {
        return new Response(JSON.stringify({ error: 'Property ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const existing = await env.PROPERTIES_KV.get(`property:${body.id}`, 'json');
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Property not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const property = {
        ...existing,
        ...body,
        id: existing.id, // Don't allow ID change
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      };

      await env.PROPERTIES_KV.put(`property:${body.id}`, JSON.stringify(property));

      return new Response(JSON.stringify({ success: true, property }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE - Delete property
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Property ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await env.PROPERTIES_KV.delete(`property:${id}`);

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
