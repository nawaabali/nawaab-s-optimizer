import * as cheerio from 'cheerio';

export function optimizeHtml(html) {
  const $ = cheerio.load(html, { decodeEntities: false });

  // Ensure doctype
  if (!/^\s*<!doctype/i.test(html)) {
    // Cheerio won't emit doctype automatically; prepend manually
    const root = $.root();
    root.prepend('\n');
    // We'll add it when serializing
  }

  // <html lang>
  if ($('html').length === 0) $('body').wrap('<html></html>');
  if (!$('html').attr('lang')) $('html').attr('lang', 'en');

  // <head> baseline
  if ($('head').length === 0) $('html').prepend('<head></head>');
  const head = $('head');

  if ($('meta[charset]').length === 0) head.prepend('<meta charset="UTF-8">');
  if ($('meta[name="viewport"]').length === 0) head.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  if ($('title').length === 0) head.append('<title>Optimized Site</title>');
  if ($('meta[name="description"]').length === 0) head.append('<meta name="description" content="Official site – optimized for performance, accessibility and SEO.">');

  // Target=_blank safety
  $('a[target="_blank"]').each((_, a) => {
    const rel = new Set(String($(a).attr('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener'); 
    rel.add('noreferrer');
    $(a).attr('rel', Array.from(rel).join(' '));
  });

  // Lazy-load images + decoding
  $('img').each((_, img) => {
    if (!$(img).attr('alt')) {
      const src = $(img).attr('src') || '';
      const base = src.split('/').pop()?.split('.')[0]?.replace(/[-_]/g,' ') || 'Image';
      $(img).attr('alt', capitalize(base));
    }
    if (!$(img).attr('loading')) $(img).attr('loading', 'lazy');
    if (!$(img).attr('decoding')) $(img).attr('decoding', 'async');
    if (!$(img).attr('width') || !$(img).attr('height')) {
      // Avoid layout shift when missing intrinsic size (best-effort)
      $(img).attr('style', (($(img).attr('style')||'') + ';max-width:100%;height:auto;').trim());
    }
  });

  // Iframes lazy + title
  $('iframe').each((_, f) => {
    if (!$(f).attr('loading')) $(f).attr('loading', 'lazy');
    if (!$(f).attr('title')) $(f).attr('title', 'Embedded content');
  });

  // Defer external scripts
  $('script[src]').each((_, s) => {
    if (!$(s).attr('async') && !$(s).attr('defer')) $(s).attr('defer', '');
  });

  // Headings sanity: ensure single <h1>
  const h1s = $('h1');
  if (h1s.length > 1) {
    // Keep the first <h1>, downgrade others to <h2>
    h1s.slice(1).each((_, el) => {
      $(el).replaceWith(`<h2>${$(el).html()}</h2>`);
    });
  }

  // Basic a11y for buttons without text
  $('button').each((_, b) => {
    const text = $(b).text().trim();
    if (!text && !$(b).attr('aria-label')) {
      $(b).attr('aria-label', 'Button');
    }
  });

  let output = $.html();
  // Prepend HTML5 doctype if missing
  if (!/^\s*<!doctype/i.test(html)) {
    output = '<!DOCTYPE html>\n' + output;
  }
  return output;
}

function capitalize(s) { 
  return s.charAt(0).toUpperCase() + s.slice(1); 
}

