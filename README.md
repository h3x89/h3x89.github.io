# h3x89.github.io

# h3x89.github.io

- [h3x89.github.io](https://h3x89.github.io)
- [robertkubis.pl](http://robertkubis.pl)

## Personal Website

This is my personal website featuring an interactive portfolio with several engaging elements:

- A modern, responsive design with smooth animations
- An interactive terminal interface that responds to commands
- A Matrix-style visual effect as a fun Easter egg
- A nostalgic Clippy assistant providing helpful tips
- Comprehensive overview of my professional journey, including:
  - 10+ years of IT experience
  - Leadership roles and team management
  - Cloud & DevOps expertise
  - AI and automation initiatives

## TODO

- [x] create portfolio page based on: <https://github.com/topics/personal-website>
- [x] add linkedin profile
- [x] add github profile
- [x] add resume
- [ ] add phone number
- [ ] add email contact form
- [ ] add https support for robertkubis.pl
- [ ] add website monitoring

## Running the Application

Due to browser security restrictions (CORS policy), you cannot run this application by simply opening the HTML file directly in a browser. Modern browsers block access to local JavaScript files when using the `file://` protocol.

### Local Development Server

To run the application locally, you need to serve it through an HTTP server. Here are a few ways to do this:

1. Using Python (recommended):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

2. Using Node.js (if you have it installed):

```bash
npx http-server
```

Then open <http://localhost:8080> in your browser.

### Why a Local Server is Needed

Modern browsers implement security measures that prevent web pages loaded via `file://` protocol from loading JavaScript modules. This is a security feature that helps prevent malicious scripts from accessing local files on your computer.

When you try to open the website directly from the filesystem:

- The browser blocks JavaScript module imports
- CORS (Cross-Origin Resource Sharing) errors occur
- The interactive features of the website won't work

Using a local HTTP server:

- Properly serves the JavaScript modules
- Avoids CORS issues
- Simulates a production environment
- Allows all features to work as intended

## Features

- Interactive terminal interface (double-click the terminal text)
- Matrix effect Easter egg (double-click the quote)
- Clippy assistant
- Responsive design
- Modern UI with smooth animations

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6 Modules) for modular code organization and component-based architecture
- Font Awesome 6.5.1 for scalable vector icons and improved visual elements
- Custom JavaScript modules for:
  - Interactive terminal simulation
  - Matrix rain effect animation
  - Clippy assistant functionality
