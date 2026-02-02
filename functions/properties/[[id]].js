// Dynamic property detail page
export async function onRequest(context) {
  const { params, env, request } = context;
  const propertyId = params.id ? params.id.join('/').replace(/\/$/, '') : null;
  
  if (!propertyId) {
    return new Response('Not found', { status: 404 });
  }

  // Fetch property data
  const property = await env.PROPERTIES_KV.get(`property:${propertyId}`, 'json');
  
  if (!property) {
    return new Response(generateNotFoundPage(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response(generatePropertyPage(property), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function generatePropertyPage(p) {
  const featureLabels = {
    'pool': '🏊 Swimming Pool',
    'garage': '🚗 Garage',
    'terrace': '☀️ Terrace',
    'garden': '🌳 Garden',
    'sea-view': '🌊 Sea View',
    'air-con': '❄️ Air Conditioning',
    'central-heating': '🔥 Central Heating',
    'furnished': '🛋️ Furnished',
    'storage': '📦 Storage',
    'solarium': '🌞 Solarium'
  };

  const images = p.images || [];
  const imageGallery = images.length > 0 
    ? images.map((img, i) => `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)} - Image ${i+1}" class="gallery-img ${i === 0 ? 'active' : ''}" onclick="showImage(${i})">`).join('')
    : '<div class="no-image">🏠 No images available</div>';

  const featuresHtml = (p.features || []).map(f => 
    `<span class="feature">${featureLabels[f] || f}</span>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(p.title)} - Properties Mazarrón</title>
  <meta name="description" content="${escapeHtml(p.description?.slice(0, 160) || p.title)}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a365d; line-height: 1.6; background: #f7fafc; }
    
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
    
    main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    
    .breadcrumb { margin-bottom: 1.5rem; font-size: 0.9rem; }
    .breadcrumb a { color: #718096; text-decoration: none; }
    .breadcrumb a:hover { color: #e53e3e; }
    
    .property-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .property-header h1 { font-size: 2rem; }
    .property-header .price { font-size: 2rem; font-weight: 700; color: #38a169; }
    .property-header .ref { color: #a0aec0; font-size: 0.9rem; margin-top: 0.25rem; }
    
    .gallery { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    .gallery-main { position: relative; height: 500px; background: #e2e8f0; }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; display: none; }
    .gallery-main img.active { display: block; }
    .gallery-main .no-image { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: #a0aec0; }
    .gallery-nav { display: flex; gap: 0.5rem; padding: 1rem; overflow-x: auto; }
    .gallery-nav img { width: 100px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
    .gallery-nav img:hover, .gallery-nav img.active { opacity: 1; }
    
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    
    .details-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin-bottom: 2rem; }
    .details-card h2 { font-size: 1.25rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e2e8f0; }
    
    .specs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; }
    .spec-item { text-align: center; padding: 1rem; background: #f7fafc; border-radius: 8px; }
    .spec-item .icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .spec-item .label { font-size: 0.8rem; color: #718096; margin-bottom: 0.25rem; }
    .spec-item .value { font-weight: 600; color: #1a365d; }
    
    .description { color: #4a5568; white-space: pre-line; }
    
    .features-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .feature { background: #ebf8ff; color: #2b6cb0; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; }
    
    .epc-badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; }
    .epc-badge.A { background: #22c55e; color: white; }
    .epc-badge.B { background: #84cc16; color: white; }
    .epc-badge.C { background: #eab308; color: black; }
    .epc-badge.D { background: #f97316; color: white; }
    .epc-badge.E, .epc-badge.F, .epc-badge.G { background: #ef4444; color: white; }
    .epc-badge.pending, .epc-badge.exempt { background: #94a3b8; color: white; }
    
    .sidebar .contact-card { background: #1a365d; color: white; padding: 2rem; border-radius: 12px; position: sticky; top: 100px; }
    .contact-card h3 { margin-bottom: 1rem; }
    .contact-card p { margin-bottom: 1rem; opacity: 0.9; }
    .contact-card .phone { font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; }
    .contact-card .phone a { color: white; text-decoration: none; }
    .contact-card .btn { display: block; background: #e53e3e; color: white; text-align: center; padding: 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 0.75rem; }
    .contact-card .btn:hover { background: #c53030; }
    .contact-card .btn-secondary { background: transparent; border: 2px solid white; }
    .contact-card .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    
    footer { background: #0f172a; color: #94a3b8; padding: 2rem; text-align: center; margin-top: 3rem; }
    footer a { color: #94a3b8; }
    
    @media (max-width: 768px) {
      nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; flex-direction: column; padding: 1rem; gap: 1rem; }
      nav.active { display: flex; }
      .mobile-menu { display: block; }
      .gallery-main { height: 300px; }
      .content-grid { grid-template-columns: 1fr; }
      .property-header { flex-direction: column; }
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
        <a href="/about/">About Us</a>
        <a href="/contact/">Contact</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="breadcrumb">
      <a href="/">Home</a> / <a href="/properties/">Properties</a> / ${escapeHtml(p.title)}
    </div>

    <div class="property-header">
      <div>
        <h1>${escapeHtml(p.title)}</h1>
        <div class="ref">Ref: ${escapeHtml(p.ref || p.id.slice(-8).toUpperCase())}</div>
      </div>
      <div class="price">€${Number(p.price).toLocaleString()}</div>
    </div>

    <div class="gallery">
      <div class="gallery-main" id="galleryMain">
        ${imageGallery}
      </div>
      ${images.length > 1 ? `
      <div class="gallery-nav">
        ${images.map((img, i) => `<img src="${escapeHtml(img)}" alt="Thumbnail ${i+1}" class="${i === 0 ? 'active' : ''}" onclick="showImage(${i})">`).join('')}
      </div>
      ` : ''}
    </div>

    <div class="content-grid">
      <div>
        <div class="details-card">
          <h2>Property Details</h2>
          <div class="specs-grid">
            ${p.type ? `<div class="spec-item"><div class="icon">🏠</div><div class="label">Type</div><div class="value">${escapeHtml(p.type.charAt(0).toUpperCase() + p.type.slice(1))}</div></div>` : ''}
            ${p.bedrooms ? `<div class="spec-item"><div class="icon">🛏️</div><div class="label">Bedrooms</div><div class="value">${p.bedrooms}</div></div>` : ''}
            ${p.bathrooms ? `<div class="spec-item"><div class="icon">🚿</div><div class="label">Bathrooms</div><div class="value">${p.bathrooms}</div></div>` : ''}
            ${p.size ? `<div class="spec-item"><div class="icon">📐</div><div class="label">Built Size</div><div class="value">${p.size}m²</div></div>` : ''}
            ${p.plotSize ? `<div class="spec-item"><div class="icon">🌳</div><div class="label">Plot Size</div><div class="value">${p.plotSize}m²</div></div>` : ''}
            ${p.area ? `<div class="spec-item"><div class="icon">📍</div><div class="label">Location</div><div class="value">${escapeHtml(p.area)}</div></div>` : ''}
            ${p.epc ? `<div class="spec-item"><div class="icon">⚡</div><div class="label">CEE/EPC</div><div class="value"><span class="epc-badge ${p.epc}">${p.epc}</span></div></div>` : ''}
          </div>
        </div>

        ${p.description ? `
        <div class="details-card">
          <h2>Description</h2>
          <div class="description">${escapeHtml(p.description)}</div>
        </div>
        ` : ''}

        ${p.features && p.features.length > 0 ? `
        <div class="details-card">
          <h2>Features</h2>
          <div class="features-list">${featuresHtml}</div>
        </div>
        ` : ''}
      </div>

      <div class="sidebar">
        <div class="contact-card">
          <h3>Interested in this property?</h3>
          <p>Contact us for more information or to arrange a viewing.</p>
          <div class="phone">📞 <a href="tel:+34968153707">+34 968 15 37 07</a></div>
          <a href="mailto:jgalvezrenero@gmail.com?subject=Enquiry: ${encodeURIComponent(p.title)} (${p.ref || p.id.slice(-8).toUpperCase()})" class="btn">Email Enquiry</a>
          <a href="/contact/" class="btn btn-secondary">Contact Form</a>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <p>© 2013-2026 Properties Mazarrón - J. Gálvez Renero S.L.U. | <a href="/aviso-legal/">Aviso Legal</a></p>
  </footer>

  <script>
    let currentImage = 0;
    const images = document.querySelectorAll('.gallery-main .gallery-img');
    const thumbs = document.querySelectorAll('.gallery-nav img');
    
    function showImage(index) {
      images.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
      currentImage = index;
    }
  </script>
</body>
</html>`;
}

function generateNotFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Not Found - Properties Mazarrón</title>
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
      <h1>Property Not Found</h1>
      <p>Sorry, this property listing is no longer available or may have been removed.</p>
      <p><a href="/properties/">← Browse all properties</a></p>
    </div>
  </main>
</body>
</html>`;
}
