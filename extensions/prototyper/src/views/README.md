# Script Composer View

This view provides a user-friendly interface for creating, editing, and managing scripts within your Directus installation.

## Features

### Script Management
- **Create New Scripts**: Add new scripts with custom names and descriptions
- **Edit Existing Scripts**: Modify script code, names, descriptions, and trigger types
- **Delete Scripts**: Remove scripts you no longer need
- **Script Organization**: Browse all your scripts in an organized list

### Script Editor
- **Code Editor**: Multi-line textarea for writing JavaScript code
- **Trigger Types**: Configure how scripts should be executed:
  - Manual: Execute on demand
  - Scheduled: Run on a schedule (cron-like)
  - Event-based: Trigger on specific events
  - HTTP Webhook: Execute via HTTP requests

### Testing & Execution
- **Test Scripts**: Test your scripts before saving with the built-in test runner
- **Safe Execution**: Scripts run in a controlled environment with console output capture
- **Error Handling**: Clear error messages and debugging information

## Usage

### Accessing the View
1. Navigate to your Directus admin panel
2. Look for "Script Composer" in the main navigation
3. Click to open the script management interface

### Creating a Script
1. Click the "New Script" button
2. Enter a name and description for your script
3. Select the appropriate trigger type
4. Write your JavaScript code in the editor
5. Click "Test" to verify your script works correctly
6. Click "Save" to store your script

### Example Script
```javascript
// Example: Log current timestamp
console.log('Script executed at:', new Date().toISOString());

// Access Directus context
console.log('Available context:', Object.keys(context));

// Your custom logic here
const result = {
    message: 'Hello from Script Composer!',
    timestamp: Date.now()
};

console.log('Result:', result);
return result;
```

### Script Context
Scripts have access to a `context` object that includes:
- Directus services and utilities
- Database connection
- Current user information
- Request context (for webhook triggers)

## Technical Details

### Storage
Currently, scripts are stored in localStorage for demonstration purposes. In a production environment, you would typically:
- Create a custom Directus collection for scripts
- Use the Directus API to persist script data
- Implement proper user permissions and access control

### Security Considerations
- Scripts run in a controlled environment
- Console output is captured and sanitized
- Error handling prevents script crashes from affecting the system
- Consider implementing additional security measures for production use

## Development

### File Structure
```
src/views/
├── index.ts              # View registration
└── script-composer.vue   # Main Vue component
```

### Building
Run the build command to compile the extension:
```bash
npm run build
# or
npm run dev  # for development with watch mode
```

### Customization
You can customize the view by:
- Modifying the Vue component template and styling
- Adding new trigger types or script categories
- Integrating with external APIs or services
- Implementing custom validation rules

## API Endpoints

The view interacts with these endpoints:
- `GET /script-composer/test` - Test script execution
- `POST /script-composer/execute` - Execute scripts programmatically
- `GET /script-composer/status` - Check extension status
