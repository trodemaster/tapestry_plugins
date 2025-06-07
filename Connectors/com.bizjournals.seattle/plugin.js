// com.bizjournals.seattle - Seattle Business Journal Connector for Tapestry
// Supports authenticated access to subscriber content

var sessionCookies = null;
var lastLoginTime = null;
var loginDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
var lastUpdateCheck = null;

function verify() {
    console.log("Starting verification for Seattle Business Journal...");
    
    // Check if email and password are provided
    if (!email || !password) {
        processError(new Error("Email and password are required for Seattle Business Journal access"));
        return;
    }
    
    // For this example, we'll do a simple verification
    const verification = {
        displayName: `Seattle Business Journal - ${email}`,
        icon: "https://www.bizjournals.com/seattle/favicon.ico"
    };
    processVerification(verification);
}

function load() {
    console.log("Starting content load...");
    
    // Check update interval
    if (lastUpdateCheck) {
        const now = new Date().getTime();
        const intervalMs = parseInt(updateInterval) * 60 * 1000;
        if ((now - lastUpdateCheck) < intervalMs) {
            console.log("Update interval not reached, skipping load");
            processResults(null);
            return;
        }
    }
    
    // Build request headers
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    };
    
    // Load content directly via web scraping
    scrapeContent(headers);
}





function cleanText(text) {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function checkContentFilter(content, filter) {
    const filters = {
        "breaking": ["breaking", "urgent", "alert", "developing"],
        "real-estate": ["real estate", "property", "development", "construction", "housing"],
        "tech": ["technology", "tech", "startup", "software", "digital", "innovation"],
        "finance": ["finance", "bank", "investment", "funding", "ipo", "financial"],
        "startups": ["startup", "entrepreneur", "venture", "funding round", "seed", "series"]
    };
    
    const keywords = filters[filter];
    return keywords ? keywords.some(keyword => content.includes(keyword)) : true;
}

function scrapeContent(headers) {
    console.log("Scraping content from main page...");
    
    sendRequest(site, "GET", null, headers)
    .then((html) => {
        console.log(`Received HTML content, length: ${html.length} characters`);
        
        // Debug: log first few article links found
        const linkMatches = html.match(/<a[^>]*href="[^"]*\/news\/[^"]*"[^>]*>/gi);
        if (linkMatches) {
            console.log(`Found ${linkMatches.length} potential news links`);
            console.log(`First 3 links: ${linkMatches.slice(0, 3).join(', ')}`);
        }
        
        const items = extractArticlesFromHTML(html);
        lastUpdateCheck = new Date().getTime();
        console.log(`Extracted ${items.length} articles from HTML`);
        
        // Debug: log first few extracted items
        items.slice(0, 3).forEach((item, index) => {
            console.log(`Article ${index + 1}: ${item.title} -> ${item.uri}`);
        });
        
        // Extract images if enabled
        if (includeImages) {
            console.log("Extracting images from articles...");
            extractImagesFromArticles(items, headers)
            .then((itemsWithImages) => {
                console.log(`Added images to ${itemsWithImages.filter(item => item.attachments && item.attachments.length > 0).length} articles`);
                processResults(itemsWithImages);
            })
            .catch((error) => {
                console.log(`Image extraction failed: ${error.message}`);
                processResults(items); // Fallback to items without images
            });
        } else {
            processResults(items);
        }
    })
    .catch((error) => {
        processError(new Error(`Failed to load content: ${error.message}`));
    });
}

function extractArticlesFromHTML(html) {
    const items = [];
    
    try {
        // Look for specific Business Journal article patterns
        const patterns = [
            // Headlines with news URLs - most common pattern
            /<a[^>]*href="([^"]*\/news\/\d{4}\/\d{2}\/\d{2}\/[^"]*)"[^>]*>([^<]+)<\/a>/gis,
            // Alternative: headline tags containing news links  
            /<h[1-6][^>]*>\s*<a[^>]*href="([^"]*\/news\/\d{4}\/\d{2}\/\d{2}\/[^"]*)"[^>]*>([^<]+)<\/a>/gis,
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(html)) !== null && items.length < 25) {
                const url = match[1];
                const title = match[2];
                
                // Filter for actual news articles
                if (url && title && isValidNewsArticle(url, title)) {
                    const fullUrl = url.startsWith('/') ? 'https://www.bizjournals.com' + url : 
                                   url.startsWith('seattle/') ? 'https://www.bizjournals.com/' + url : url;
                    
                    // Skip if we already have this URL
                    if (items.some(item => item.uri === fullUrl)) continue;
                    
                    // Extract date from URL if possible (format: /2025/06/06/)
                    const date = extractDateFromUrl(fullUrl) || new Date();
                    const item = Item.createWithUriDate(fullUrl, date);
                    item.title = cleanText(title);
                    
                    // Try to extract any summary or description nearby
                    const summary = extractSummaryForTitle(html, title);
                    if (summary) {
                        item.body = cleanText(summary);
                    }
                    
                    // Apply content filter
                    if (contentFilter !== "all") {
                        const content = (item.title + " " + (item.body || "")).toLowerCase();
                        if (!checkContentFilter(content, contentFilter)) continue;
                    }
                    
                    items.push(item);
                }
            }
        }
        
        // Sort by publication date (newest first)
        items.sort((a, b) => {
            return b.date.getTime() - a.date.getTime();
        });
        
    } catch (error) {
        console.log(`HTML extraction failed: ${error.message}`);
    }
    
    return items;
}

