# Curate Extensible JavaScript

A comprehensive JavaScript library for extending Curate/Pydio Cells with advanced functionality including metadata management, UI components, preservation workflows, and external integrations.

## Version
Current version: **4.4.2**

## Overview

This library provides a modular set of JavaScript extensions that enhance the Curate digital preservation platform. It includes:

- **Core API Functions** - Simplified interfaces for Curate/Pydio operations
- **UI Components** - Custom modals, forms, and interactive elements
- **Metadata Management** - Schema handling and metadata mapping tools
- **Preservation Workflows** - Configuration management and validation
- **External Integrations** - AtoM connector, OAI harvesting, and more
- **Web Components** - Modern custom elements for enhanced functionality

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager
- Curate/Pydio Cells instance

### Build from Source

1. Clone the repository:
```bash
git clone https://github.com/your-org/curate-dev-js.git
cd curate-dev-js
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

This creates:
- `dist/{version}/main_{version}.js` - Versioned build
- `dist/@latest/main.js` - Latest build for easy deployment

## Usage

The library automatically exposes a global `Curate` object with all functionality.

### UI Components

```javascript
// Create a modal popup
const popup = new Curate.ui.modals.curatePopup({
  title: "Confirmation",
  message: "Are you sure you want to proceed?",
  type: "warning",
  buttonType: "okCancel"
}, {
  afterLoaded: (popup) => {
    console.log('Popup loaded');
  },
  onOk: () => {
    console.log('User confirmed');
  },
  onCancel: () => {
    console.log('User cancelled');
  }
});

popup.fire();
```

## Development

### Project Structure

- `src/` - Source code
- `dist/` - Built distributions
- `webpack.config.js` - Build configuration
- `package.json` - Dependencies and scripts

### Building

The project uses Webpack for building:

```bash
# Development build
npm run build

# The build creates versioned outputs in dist/
```

```bash
# Local development server with hot reload
npm run serve

# Access via 'http://localhost:6900/main.js'
```

```bash
# Container deployment with docker
npm run docker:up
```
