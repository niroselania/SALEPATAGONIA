# Catálogo SALE

App HTML estática para buscar productos por código, nombre o color. Incluye filtros por porcentaje de descuento, ordenamiento, precios RETAIL y SALE, y acceso al stock.

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

La app queda publicada en el puerto `7002` del host:

```text
http://IP_DEL_SERVIDOR:7002/
```

## Datos

El catálogo está en `products.json` y las fotos en `assets/`. Solo se publican los productos de la hoja `Listado de Precios` del Excel, usando la columna `sku` (columna C) como fuente de verdad.

## Actualizar el SALE

1. Copiar el Excel nuevo a la carpeta raíz del proyecto (no se sube a GitHub).
2. Instalar la dependencia una vez: `python -m pip install -r requirements.txt`.
3. Ejecutar: `python scripts/actualizar_catalogo_sale.py`.

El script reconstruye `products.json`, conserva las fotos que coincidan con el SKU y elimina las imágenes que ya no pertenecen al catálogo SALE.
