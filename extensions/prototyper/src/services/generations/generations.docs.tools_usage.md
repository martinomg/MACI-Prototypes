# Guía de Uso de Herramientas con Google Gemini

Esta guía explica cómo usar herramientas como Google Search con el proveedor Google Gemini en tu implementación de Directus.

## Resumen

Hemos implementado soporte para herramientas (tools) tanto a través de LangChain como mediante la API nativa de Google. La implementación nativa proporciona mejor control y funcionalidad completa de las herramientas.

## Endpoints Disponibles

### 1. Endpoint Original (con soporte limitado para tools)
```
POST /generations/google/generate
```

### 2. Nuevo Endpoint con Soporte Completo para Tools
```
POST /generations/google/generateWithTools
```

## Cómo Usar Google Search

### Ejemplo con cURL (como en la documentación de Google)

```bash
curl "http://localhost:8055/generations/google/generateWithTools" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "message": "Who won the euro 2024?",
    "model": "gemini-2.0-flash-exp",
    "tools": [
      {
        "google_search": {}
      }
    ],
    "env": {
      "GOOGLEGENAI_API_KEY": "tu-api-key-aqui"
    }
  }'
```

### Ejemplo con JavaScript/TypeScript

```typescript
const response = await fetch('/generations/google/generateWithTools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Who won the euro 2024?",
    model: "gemini-2.0-flash-exp",
    tools: [
      {
        google_search: {}
      }
    ],
    temperature: 0.7,
    env: {
      GOOGLEGENAI_API_KEY: "tu-api-key-aqui"
    }
  })
});

const data = await response.json();
console.log(data.result);
```

### Ejemplo con Streaming

```typescript
const response = await fetch('/generations/google/generateWithTools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "What are the latest news about AI?",
    model: "gemini-2.0-flash-exp",
    tools: [{ google_search: {} }],
    stream: true,
    env: {
      GOOGLEGENAI_API_KEY: "tu-api-key-aqui"
    }
  })
});

// Manejo de Server-Sent Events
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader?.read() || { done: true, value: undefined };
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
```

## Parámetros de Configuración

### Parámetros Básicos
- `message`: El prompt o pregunta que quieres hacer
- `model`: Modelo de Gemini a usar (recomendado: "gemini-2.0-flash-exp")
- `tools`: Array de herramientas a usar

### Parámetros Opcionales
- `system`: Prompt del sistema
- `prev`: Historial de conversación anterior
- `temperature`: Temperatura de sampling (0-1)
- `max_tokens`: Máximo número de tokens a generar
- `stream`: Habilitar respuesta en streaming
- `env`: Variables de entorno personalizadas (incluye GOOGLEGENAI_API_KEY)

### Herramientas Disponibles

#### Google Search
```typescript
{
  tools: [
    {
      google_search: {}
    }
  ]
}
```

#### Code Execution (Ejecución de Código)
```typescript
{
  tools: [
    {
      code_execution: {}
    }
  ]
}
```

#### Combinación de Herramientas
```typescript
{
  tools: [
    {
      google_search: {}
    },
    {
      code_execution: {}
    }
  ]
}
```

## Ejemplos de Code Execution

### Ejemplo con cURL (Code Execution)

```bash
curl "http://localhost:8055/generations/google/generateWithTools" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "message": "What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.",
    "model": "gemini-2.5-flash",
    "tools": [
      {
        "code_execution": {}
      }
    ],
    "env": {
      "GOOGLEGENAI_API_KEY": "tu-api-key-aqui"
    }
  }'
```

### Ejemplo con JavaScript/TypeScript (Code Execution)

```typescript
const response = await fetch('/generations/google/generateWithTools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Calculate the factorial of 20 using Python code",
    model: "gemini-2.5-flash",
    tools: [
      {
        code_execution: {}
      }
    ],
    temperature: 0.7,
    env: {
      GOOGLEGENAI_API_KEY: "tu-api-key-aqui"
    }
  })
});

const data = await response.json();
console.log("Respuesta:", data.result.content);

// Obtener información de ejecución de código
if (data.result.codeExecution) {
  data.result.codeExecution.forEach((execution, index) => {
    console.log(`\nEjecución ${index + 1}:`);
    
    if (execution.executable_code) {
      console.log(`Código (${execution.executable_code.language}):`);
      console.log(execution.executable_code.code);
    }
    
    if (execution.code_execution_result) {
      console.log(`Resultado (${execution.code_execution_result.outcome}):`);
      console.log(execution.code_execution_result.output);
    }
    
    if (execution.text) {
      console.log(`Explicación: ${execution.text}`);
    }
  });
}
```

