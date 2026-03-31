
/**
 * Real-time Website Scraper
 * Fetches raw HTML via CORS proxy and parses DOM for content.
 */

export interface ScrapedData {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  bodyText: string;
  links: string[];
  images: string[];
  socialLinks: string[];
}

const normalizeUrl = (url: string) => {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
};

const parseHtml = (htmlText: string, targetUrl: string): ScrapedData => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Extract Data
    const title = doc.title || '';
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    
    const h1 = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim() || '').filter(t => t.length > 0);
    const h2 = Array.from(doc.querySelectorAll('h2')).map(el => el.textContent?.trim() || '').filter(t => t.length > 0);
    
    // Extract main text content (heuristically filtering out nav/footer noise)
    const paragraphs = Array.from(doc.querySelectorAll('p, article, section, li'))
      .map(el => el.textContent?.trim() || '')
      .filter(t => t.length > 50) // Only keep substantial text blocks
      .slice(0, 30); // Limit context window usage
    
    const bodyText = paragraphs.join('\n\n');

    // Extract Social Links for contact info
    const socialLinks = Array.from(doc.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href.includes('linkedin.com') || href.includes('twitter.com') || href.includes('x.com') || href.includes('instagram.com') || href.includes('facebook.com') || href.includes('tiktok.com'));

    // Extract Images (potential logos)
    const images = Array.from(doc.querySelectorAll('img'))
      .map(img => {
        const src = img.getAttribute('src');
        if (!src) return '';
        // Handle relative URLs
        try {
          return new URL(src, targetUrl).href;
        } catch {
          return src.startsWith('http') ? src : '';
        }
      })
      .filter(src => src.startsWith('http') && !src.includes('base64'))
      .slice(0, 10); 

    return {
      url: targetUrl,
      title,
      metaDescription,
      h1,
      h2,
      bodyText,
      links: [],
      images,
      socialLinks: [...new Set(socialLinks)] // unique
    };
}

export const scrapeWebsite = async (rawUrl: string): Promise<ScrapedData> => {
  const targetUrl = normalizeUrl(rawUrl);
  
  // Public CORS proxies list with specific handling for AllOrigins wrapper
  const proxyConfigs = [
    { url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, type: 'json' },
    { url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, type: 'text' },
    { url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, type: 'text' }
  ];

  let lastErrorMsg = "";

  for (const config of proxyConfigs) {
    const proxyUrl = config.url(targetUrl);
    try {
      console.log(`[Scraper] Attempting scrape via: ${proxyUrl}`);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      
      let htmlText = "";
      if (config.type === 'json') {
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from proxy");
        }
        try {
          const data = JSON.parse(text);
          htmlText = data.contents || "";
        } catch (e) {
          console.warn(`[Scraper] Failed to parse JSON from ${config.url(targetUrl)}, falling back to text`);
          htmlText = text;
        }
      } else {
        htmlText = await response.text();
      }

      if (!htmlText || htmlText.trim().length < 100) {
         throw new Error("Response too short or empty");
      }

      return parseHtml(htmlText, targetUrl);

    } catch (error: any) {
      console.warn(`[Scraper] Attempt failed: ${error.message}`);
      lastErrorMsg = error.message;
    }
  }

  console.error("[Scraper] All scraping attempts failed.");
  throw new Error(`Scraper error: ${lastErrorMsg}. The site may be protected by Cloudflare or blocking public proxies.`);
};
