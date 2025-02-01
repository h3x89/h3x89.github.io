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
- [ ] add website analytics
- [ ] fix console errors
- [ ] implement automated testing
  - [ ] setup e2e tests (Cypress/Playwright)
  - [ ] add visual regression tests
  - [ ] write unit tests for JS modules
  - [ ] configure CI/CD pipeline
- [ ] implement backend functionality
  - [ ] setup Python Flask server
  - [ ] configure DynamoDB integration
  - [ ] create REST API endpoints
    - [ ] POST endpoint for data submission
    - [ ] GET endpoint for data retrieval
  - [ ] integrate frontend with backend
    - [ ] implement contact form
    - [ ] add message system
  - [ ] write backend tests with pytest
- [ ] migrate to AWS infrastructure
  - [ ] setup infrastructure as code (Terraform/CloudFormation)
  - [ ] configure S3 for static hosting
  - [ ] setup CloudFront CDN
  - [ ] implement Lambda functions for backend
  - [ ] migrate DynamoDB to DynamoDB
  - [ ] configure Route53 for DNS
  - [ ] setup CI/CD with GitHub Actions
  - [ ] implement monitoring with CloudWatch
  - [ ] configure SSL certificates with ACM

## Testing Strategy

The website requires comprehensive testing to ensure reliability across different modules. Here's our testing approach:

### End-to-End (E2E) Testing

Using Cypress, Puppeteer, or Playwright to:

- Simulate user interactions with the terminal
- Verify Matrix effect animations
- Test responsive design behavior
- Ensure Clippy assistant functionality

### Visual Regression Testing

Using tools like BackstopJS or Percy to:

- Capture and compare screenshots before/after changes
- Verify CSS styles and animations
- Ensure consistent layout across different screen sizes

### Unit Testing

Using Jest for JavaScript modules:

- Test individual component logic
- Verify DOM manipulations
- Ensure module integration

### Snapshot Testing

- Create DOM snapshots for key components
- Track HTML structure changes
- Detect unintended modifications

### CI/CD Integration

Automated testing pipeline using GitHub Actions to:

- Run all tests on each commit
- Prevent merging if tests fail
- Generate test reports

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

## Backend Architecture

The website uses a Python-based backend stack for dynamic functionality:

### Server Stack

- Flask web framework for RESTful API
- DynamoDB for NoSQL database storage
- pytest for backend testing

### Key Features

- Contact form data storage
- Message system
- Dynamic content loading
- API endpoints for data interaction

### API Endpoints

- POST /api/messages - Submit user messages
- GET /api/messages - Retrieve stored messages

## AWS Architecture

The website will use serverless AWS architecture for scalability and cost-effectiveness:

### Frontend Stack

- S3 for static website hosting
- CloudFront for content delivery and caching
- Route53 for DNS management
- ACM for SSL certificates

### Backend Stack

- Lambda functions for serverless API
- API Gateway for REST endpoints
- DynamoDB for NoSQL database
- CloudWatch for monitoring and logging

### CI/CD Pipeline

- GitHub Actions for automated deployments
- GitHub Actions for build process
- S3 for artifact storage

### Infrastructure

- Terraform/CloudFormation for infrastructure as code
- IAM for access management
- CloudWatch Alarms for monitoring
- AWS Budgets for cost control

### Estimated Costs

For low traffic personal website:

- S3: ~$0.50/month
- CloudFront: ~$1.00/month
- Lambda: Free tier eligible
- DynamoDB: Free tier eligible
- Route53: ~$0.50/month per hosted zone
- Total: ~$2-5/month
