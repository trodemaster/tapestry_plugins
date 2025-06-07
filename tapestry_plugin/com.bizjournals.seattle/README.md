# Seattle Business Journal Connector for Tapestry

This connector allows Tapestry users to add Seattle Business Journal articles to their timeline with their paid subscription account.

## Requirements

- **Paid Subscription**: This connector requires a valid Seattle Business Journal subscription with email/password access
- **Account Credentials**: You'll need your login email and password for authentication

## Features

- **Authenticated Access**: Seamlessly connects using your subscriber credentials
- **Content Filtering**: Choose specific content categories:
  - All Content (default)
  - Breaking News
  - Real Estate
  - Technology 
  - Finance
  - Startups
- **Customizable Updates**: Set refresh intervals from 15 minutes to 4 hours
- **Web Scraping**: Intelligently extracts articles from the website
- **Clean Content**: Automatically cleans HTML and formats articles for timeline display

## Setup Instructions

1. **Install the Connector**: Save the `.tapestry` file and add it to Tapestry via Settings > Connectors > Add a Connector
2. **Create a Feed**: Tap the connector and select "Create a Feed"
3. **Enter Credentials**: Provide your Seattle Business Journal email and password
4. **Configure Settings**:
   - **Update Frequency**: How often to check for new articles (default: 30 minutes)
   - **Content Focus**: Filter articles by category (default: all)
   - **Include Images**: Toggle article images on/off
5. **Save**: Tap "Add Feed" to start receiving articles

## Authentication

This connector uses your subscriber credentials to access premium content. Your login information is stored securely on your device and is only used to authenticate with Seattle Business Journal's servers.

The connector will:
- Automatically manage session cookies
- Refresh authentication as needed
- Handle login errors gracefully

## Content Sources

The connector gathers content by:

1. **Web Scraping**: Parses the main website to extract article headlines and links
2. **Content Filtering**: Applies your selected content focus to filter articles
3. **Authentication**: Uses your credentials to access subscriber-only content

## Troubleshooting

### Common Issues

- **Plugin not suggested for bizjournals.com URLs**: Make sure you're entering the full URL `https://www.bizjournals.com/seattle`
- **Verify button missing**: Try removing and re-installing the connector, then restart Tapestry
- **"Invalid email or password"**: Double-check your credentials in the feed settings
- **"No content found"**: Try changing the content filter or increasing the update frequency
- **Authentication errors**: The connector will attempt to re-authenticate automatically

### Support

This is a community-developed connector. For issues:
1. Verify your Seattle Business Journal subscription is active
2. Check that you can log in via web browser
3. Try removing and re-adding the feed with fresh credentials

## Technical Details

- **Connector ID**: `com.bizjournals.seattle`
- **Authentication**: Basic authentication with session management
- **Content Format**: Article-style timeline items
- **Update Intervals**: 15, 30, 60, 120, or 240 minutes
- **Verification**: Required for credential validation

## Privacy

- Credentials are stored locally on your device
- No data is shared with third parties
- Sessions are managed securely with automatic cleanup

---

*This connector is not affiliated with or endorsed by Seattle Business Journal or American City Business Journals.* 