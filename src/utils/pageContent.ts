export function extractStructuredTextWithLinks(html: string) {
    const container = document.createElement('div');
    container.innerHTML = html;
    const origin = window.location.origin;
    
    function traverse(node: Node): Array<{type: 'text' | 'link', content?: string, text?: string, href?: string}> {
        const segments: Array<{type: 'text' | 'link', content?: string, text?: string, href?: string}> = [];
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text && !segments.some(seg => seg.type === 'text' && seg.content === text)) {
                segments.push({ type: 'text', content: text });
            }
            return segments;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const tagName = el.tagName.toLowerCase();
            
            // Skip elements we don't want to process at all
            if (tagName === 'style' || tagName === 'script' || tagName === 'noscript' || 
                tagName === 'meta' || tagName === 'link' || tagName === 'header' || 
                tagName === 'nav' || tagName === 'footer') {
                return segments;
            }
            
            // Only process specific elements we care about
            const allowedElements = ['p', 'li', 'label', 'span', 'a', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5'];
            if (!allowedElements.includes(tagName)) {
                // For elements we don't care about, just process their children
                for (const child of Array.from(el.childNodes)) {
                    segments.push(...traverse(child));
                }
                return segments;
            }
            if (tagName === 'a') {
                const hrefAttr = el.getAttribute('href');
                if (!hrefAttr) {
                    // Skip anchor tags without href
                    for (const child of Array.from(el.childNodes)) {
                        segments.push(...traverse(child));
                    }
                    return segments;
                }
                
                // Remove search params from href
                const url = new URL(hrefAttr.startsWith('/') ? origin + hrefAttr : hrefAttr, origin);
                url.search = '';
                const href = url.toString();
                const text = el.textContent?.trim() || '';
                
                // Check for exact matches on text or href
                const hasExactMatch = segments.some(seg => 
                    (seg.type === 'link' && (seg.text === text || seg.href === href))
                );
                
                if (!hasExactMatch) {
                    segments.push({ type: 'link', text, href });
                }
                return segments;
            }
            for (const child of Array.from(el.childNodes)) {
                segments.push(...traverse(child));
            }
        }
        return segments;
    }
    return traverse(container);
}

export function segmentsToMarkdown(segments: Array<{type: 'text' | 'link', content?: string, text?: string, href?: string}>): string {
    const limit = 8000;
    // Simple joiner: links -> [text](href), text -> content; keep spacing
    const parts: string[] = [];
    for (const seg of segments) {
        if (seg.type === 'link') {
            if (seg.text) parts.push(`[${seg.text}](${seg.href})`);
            else parts.push(seg.href || '');
        } else if (seg.type === 'text') {
            parts.push(seg.content || '');
        }
    }
    const response = parts.join('\n').replace(/\s{2,}/g, ' ').trim();

    console.log('response length', response.length)

    // Collapse excessive whitespace while preserving basic sentence spacing
    return response.slice(0, limit);
}
