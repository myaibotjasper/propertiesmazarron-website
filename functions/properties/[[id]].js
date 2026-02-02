// Dynamic property detail page
export async function onRequest(context) {
  const { params, env, request } = context;
  const propertyId = params.id ? params.id.join('/').replace(/\/$/, '') : null;
  
  // If no property ID, serve the static listing page
  if (!propertyId) {
    return env.ASSETS.fetch(request);
  }

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

// Modern SVG icons
const icons = {
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  bed: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>',
  bath: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"></path><line x1="10" x2="8" y1="5" y2="7"></line><line x1="2" x2="22" y1="12" y2="12"></line><line x1="7" x2="7" y1="19" y2="21"></line><line x1="17" x2="17" y1="19" y2="21"></line></svg>',
  ruler: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"></path><path d="m14.5 12.5 2-2"></path><path d="m11.5 9.5 2-2"></path><path d="m8.5 6.5 2-2"></path><path d="m17.5 15.5 2-2"></path></svg>',
  land: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 16 8"></path><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"></path><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"></path><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"></path><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"></path></svg>',
  mapPin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  zap: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  phone: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
  mail: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  pool: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M2 16c1 0 2-1 3-1s2 1 3 1 2-1 3-1 2 1 3 1 2-1 3-1 2 1 3 1M2 20c1 0 2-1 3-1s2 1 3 1 2-1 3-1 2 1 3 1 2-1 3-1 2 1 3 1M9 4v8M15 4v8"/></svg>',
  car: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>',
  sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>',
  tree: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-7l-2-2"></path><path d="M17 8v.8A6 6 0 0 1 13.8 20v0H10v0A6.5 6.5 0 0 1 7 8h0a5 5 0 0 1 10 0Z"></path><path d="m14 14-2 2"></path></svg>',
  waves: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path></svg>',
  snowflake: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="12" y2="12"></line><line x1="12" x2="12" y1="2" y2="22"></line><path d="m20 16-4-4 4-4"></path><path d="m4 8 4 4-4 4"></path><path d="m16 4-4 4-4-4"></path><path d="m8 20 4-4 4 4"></path></svg>',
  flame: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
  sofa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"></path><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"></path><path d="M4 18v2"></path><path d="M20 18v2"></path><path d="M12 4v9"></path></svg>',
  box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>',
  sunDim: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 4h.01"></path><path d="M20 12h.01"></path><path d="M12 20h.01"></path><path d="M4 12h.01"></path><path d="M17.657 6.343h.01"></path><path d="M17.657 17.657h.01"></path><path d="M6.343 17.657h.01"></path><path d="M6.343 6.343h.01"></path></svg>'
};

const featureIcons = {
  'pool': { icon: 'pool', label: 'Swimming Pool' },
  'garage': { icon: 'car', label: 'Garage' },
  'terrace': { icon: 'sun', label: 'Terrace' },
  'garden': { icon: 'tree', label: 'Garden' },
  'sea-view': { icon: 'waves', label: 'Sea View' },
  'air-con': { icon: 'snowflake', label: 'Air Conditioning' },
  'central-heating': { icon: 'flame', label: 'Central Heating' },
  'furnished': { icon: 'sofa', label: 'Furnished' },
  'storage': { icon: 'box', label: 'Storage' },
  'solarium': { icon: 'sunDim', label: 'Solarium' }
};

function generatePropertyPage(p) {
  const images = p.images || [];
  const imageGallery = images.length > 0 
    ? images.map((img, i) => `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)} - Image ${i+1}" class="gallery-img ${i === 0 ? 'active' : ''}" onclick="showImage(${i})">`).join('')
    : `<div class="no-image">${icons.home}</div>`;

  const featuresHtml = (p.features || []).map(f => {
    const feat = featureIcons[f] || { icon: 'check', label: f };
    return `<span class="feature">${icons[feat.icon] || icons.check} ${feat.label}</span>`;
  }).join('');

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
    .top-bar svg { width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; }
    
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
    .gallery-main .no-image { height: 100%; display: flex; align-items: center; justify-content: center; color: #a0aec0; }
    .gallery-main .no-image svg { width: 80px; height: 80px; }
    .gallery-nav { display: flex; gap: 0.5rem; padding: 1rem; overflow-x: auto; }
    .gallery-nav img { width: 100px; height: 70px; object-fit: cover; border-radius: 8px; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
    .gallery-nav img:hover, .gallery-nav img.active { opacity: 1; }
    
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    
    .details-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin-bottom: 2rem; }
    .details-card h2 { font-size: 1.25rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e2e8f0; }
    
    .specs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
    .spec-item { text-align: center; padding: 1.25rem 1rem; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .spec-item .icon { color: #e53e3e; margin-bottom: 0.5rem; display: flex; justify-content: center; }
    .spec-item .icon svg { width: 28px; height: 28px; }
    .spec-item .label { font-size: 0.75rem; color: #718096; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .spec-item .value { font-weight: 600; color: #1a365d; font-size: 1.1rem; }
    
    .description { color: #4a5568; white-space: pre-line; }
    
    .features-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .feature { background: #f0fdf4; color: #166534; padding: 0.625rem 1rem; border-radius: 8px; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid #bbf7d0; }
    .feature svg { flex-shrink: 0; }
    
    .epc-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; }
    .epc-badge.A { background: #dcfce7; color: #166534; }
    .epc-badge.B { background: #ecfccb; color: #3f6212; }
    .epc-badge.C { background: #fef9c3; color: #854d0e; }
    .epc-badge.D { background: #ffedd5; color: #9a3412; }
    .epc-badge.E, .epc-badge.F, .epc-badge.G { background: #fee2e2; color: #991b1b; }
    .epc-badge.pending, .epc-badge.exempt { background: #f1f5f9; color: #475569; }
    
    .sidebar .contact-card { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: white; padding: 2rem; border-radius: 16px; position: sticky; top: 100px; }
    .contact-card h3 { margin-bottom: 1rem; font-size: 1.25rem; }
    .contact-card p { margin-bottom: 1rem; opacity: 0.9; }
    .contact-card .phone { font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .contact-card .phone a { color: white; text-decoration: none; }
    .contact-card .phone svg { width: 20px; height: 20px; }
    .contact-card .btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #e53e3e; color: white; text-align: center; padding: 1rem; border-radius: 10px; text-decoration: none; font-weight: 600; margin-bottom: 0.75rem; transition: background 0.2s; }
    .contact-card .btn:hover { background: #c53030; }
    .contact-card .btn svg { width: 18px; height: 18px; }
    .contact-card .btn-secondary { background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); }
    .contact-card .btn-secondary:hover { background: rgba(255,255,255,0.25); }
    
    footer { background: #0f172a; color: #94a3b8; padding: 2rem; text-align: center; margin-top: 3rem; }
    footer a { color: #94a3b8; }
    
    @media (max-width: 768px) {
      nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; flex-direction: column; padding: 1rem; gap: 1rem; }
      nav.active { display: flex; }
      .mobile-menu { display: block; }
      .gallery-main { height: 300px; }
      .content-grid { grid-template-columns: 1fr; }
      .property-header { flex-direction: column; }
      .specs-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="top-bar-inner">
      <span>${icons.phone} <a href="tel:+34968153707">+34 968 15 37 07</a></span>
      <span>${icons.mail} <a href="mailto:jgalvezrenero@gmail.com">jgalvezrenero@gmail.com</a></span>
    </div>
  </div>

  <header>
    <div class="header-inner">
      <a href="/" class="logo"><img src="/assets/images/logo.png" alt="Properties Mazarrón" height="50"></a>
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
            ${p.type ? `<div class="spec-item"><div class="icon">${icons.home}</div><div class="label">Type</div><div class="value">${escapeHtml(p.type.charAt(0).toUpperCase() + p.type.slice(1))}</div></div>` : ''}
            ${p.bedrooms ? `<div class="spec-item"><div class="icon">${icons.bed}</div><div class="label">Bedrooms</div><div class="value">${p.bedrooms}</div></div>` : ''}
            ${p.bathrooms ? `<div class="spec-item"><div class="icon">${icons.bath}</div><div class="label">Bathrooms</div><div class="value">${p.bathrooms}</div></div>` : ''}
            ${p.size ? `<div class="spec-item"><div class="icon">${icons.ruler}</div><div class="label">Built Size</div><div class="value">${p.size}m²</div></div>` : ''}
            ${p.plotSize ? `<div class="spec-item"><div class="icon">${icons.land}</div><div class="label">Plot Size</div><div class="value">${p.plotSize.toLocaleString()}m²</div></div>` : ''}
            ${p.area ? `<div class="spec-item"><div class="icon">${icons.mapPin}</div><div class="label">Location</div><div class="value">${escapeHtml(p.area)}</div></div>` : ''}
            ${p.epc ? `<div class="spec-item"><div class="icon">${icons.zap}</div><div class="label">CEE/EPC</div><div class="value"><span class="epc-badge ${p.epc}">${p.epc}</span></div></div>` : ''}
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
          <div class="phone">${icons.phone} <a href="tel:+34968153707">+34 968 15 37 07</a></div>
          <a href="mailto:jgalvezrenero@gmail.com?subject=Enquiry: ${encodeURIComponent(p.title)} (${p.ref || p.id.slice(-8).toUpperCase()})" class="btn">${icons.mail} Email Enquiry</a>
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
      images.forEach((img, i) => img.classList.toggle('active', i === index));
      thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === index));
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
  <header><a href="/" class="logo"><img src="/assets/images/logo.png" alt="Properties Mazarrón" height="50"></a></header>
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
