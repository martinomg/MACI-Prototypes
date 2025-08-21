#!/bin/zsh

# List all collections by scanning the directus-config/snapshot/fields directory

echo "Available collections:"
echo ""

# Find all directories in the fields folder
for collection_dir in directus-config/snapshot/fields/*/; do
    # Check if it's actually a directory
    if [ -d "$collection_dir" ]; then
        # Extract just the collection name from the path
        collection_name=$(basename "$collection_dir")
        
        # Count the number of field files in this collection
        field_count=$(ls -1 "$collection_dir"*.json 2>/dev/null | wc -l)
        
        echo "  $collection_name ($field_count fields)"
    fi
done

echo ""
echo "Usage: ./bin/get-collections-fields.sh <collection1,collection2,...>"
