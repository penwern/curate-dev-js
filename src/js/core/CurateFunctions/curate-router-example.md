# Curate Router Usage Examples

## Basic Setup

```javascript
// Initialize the router (typically done once when your app loads)
Curate.router.initialize();

// Register a simple route
Curate.router.addRoute('/dashboard', (container, context) => {
  container.innerHTML = `
    <div style="padding: 20px;">
      <h1>Dashboard</h1>
      <p>Welcome to the custom dashboard!</p>
      <button onclick="context.close()">Close</button>
    </div>
  `;
});

// Navigate to the route
Curate.router.navigate('/dashboard');
```

## Advanced Route with Parameters

```javascript
// Route with URL parameters
Curate.router.addRoute('/user/:id/profile/:tab', (container, { params, query, navigate, close }) => {
  container.innerHTML = `
    <div style="padding: 20px;">
      <h1>User Profile: ${params.id}</h1>
      <p>Current tab: ${params.tab}</p>
      <p>Query params: ${JSON.stringify(query)}</p>

      <button onclick="navigate('/user/${params.id}/profile/settings')">
        Go to Settings
      </button>
      <button onclick="close()">Close</button>
    </div>
  `;
}, { title: 'User Profile' });

// Navigate to: /custom/user/123/profile/overview?source=menu
Curate.router.navigate('/user/123/profile/overview?source=menu');
```

## Route with Cleanup

```javascript
Curate.router.addRoute('/live-data', (container, { close }) => {
  // Setup live data updates
  const interval = setInterval(() => {
    const timestamp = new Date().toLocaleTimeString();
    const dataDiv = container.querySelector('#live-data');
    if (dataDiv) {
      dataDiv.textContent = `Last updated: ${timestamp}`;
    }
  }, 1000);

  container.innerHTML = `
    <div style="padding: 20px;">
      <h1>Live Data Feed</h1>
      <div id="live-data">Loading...</div>
      <button onclick="arguments[0]()">Close</button>
    </div>
  `;

  // Bind close function to button
  container.querySelector('button').onclick = close;

  // Return cleanup function to clear interval when page closes
  return () => {
    clearInterval(interval);
    console.log('Live data feed cleanup completed');
  };
}, { title: 'Live Data' });
```

## Multiple Route Registration

```javascript
// Register multiple routes for a complete app
const routes = [
  {
    path: '/settings',
    handler: (container, { navigate }) => {
      container.innerHTML = `
        <div style="padding: 20px;">
          <h1>Settings</h1>
          <ul>
            <li><a href="#" onclick="arguments[0]('/settings/profile'); return false;">Profile</a></li>
            <li><a href="#" onclick="arguments[0]('/settings/preferences'); return false;">Preferences</a></li>
          </ul>
        </div>
      `;
      // Bind navigate function to links
      container.querySelectorAll('a').forEach(link => {
        link.onclick = (e) => {
          e.preventDefault();
          const path = link.getAttribute('onclick').match(/'([^']+)'/)[1];
          navigate(path);
        };
      });
    },
    options: { title: 'Settings' }
  },
  {
    path: '/settings/:section',
    handler: (container, { params, navigate }) => {
      container.innerHTML = `
        <div style="padding: 20px;">
          <h1>Settings - ${params.section}</h1>
          <p>Configure your ${params.section} settings here.</p>
          <button onclick="arguments[0]('/settings')">Back to Settings</button>
        </div>
      `;
      container.querySelector('button').onclick = () => navigate('/settings');
    },
    options: { title: 'Settings Details' }
  }
];

// Register all routes
routes.forEach(({ path, handler, options }) => {
  Curate.router.addRoute(path, handler, options);
});
```

## Integration with Existing UI

```javascript
// Add navigation links to existing Pydio UI
function addCustomNavigation() {
  // This would be integrated with your existing UI framework
  const navButton = document.createElement('button');
  navButton.textContent = 'Open Dashboard';
  navButton.onclick = () => Curate.router.navigate('/dashboard');

  // Add to appropriate location in Pydio UI
  // document.querySelector('.some-nav-container').appendChild(navButton);
}

// Check if router is active to modify UI behavior
if (Curate.router.isActive()) {
  const currentPage = Curate.router.getCurrentPage();
  console.log(`Currently viewing: ${currentPage.title} at ${currentPage.path}`);
}
```

## Error Handling

```javascript
Curate.router.addRoute('/async-data', async (container, { params }) => {
  container.innerHTML = '<div>Loading...</div>';

  try {
    // Simulate async data loading
    const response = await fetch('/api/data');
    const data = await response.json();

    container.innerHTML = `
      <div style="padding: 20px;">
        <h1>Data Loaded</h1>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Error Loading Data</h1>
        <p>${error.message}</p>
      </div>
    `;
  }
});
```

## Custom Configuration

```javascript
// Initialize with custom configuration
Curate.router.initialize({
  containerSelector: '#my-custom-container',
  routePrefix: '/my-app',
  showHeader: false,
  escapeClosesPage: false
});
```

## Focus Management

The router automatically includes and integrates with the `focus-trap` library. This provides:

- **Automatic focus trapping** within custom pages
- **Keyboard navigation** (Tab/Shift+Tab) stays within page boundaries
- **Focus restoration** when returning to Pydio
- **Accessibility compliance** for screen readers
- **ARIA support** for assistive technologies

All focus management happens automatically - no additional setup required!