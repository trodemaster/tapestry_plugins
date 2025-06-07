# Tapestry Plugins

A collection of custom Tapestry plugins for accessing news and content sources that aren't available through standard RSS feeds.

## About Tapestry

[Tapestry](https://usetapestry.com/) is a modern news reader that allows you to create custom timelines from various sources. These plugins extend Tapestry's capabilities to include sites that require authentication or special handling.

## Available Plugins

### Seattle Business Journal

Access Seattle Business Journal articles with your paid subscription.

**Requirements:**
- Active Seattle Business Journal subscription
- Email and password credentials

**Features:**
- Authenticated access to subscriber content
- Content filtering by topic (breaking news, real estate, tech, finance, startups)
- Customizable update intervals (15 minutes to 4 hours)
- Article images included
- Automatic session management

**Installation:**
1. Download `seattle-business-journal.tapestry` from this repository
2. In Tapestry app: Settings → Connectors → Add a Connector
3. Select the downloaded file
4. Create a feed and enter your subscription credentials

**Settings:**
- **Email**: Your subscription email address
- **Password**: Your account password
- **Update Frequency**: How often to check for new articles
- **Content Focus**: Filter articles by topic
- **Include Images**: Toggle article images on/off

## How to Use

1. **Download** the `.tapestry` file for the plugin you want
2. **Install** it in the Tapestry app via Settings → Connectors → Add a Connector
3. **Create a feed** using the new connector
4. **Configure** your settings (credentials, update frequency, etc.)
5. **Enjoy** articles in your timeline

## Plugin Development

These plugins are built using the [Tapestry API](https://github.com/TheIconfactory/Tapestry) and require authentication or special handling that standard RSS feeds cannot provide.

To build plugins from source:
```bash
git clone https://github.com/trodemaster/tapestry_plugins.git
cd tapestry_plugins
make build
```

## Support

These are community-developed plugins. For issues:

1. Verify your subscription/credentials are valid
2. Check that you can access the content via web browser
3. Try removing and re-adding the feed with fresh credentials

## Privacy

- All credentials are stored locally on your device
- No data is shared with third parties
- Plugins only access the content you explicitly configure

## Disclaimer

These plugins are not affiliated with or endorsed by their respective content providers.

