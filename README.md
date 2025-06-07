This repo holds my tapestry plungins

The first plugin I'm making is for https://www.bizjournals.com/seattle

var sessionCookies = null;
var lastLoginTime = null;
var loginDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function verify() {
    // Check if we need to login or refresh session
    const now = new Date().getTime();
    if (sessionCookies == null || 
        lastLoginTime == null || 
        (now - lastLoginTime) > loginDuration) {
        
        console.log("Attempting login...");
        login()
        .then(() => {
            console.log("Login successful, verifying account...");
            verifyAccountAccess();
        })
        .catch((error) => {
            console.log(`Login failed: ${error.message}`);
            processError(error);
        });
    } else {
        console.log("Using existing session...");
        verifyAccountAccess();
    }
}

function login() {
    return new Promise((resolve, reject) => {
        // First, get the login page to extract any CSRF tokens or form data
        sendRequest(`${site}/login`)
        .then((html) => {
            // Extract CSRF token or other required form fields
            const csrfMatch = html.match(/name="authenticity_token"[^>]*value="([^"]*)"/) ||
                             html.match(/name="_token"[^>]*value="([^"]*)"/) ||
                             html.match(/<meta name="csrf-token" content="([^"]*)">/);
            
            let formData = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
            
            if (csrfMatch) {
                const csrfToken = csrfMatch[1];
                formData += `&authenticity_token=${encodeURIComponent(csrfToken)}`;
                console.log("Found CSRF token");
            }
            
            // Attempt login
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": `${site}/login`
            };
            
            sendRequest(`${site}/login`, "POST", formData, headers, true)
            .then((response) => {
                const responseData = JSON.parse(response);
                
                // Check for successful login indicators
                if (responseData.status === 302 || responseData.status === 200) {
                    // Extract session cookies from headers
                    const setCookieHeaders = responseData.headers['set-cookie'];
                    if (setCookieHeaders) {
                        sessionCookies = extractSessionCookies(setCookieHeaders);
                        lastLoginTime = new Date().getTime();
                        setItem("sessionCookies", sessionCookies);
                        setItem("lastLoginTime", lastLoginTime.toString());
                        console.log("Login successful, session cookies saved");
                        resolve();
                    } else {
                        reject(new Error("Login failed: No session cookies received"));
                    }
                } else if (responseData.status === 401 || responseData.status === 403) {
                    reject(new Error("Login failed: Invalid credentials"));
                } else {
                    reject(new Error(`Login failed: HTTP ${responseData.status}`));
                }
            })
            .catch((error) => {
                reject(new Error(`Login request failed: ${error.message}`));
            });
        })
        .catch((error) => {
            reject(new Error(`Failed to load login page: ${error.message}`));
        });
    });
}

function extractSessionCookies(setCookieHeaders) {
    // Extract relevant session cookies
    const cookies = {};
    const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    
    cookieArray.forEach(cookieHeader => {
        const match = cookieHeader.match(/^([^=]+)=([^;]+)/);
        if (match) {
            const [, name, value] = match;
            // Store important session cookies
            if (name.toLowerCase().includes('session') || 
                name.toLowerCase().includes('auth') ||
                name.toLowerCase().includes('login')) {
                cookies[name] = value;
            }
        }
    });
    
    return cookies;
}

function verifyAccountAccess() {
    // Test access to subscriber-only content to verify authentication
    const testUrl = `${site}/subscribers` || `${site}/account` || `${site}/profile`;
    
    const headers = {};
    if (sessionCookies) {
        headers['Cookie'] = buildCookieHeader(sessionCookies);
    }
    
    sendRequest(testUrl, "GET", null, headers)
    .then((html) => {
        // Look for indicators of successful authentication
        if (html.includes('Sign Out') || 
            html.includes('My Account') || 
            html.includes('subscriber') ||
            !html.includes('Sign In')) {
            
            const verification = {
                displayName: `Seattle Business Journal - ${email}`,
                icon: "https://www.bizjournals.com/seattle/favicon.ico"
            };
            processVerification(verification);
        } else {
            processError(new Error("Authentication verification failed - please check credentials"));
        }
    })
    .catch((error) => {
        processError(new Error(`Failed to verify account access: ${error.message}`));
    });
}

function buildCookieHeader(cookies) {
    return Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
}

function load() {
    // Check if we need to refresh authentication
    if (needsReauth()) {
        console.log("Refreshing authentication...");
        login()
        .then(() => loadContent())
        .catch((error) => processError(error));
    } else {
        loadContent();
    }
}

function needsReauth() {
    const now = new Date().getTime();
    return sessionCookies == null || 
           lastLoginTime == null || 
           (now - lastLoginTime) > loginDuration;
}

