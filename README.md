# Catálogo de productos

App HTML estática para buscar productos por código, nombre o color. Incluye filtros por categoría y por disponibilidad de fotografía.

## Uso local

Desde esta carpeta:

```powershell
python -m http.server 8088 --bind 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:8088/
```

## Portainer

Subir esta carpeta como proyecto/stack y usar el `docker-compose.yml`.

La app queda publicada en el puerto `7071` del host:

```text
http://IP_DEL_SERVIDOR:7071/
```

## Datos

El catálogo está en `products.json` y las fotos en `assets/`.

El inventario se reconstruyó desde `nuevo.pdf`: contiene 484 variantes. Las 484 fotos se extrajeron del mismo PDF y se guardaron con el código exacto de cada artículo.
