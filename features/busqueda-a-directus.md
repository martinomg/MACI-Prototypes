# Instrucciones migración 

Los datos van a dos colecciones de directus:
1. perfiles: donde se guardan las búsquedas y los resultados generativos sin procesar
2. oportunidades: donde se guardan los datos de forma estructurada

## Cómo guardarlos

La primera solicitud de búsqueda en google debe guardar:
1. la instrucción en perfiles > descripcion
2. los resultados de la búsqueda de gemini sin procesar en perfiles > resultados_raw

La segunda solicitud generativa para armar los datos estructurados: 
1. los datos estructurados sin procesar de gemini en perfiles > ofertas
2. los datos estructurados hay que ordenarlos y guardarlos en los siguientes campos
oportunidades > titulo
oportunidades > descripcion
oportunidades > horario
oportunidades > link
oportunidades > perfil requerido
oportunidades > ubicacion

