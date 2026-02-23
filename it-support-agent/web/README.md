# IT Support Agent - Web Interface

A modern, beautiful web interface for the IT Support Agent powered by AWS Bedrock and API Gateway.

## Features

✨ **Modern UI/UX**
- Sleek dark theme with gradient accents
- Smooth animations and transitions
- Responsive design for all devices
- Real-time typing indicators

🔧 **Functionality**
- Chat interface for IT support queries
- API Gateway integration
- Session management
- Character count and input validation
- Configuration modal for API endpoint setup

🎨 **Design Highlights**
- Premium glassmorphism effects
- Vibrant gradient color scheme
- Custom scrollbars
- Micro-animations for enhanced UX
- Professional typography using Inter font

## Setup Instructions

### 1. Deploy Your SAM Application

First, deploy your SAM application to get the API Gateway endpoint:

```bash
cd c:\Users\izza.s\it-support-agent
sam build
sam deploy
```

After deployment, note the `ApiGatewayUrl` from the outputs.

### 2. Configure the Web Interface

1. Open `index.html` in a web browser
2. Click the settings button (⚙️) in the bottom-right corner
3. Enter your API Gateway endpoint URL (e.g., `https://your-api-id.execute-api.us-east-2.amazonaws.com/dev/`)
4. Click "Save Configuration"

### 3. Start Chatting

Simply type your IT support question in the input field and press Enter or click the send button!

## File Structure

```
web/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling with modern design system
├── script.js       # JavaScript for API integration and interactions
└── README.md       # This file
```

## API Endpoints Used

The web interface communicates with the following API endpoint:

- **POST /invoke** - Sends questions to the IT Support Agent

### Request Format

```json
{
  "question": "How do I reset my password?"
}
```

### Response Format

```json
{
  "question": "How do I reset my password?",
  "answer": "To reset your password..."
}
```

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Local Development

To run locally, simply open `index.html` in your browser. No build process required!

For a local server (optional):

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server -p 8000
```

Then visit `http://localhost:8000`

## Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* ... more variables */
}
```

### API Endpoint

The API endpoint is stored in `localStorage` and can be changed anytime via the settings modal.

## Troubleshooting

### "Not Configured" Status
- Click the settings button and enter your API Gateway URL
- Make sure the URL ends with a `/`

### API Errors
- Verify your API Gateway is deployed and accessible
- Check the browser console for detailed error messages
- Ensure CORS is properly configured in your API Gateway

### Messages Not Sending
- Check your internet connection
- Verify the API endpoint is correct
- Look for errors in the browser console (F12)

## Features Roadmap

- [ ] Session history persistence
- [ ] Export chat conversations
- [ ] Dark/Light theme toggle
- [ ] Voice input support
- [ ] File attachment support
- [ ] Multi-language support

## License

This project is part of the IT Support Agent application.

## Support

For issues or questions, please check the main project documentation.