function isValidNewsArticle(url, title) {
    // Must be a dated news article URL
    const hasDatePattern = /\/news\/\d{4}\/\d{2}\/\d{2}\//.test(url);
    
    // Skip non-news URLs
    const skipPatterns = [
        'mailto:',
        'javascript:',
        '#',
        '/subscribe',
        '/login',
        '/search',
        '/advertise',
        '/events',
        '/podcasts',
        '/video'
    ];
    
    const hasSkipPattern = skipPatterns.some(pattern => url.includes(pattern));
    
    // Title should be substantial and not navigation text
    const cleanedTitle = cleanText(title);
    const titleLength = cleanedTitle.length;
    const isSubstantialTitle = titleLength > 20 && titleLength < 200;
    
    // Skip common navigation text
    const navTextPatterns = [
        'subscribe',
        'sign in',
        'menu',
        'search',
        'follow us',
        'contact',
        'about'
    ];
    const isNavText = navTextPatterns.some(pattern => 
        cleanedTitle.toLowerCase().includes(pattern)
    );
    
    console.log(`Validating: "${cleanedTitle}" (${titleLength} chars) URL: ${url}`);
    console.log(`  hasDatePattern: ${hasDatePattern}, hasSkipPattern: ${hasSkipPattern}, isSubstantialTitle: ${isSubstantialTitle}, isNavText: ${isNavText}`);
    
    return hasDatePattern && !hasSkipPattern && isSubstantialTitle && !isNavText;
}

