#!/bin/zsh

# Check if extension name is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <extension-name>"
    echo "Example: $0 prototyper"
    exit 1
fi

EXTENSION_NAME="$1"
EXTENSION_PATH="extensions/$EXTENSION_NAME"

# Check if extension directory exists
if [ ! -d "$EXTENSION_PATH" ]; then
    echo "Error: Extension directory '$EXTENSION_PATH' does not exist"
    echo ""
    echo "Available extensions:"
    ls -1 extensions/ 2>/dev/null || echo "No extensions directory found"
    exit 1
fi

echo "Getting extension console snapshot for: $EXTENSION_NAME"
echo "Extension path: $EXTENSION_PATH"
echo "================================================"

# Change to extension directory
cd "$EXTENSION_PATH" || exit 1

echo "Setting pnpm version to 20.19.2..."
pnpm use 20.19.2

echo ""
echo "Running pnpm build..."
echo "---------------------"

# Capture build output and exit code
BUILD_OUTPUT=$(pnpm build 2>&1)
BUILD_EXIT_CODE=$?

echo "$BUILD_OUTPUT"

echo ""
echo "Build completed with exit code: $BUILD_EXIT_CODE"
echo "================================================"

# Show package.json info
echo ""
echo "Extension package.json info:"
echo "----------------------------"
if [ -f "package.json" ]; then
    echo "Name: $(jq -r '.name // "N/A"' package.json 2>/dev/null)"
    echo "Version: $(jq -r '.version // "N/A"' package.json 2>/dev/null)"
    echo "Main: $(jq -r '.main // "N/A"' package.json 2>/dev/null)"
    echo "Scripts: $(jq -r '.scripts | keys | join(", ") // "N/A"' package.json 2>/dev/null)"
else
    echo "No package.json found"
fi

# Show log file if it exists
echo ""
echo "Extension log file (if exists):"
echo "-------------------------------"
if [ -f "log/console.log" ]; then
    echo "Last 20 lines from log/console.log:"
    tail -20 "log/console.log"
elif [ -f "log/console.txt" ]; then
    echo "Last 20 lines from log/console.txt:"
    tail -20 "log/console.txt"
else
    echo "No console log file found (log/console.log or log/console.txt)"
fi

# Show build artifacts
echo ""
echo "Build artifacts:"
echo "---------------"
if [ -d "dist" ]; then
    echo "dist/ directory contents:"
    ls -la dist/
else
    echo "No dist/ directory found"
fi

# Show any error logs or recent changes
echo ""
echo "Recent file changes (last 5 modified files):"
echo "--------------------------------------------"
find . -type f -name "*.ts" -o -name "*.js" -o -name "*.vue" -o -name "*.json" | head -10 | xargs ls -lt | head -5

echo ""
echo "Extension console snapshot completed."