## Formato de Respuesta con Code Execution

Cuando usas la herramienta `code_execution`, la respuesta incluirá información sobre el código ejecutado:

```json
{
  "content": "I'll calculate the factorial of 20 using Python code.\n\nThe factorial of 20 is 2,432,902,008,176,640,000.",
  "metadata": {
    "finishReason": "STOP",
    "usage": {
      "inputTokens": 25,
      "outputTokens": 120,
      "totalTokens": 145
    }
  },
  "codeExecution": [
    {
      "executable_code": {
        "language": "PYTHON",
        "code": "import math\n\nresult = math.factorial(20)\nprint(f\"The factorial of 20 is: {result:,}\")"
      },
      "code_execution_result": {
        "outcome": "OUTCOME_OK",
        "output": "The factorial of 20 is: 2,432,902,008,176,640,000\n"
      },
      "text": "I have calculated the factorial of 20 using Python's math.factorial() function."
    }
  ]
}
```

### Estructura de codeExecution

- **executable_code**: Contiene el código que fue ejecutado
  - `language`: El lenguaje de programación usado (generalmente "PYTHON")
  - `code`: El código fuente que se ejecutó
- **code_execution_result**: Contiene el resultado de la ejecución
  - `outcome`: Estado del resultado ("OUTCOME_OK", "OUTCOME_FAILED", etc.)
  - `output`: La salida del código ejecutado
- **text**: Explicación del modelo sobre lo que hizo el código

## Diferencias entre Implementaciones

### 1. Endpoint Original `/generate`
- Usa LangChain con funcionalidades básicas
- Detecta automáticamente cuando se usan herramientas y formatea la respuesta
- Compatible con todas las herramientas de Gemini

### 2. Endpoint Mejorado `/generateWithTools`
- Usa LangChain con soporte optimizado para herramientas
- Formato de respuesta mejorado y limpio
- Soporte completo para streaming con herramientas
- Manejo avanzado de metadatos y resultados de ejecución

**Nota**: Ambos endpoints usan LangChain internamente, la diferencia está en el procesamiento y formato de la respuesta.

## Modelos Recomendados

Para usar herramientas, se recomiendan los siguientes modelos:
- `gemini-2.0-flash-exp` (experimental, mejores capacidades)
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## Manejo de Errores

La API devuelve errores en el siguiente formato:

```json
{
  "error": "Descripción del error"
}
```

Errores comunes:
- API key faltante o inválida
- Modelo no soportado para herramientas
- Límites de rate limiting de Google
- Problema con el formato del request

## Variables de Entorno

Asegúrate de tener configurada la variable:
```bash
GOOGLEGENAI_API_KEY=tu-google-api-key
```

O pásala directamente en el request usando el parámetro `env`.

## Debugging y Troubleshooting

### Verificar Configuración de Herramientas
```javascript
// Los tools deben estar definidos exactamente así:
{
  google_search: {},
  code_execution: {}
}
```

### Problemas Comunes

1. **Google Search no funciona**:
   - Verificar que el modelo sea `gemini-1.5-pro` o `gemini-1.5-flash`
   - Confirmar que `google_search: {}` esté en la configuración de tools

2. **Code Execution no responde**:
   - Asegurar que el código tenga un `print()` o resultado visible
   - Verificar que `code_execution: {}` esté en la configuración

3. **Streaming interrumpido**:
   - Los tools pueden causar pausas en el streaming mientras se ejecutan
   - Es comportamiento normal, no un error

### Logs Útiles
El servicio registra información sobre:
- Herramientas configuradas
- Respuestas de herramientas
- Errores de ejecución

## Consideraciones de Rendimiento

- **Google Search**: Puede tomar 2-5 segundos
- **Code Execution**: Tiempo variable según la complejidad del código
- **Streaming**: Se pausa durante la ejecución de herramientas
- **Rate Limits**: Respeta los límites de la API de Google

## Próximos Pasos

Para expandir el soporte de herramientas:

1. Agregar nuevos tipos de herramientas en `generations.service.types.ts`
2. Actualizar `convertToGoogleTools` en `googlegenai.provider.ts`
3. Mejorar `formatToolResponse` para nuevos tipos de metadatos
4. Documentar nuevas herramientas en este archivo