function loadContent() {
    // Load cached session data
    if (sessionCookies == null) {
        const storedCookies = getItem("sessionCookies");
        const storedLoginTime = getItem("lastLoginTime");
        
        if (storedCookies && storedLoginTime) {
            sessionCookies = storedCookies;
            lastLoginTime = parseInt(storedLoginTime);
        }
    }
    
    const headers = {};
    if (sessionCookies) {
        headers['Cookie'] = buildCookieHeader(sessionCookies);
    }
    
    // Try RSS feeds first (they might be available to subscribers)
    const rssUrls = [
        `${site}/rss/all`,
        `${site}/feeds/latest.rss`,
        `${site}/rss`,
        `${site}/feed`
    ];
    
    tryAuthenticatedRSSFeeds(rssUrls, headers)
    .then((items) => {
        if (items && items.length > 0) {
            processResults(items);
        } else {
            // Fallback to scraping subscriber content
            scrapeSubscriberContent(headers);
        }
    })
    .catch((error) => {
        console.log(`RSS loading failed: ${error.message}, falling back to scraping`);
        scrapeSubscriberContent(headers);
    });
}

function tryAuthenticatedRSSFeeds(urls, headers) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        function tryNext() {
            if (attempts >= urls.length) {
                reject(new Error("No working RSS feeds found"));
                return;
            }
            
            const url = urls[attempts];
            attempts++;
            
            sendRequest(url, "GET", null, headers)
            .then((xml) => {
                const items = parseRSSFeed(xml);
                if (items && items.length > 0) {
                    resolve(items);
                } else {
                    tryNext();
                }
            })
            .catch(() => tryNext());
        }
        
        tryNext();
    });
}

function scrapeSubscriberContent(headers) {
    // Scrape the main news page for subscriber content
    sendRequest(site, "GET", null, headers)
    .then((html) => {
        const items = extractArticlesFromHTML(html);
        processResults(items);
    })
    .catch((error) => {
        processError(new Error(`Failed to load content: ${error.message}`));
    });
}

function parseRSSFeed(xml) {
    try {
        const jsonObject = xmlParse(xml);
        const items = [];
        
        // Handle both RSS and Atom feeds
        let entries = [];
        if (jsonObject.rss && jsonObject.rss.channel && jsonObject.rss.channel.item) {
            entries = Array.isArray(jsonObject.rss.channel.item) ? 
                     jsonObject.rss.channel.item : [jsonObject.rss.channel.item];
        } else if (jsonObject.feed && jsonObject.feed.entry) {
            entries = Array.isArray(jsonObject.feed.entry) ? 
                     jsonObject.feed.entry : [jsonObject.feed.entry];
        }
        
        entries.forEach(entry => {
            const item = createItemFromRSSEntry(entry);
            if (item) items.push(item);
        });
        
        return items;
    } catch (error) {
        console.log(`RSS parsing failed: ${error.message}`);
        return [];
    }
}

function createItemFromRSSEntry(entry) {
    try {
        // Handle both RSS and Atom format
        const title = entry.title || "";
        const link = entry.link || entry.link$attrs?.href || "";
        const description = entry.description || entry.summary || "";
        const pubDate = entry.pubDate || entry.published || entry.updated;
        
        if (!link || !title) return null;
        
        const date = pubDate ? new Date(pubDate) : new Date();
        const item = Item.createWithUriDate(link, date);
        
        item.title = title;
        item.body = description;
        
        // Filter by content type if specified
        if (contentFilter !== "all") {
            const content = (title + " " + description).toLowerCase();
            const matchesFilter = checkContentFilter(content, contentFilter);
            if (!matchesFilter) return null;
        }
        
        return item;
    } catch (error) {
        console.log(`Error creating item: ${error.message}`);
        return null;
    }
}

function checkContentFilter(content, filter) {
    const filters = {
        "breaking": ["breaking", "urgent", "alert"],
        "real-estate": ["real estate", "property", "development", "construction"],
        "tech": ["technology", "tech", "startup", "software", "digital"],
        "finance": ["finance", "bank", "investment", "funding", "ipo"],
        "startups": ["startup", "entrepreneur", "venture", "funding round"]
    };
    
    const keywords = filters[filter];
    return keywords ? keywords.some(keyword => content.includes(keyword)) : true;
}

function extractArticlesFromHTML(html) {
    // Implement HTML scraping as fallback
    const items = [];
    
    try {
        // Look for common article patterns on business journal sites
        const articlePatterns = [
            /<article[^>]*>.*?<\/article>/gis,
            /<div[^>]*class="[^"]*story[^"]*"[^>]*>.*?<\/div>/gis,
            /<div[^>]*class="[^"]*article[^"]*"[^>]*>.*?<\/div>/gis
        ];
        
        // This would need to be customized based on the actual HTML structure
        // of the Seattle Business Journal website
        
        console.log("HTML scraping not fully implemented - needs site-specific selectors");
        
    } catch (error) {
        console.log(`HTML extraction failed: ${error.message}`);
    }
    
    return items;
}

