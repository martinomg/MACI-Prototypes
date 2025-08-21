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

echo "Building extension: $EXTENSION_NAME"
echo "Extension path: $EXTENSION_PATH"
echo "================================"

# Change to extension directory
cd "$EXTENSION_PATH" || exit 1

echo "Setting pnpm version to 20.19.2..."
pnpm use 20.19.2

echo ""
echo "Running pnpm build..."
echo "---------------------"

# Run build and capture exit code
pnpm build
BUILD_EXIT_CODE=$?

echo ""
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Extension '$EXTENSION_NAME' built successfully!"
else
    echo "❌ Extension '$EXTENSION_NAME' build failed with exit code: $BUILD_EXIT_CODE"
fi

echo ""
echo "Build artifacts:"
echo "---------------"
if [ -d "dist" ]; then
    ls -la dist/
else
    echo "No dist/ directory found"
fi

exit $BUILD_EXIT_CODE
