#!/bin/zsh

# Check if collections parameter is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <collection1,collection2,...>"
    echo "Example: $0 posts,directus_sync_id_map"
    exit 1
fi

# Split the input collections by comma
collections=(${(s:,:)1})

# Start building the JSON object
echo "{"

# Flag to track if we need to add comma
first_collection=true

for collection in $collections; do
    # Add comma if not the first collection
    if [ "$first_collection" = false ]; then
        echo ","
    fi
    first_collection=false
    
    echo "  \"$collection\": {"
    
    # Handle fields
    echo "    \"fields\": {"
    field_files=(directus-config/snapshot/fields/$collection/*.json)
    
    # Check if any field files exist
    if [ -f "${field_files[1]}" ]; then
        first_field=true
        
        for file in $field_files; do
            # Extract field name from filename (remove path and .json extension)
            field_name=$(basename "$file" .json)
            
            # Add comma if not the first field
            if [ "$first_field" = false ]; then
                echo ","
            fi
            first_field=false
            
            # Read and output the field data
            echo -n "      \"$field_name\": "
            cat "$file"
        done
        echo ""
    fi
    
    echo "    },"
    
    # Handle relations
    echo "    \"relations\": {"
    relation_files=(directus-config/snapshot/relations/$collection/*.json)
    
    # Check if any relation files exist
    if [ -f "${relation_files[1]}" ]; then
        first_relation=true
        
        for file in $relation_files; do
            # Extract relation name from filename (remove path and .json extension)
            relation_name=$(basename "$file" .json)
            
            # Add comma if not the first relation
            if [ "$first_relation" = false ]; then
                echo ","
            fi
            first_relation=false
            
            # Read and output the relation data
            echo -n "      \"$relation_name\": "
            cat "$file"
        done
        echo ""
    fi
    
    echo "    }"
    echo -n "  }"
done

echo ""
echo "}"
