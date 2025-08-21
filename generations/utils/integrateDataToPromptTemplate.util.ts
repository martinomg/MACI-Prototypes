/**
 * Replace placeholders in a prompt template with data from an object
 * @param templateFile - a prompt template as a JSON object
 * @param dataObject - an object containing data to fill in the placeholders
 * @return the modified prompt template with placeholders filled in
 */
function integrateDataToPromptTemplate(templateFile: any, dataObject: Record<string, any>): any {
  // Create a deep copy of the template file to avoid modifying the original
  let result = JSON.parse(JSON.stringify(templateFile));

  // List of reserved keywords
  const reservedKeywords = ['message', 'prev', 'model', 'temperature', 'system'];

  // Set reserved keywords if they are defined in dataObject
  reservedKeywords.forEach(keyword => {
      if (dataObject[keyword] !== undefined) {
          result[keyword] = dataObject[keyword];
      }
  });

  // Helper function to recursively process placeholders in any value
  function processPlaceholders(value: any): any {
      if (Array.isArray(value)) {
          return value.map(processPlaceholders);
      } else if (typeof value === 'object' && value !== null) {
          return Object.fromEntries(
              Object.entries(value).map(([key, val]) => [key, processPlaceholders(val)])
          );
      } else if (typeof value === 'string') {
          return value.replace(/\$\{(\w+)\}/g, (match, key) => {
              const replacement = dataObject[key];
              if (replacement !== undefined) {
                  // If replacement is an object, stringify it after processing its placeholders
                  if (typeof replacement === 'object') {
                      const processedReplacement = processPlaceholders(replacement);
                      return JSON.stringify(processedReplacement);
                  }
                  return replacement;
              }
              return match;
          });
      } else {
          return value;
      }
  }

  // Helper function to recursively process objects and arrays
  function processElement(element: any): any {
      if (Array.isArray(element)) {
          return element.map(processElement);
      } else if (typeof element === 'object' && element !== null) {
          return Object.fromEntries(
              Object.entries(element).map(([key, value]) => [key, processElement(value)])
          );
      } else if (typeof element === 'string') {
          return processPlaceholders(element);
      } else {
          return element;
      }
  }

  // Process each key in the result object
  for (let key in result) {
      if (key === 'system') {
          if (Array.isArray(result[key])) {
              result[key] = result[key].join('\n');
          }
          if (typeof result[key] === 'string') {
              result[key] = processElement(result[key]);
          }
      } else if (key === 'message') {
          // Handle message field that can be string or array
          if (Array.isArray(result[key])) {
              result[key] = result[key].join('\n');
          }
          if (typeof result[key] === 'string') {
              result[key] = processElement(result[key]);
          }
      } else if (key === 'prev') {
          // Special handling for prev array (conversation history)
          // Process placeholders within prev array elements
          if (Array.isArray(result[key])) {
              result[key] = result[key].map(item => {
                  if (typeof item === 'object' && item !== null && item.content) {
                      // Handle content field that can be string or array
                      if (Array.isArray(item.content)) {
                          item.content = item.content.join('\n');
                      }
                      if (typeof item.content === 'string') {
                          item.content = processPlaceholders(item.content);
                      }
                  }
                  return processElement(item);
              });
          } else {
              result[key] = processElement(result[key]);
          }
      } else if (!reservedKeywords.includes(key)) {
          result[key] = processElement(result[key]);
      }
  }

  return result;
}

export default integrateDataToPromptTemplate;