function extractSummaryForTitle(html, title) {
    try {
        // Look for summary or description text near the title
        const escapedTitle = escapeRegex(cleanText(title));
        const summaryPattern = new RegExp(
            escapedTitle + '.*?<p[^>]*>([^<]+)</p>', 'is'
        );
        const match = html.match(summaryPattern);
        
        if (match && match[1]) {
            const summary = match[1];
            // Return summary if it's substantial and different from title
            if (summary.length > 20 && !summary.toLowerCase().includes(title.toLowerCase())) {
                return summary;
            }
        }
    } catch (error) {
        // Ignore summary extraction errors
    }
    return null;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractDateFromUrl(url) {
    try {
        // Extract date from URL pattern like /2025/06/06/
        const dateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (dateMatch) {
            const [, year, month, day] = dateMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        // Alternative: try to extract from filename
        const filenameMatch = url.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (filenameMatch) {
            const [, year, month, day] = filenameMatch;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        return null;
    } catch (error) {
        console.log(`Date extraction failed for ${url}: ${error.message}`);
        return null;
    }
}

function extractImagesFromArticles(items, headers) {
    return new Promise((resolve, reject) => {
        // Process articles sequentially to avoid overwhelming the server
        processArticleImages(items, 0, headers, resolve, reject);
    });
}

function processArticleImages(items, index, headers, resolve, reject) {
    if (index >= items.length) {
        resolve(items);
        return;
    }
    
    const item = items[index];
    console.log(`Extracting image from article ${index + 1}/${items.length}: ${item.title}`);
    
    sendRequest(item.uri, "GET", null, headers)
    .then((html) => {
        const imageUrl = extractMainImageFromArticle(html, item.uri);
        if (imageUrl) {
            const mediaAttachment = MediaAttachment.createWithUrl(imageUrl);
            mediaAttachment.aspectSize = {width: 800, height: 450}; // Typical article image ratio
            mediaAttachment.text = `Image for article: ${item.title}`;
            item.attachments = [mediaAttachment];
            console.log(`Added image to: ${item.title} -> ${imageUrl}`);
        } else {
            console.log(`No image found for: ${item.title}`);
        }
        
        // Process next article immediately
        processArticleImages(items, index + 1, headers, resolve, reject);
    })
    .catch((error) => {
        console.log(`Failed to load article ${item.title}: ${error.message}`);
        // Continue with next article even if this one fails
        processArticleImages(items, index + 1, headers, resolve, reject);
    });
}

function extractMainImageFromArticle(html, articleUrl) {
    try {
        // Look for common article image patterns in Business Journal articles
        const imagePatterns = [
            // Hero/main article images
            /<img[^>]*class="[^"]*hero[^"]*"[^>]*src="([^"]*)"[^>]*>/i,
            /<img[^>]*class="[^"]*article[^"]*"[^>]*src="([^"]*)"[^>]*>/i,
            /<img[^>]*class="[^"]*featured[^"]*"[^>]*src="([^"]*)"[^>]*>/i,
            // Open Graph image (social media preview)
            /<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i,
            // Twitter card image
            /<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i,
            // Main content images
            /<figure[^>]*>\s*<img[^>]*src="([^"]*)"[^>]*>/i,
            // Any large image in article content
            /<img[^>]*src="([^"]*)"[^>]*width="[^"]*"[^>]*height="[^"]*"[^>]*>/i,
            // General img tags (as fallback)
            /<img[^>]*src="([^"]*)"[^>]*>/i
        ];
        
        for (const pattern of imagePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                let imageUrl = match[1];
                
                // Convert relative URLs to absolute
                if (imageUrl.startsWith('/')) {
                    imageUrl = 'https://www.bizjournals.com' + imageUrl;
                } else if (imageUrl.startsWith('//')) {
                    imageUrl = 'https:' + imageUrl;
                }
                
                // Skip small/icon images
                if (isValidArticleImage(imageUrl)) {
                    console.log(`Found image: ${imageUrl}`);
                    return imageUrl;
                }
            }
        }
        
        console.log(`No suitable image found in article: ${articleUrl}`);
        return null;
    } catch (error) {
        console.log(`Image extraction failed: ${error.message}`);
        return null;
    }
}

function isValidArticleImage(imageUrl) {
    // Skip small/icon images
    const skipPatterns = [
        'icon',
        'logo',
        'avatar',
        'thumbnail',
        'favicon',
        'button'
    ];
    
    const urlLower = imageUrl.toLowerCase();
    
    // Skip if it contains skip patterns
    if (skipPatterns.some(pattern => urlLower.includes(pattern))) {
        return false;
    }
    
    // Must be a common image format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext => urlLower.includes(ext));
    
    return hasValidExtension;
} 