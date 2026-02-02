// Image Upload API - stores images as base64 in KV
// POST /api/images - Upload images (multipart/form-data)
// GET /api/images?id=xxx - Get image

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET - Serve image
    if (method === 'GET') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Image ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const imageData = await env.PROPERTIES_KV.get(`image:${id}`, 'json');
      if (!imageData) {
        return new Response('Image not found', { status: 404, headers: corsHeaders });
      }

      // Decode base64 and return image
      const binaryString = atob(imageData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': imageData.contentType,
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    }

    // Auth required for POST
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST - Upload images
    if (method === 'POST') {
      const formData = await request.formData();
      const files = formData.getAll('images');
      
      if (!files || files.length === 0) {
        return new Response(JSON.stringify({ error: 'No images provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const uploadedUrls = [];
      const errors = [];

      for (const file of files) {
        if (!(file instanceof File)) continue;
        
        // Check file size (max 2MB per image for KV)
        if (file.size > 2 * 1024 * 1024) {
          errors.push(`${file.name}: File too large (max 2MB)`);
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Not an image file`);
          continue;
        }

        try {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await env.PROPERTIES_KV.put(`image:${imageId}`, JSON.stringify({
            data: base64,
            contentType: file.type,
            filename: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString()
          }));

          uploadedUrls.push({
            id: imageId,
            url: `/api/images?id=${imageId}`,
            filename: file.name
          });
        } catch (e) {
          errors.push(`${file.name}: Upload failed - ${e.message}`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        images: uploadedUrls,
        errors: errors.length > 0 ? errors : undefined
      }), {
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
