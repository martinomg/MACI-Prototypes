#!/bin/zsh

# Default number of log lines to show
LOG_LINES=100

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--lines)
            LOG_LINES="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -l, --lines NUMBER    Number of log lines to show (default: 100)"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Read the container name from .env file
if [ -f ".env" ]; then
    # Extract the container name from .env
    CONTAINER_NAME=$(grep "DOCKER_DIRECTUS_CONTAINER_NAME" .env | cut -d '=' -f2)
    
    if [ -z "$CONTAINER_NAME" ]; then
        echo "Error: DOCKER_DIRECTUS_CONTAINER_NAME not found in .env file"
        exit 1
    fi
else
    echo "Error: .env file not found"
    exit 1
fi

echo "Getting Docker console snapshot for container: $CONTAINER_NAME"
echo "================================================"

# Check if container exists and is running
if ! docker ps --format "table {{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
    echo "Container '$CONTAINER_NAME' is not running or does not exist"
    echo ""
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

# Get container logs (configurable number of lines)
echo "Recent logs (last $LOG_LINES lines):"
echo "------------------------------"
docker logs --tail "$LOG_LINES" "$CONTAINER_NAME"

echo ""
echo "Container status:"
echo "----------------"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Container stats (CPU/Memory usage):"
echo "-----------------------------------"
docker stats --no-stream "$CONTAINER_NAME"
