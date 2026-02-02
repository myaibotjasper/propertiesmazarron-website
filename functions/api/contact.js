// Contact form handler - sends email via MailChannels (Cloudflare Workers free email)
export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const formData = await request.formData();
    const name = formData.get('name') || '';
    const email = formData.get('email') || '';
    const phone = formData.get('phone') || '';
    const interest = formData.get('interest') || '';
    const message = formData.get('message') || '';
    const turnstileToken = formData.get('cf-turnstile-response');

    // Verify Turnstile token
    if (env.TURNSTILE_SECRET && turnstileToken) {
      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${env.TURNSTILE_SECRET}&response=${turnstileToken}`
      });
      const turnstileResult = await turnstileResponse.json();
      
      if (!turnstileResult.success) {
        return new Response(JSON.stringify({ error: 'Security verification failed. Please try again.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send email via MailChannels (free for Cloudflare Workers)
    const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'jgalvezrenero@gmail.com', name: 'Properties Mazarrón' }]
        }],
        from: {
          email: 'noreply@propertiesmazarron.es',
          name: 'Properties Mazarrón Website'
        },
        reply_to: { email: email, name: name },
        subject: `New Enquiry: ${interest || 'General'} - from ${name}`,
        content: [{
          type: 'text/plain',
          value: `New contact form submission from Properties Mazarrón website:

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Interest: ${interest || 'Not specified'}

Message:
${message}

---
This email was sent from the contact form at propertiesmazarron.es
Reply directly to this email to respond to ${name}.`
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('MailChannels error:', errorText);
      
      // Fallback: store in KV if email fails
      if (env.CONTACT_KV) {
        const id = `contact_${Date.now()}`;
        await env.CONTACT_KV.put(id, JSON.stringify({
          name, email, phone, interest, message,
          timestamp: new Date().toISOString(),
          emailSent: false
        }));
      }
      
      // Still return success to user - we have the data
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Thank you! Your message has been received.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store successful submission too
    if (env.CONTACT_KV) {
      const id = `contact_${Date.now()}`;
      await env.CONTACT_KV.put(id, JSON.stringify({
        name, email, phone, interest, message,
        timestamp: new Date().toISOString(),
        emailSent: true
      }));
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Thank you! Your message has been sent.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
