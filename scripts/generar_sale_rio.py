"""
Genera sale_rio.json a partir del listado SALE RIO (xlsx).

Uso:
    python3 scripts/generar_sale_rio.py "SALE_RIO.xlsx"

El Excel debe tener, en la hoja "Hoja1", las columnas:
    B: SKU
    C: COLOR
    D: CONCAT (código = SKU+COLOR, sin espacios)
    I: Descuento especial RIO (en formato decimal, ej. 0.7 = 70%)

Si un mismo código tiene distintos descuentos en distintas filas (por talle),
se usa el descuento más alto encontrado.

El resultado es un diccionario { "CODIGO": descuento_decimal, ... } guardado
en sale_rio.json, en la raíz del sitio. Este archivo es independiente de
products.json y no se toca al correr actualizar_catalogo_sale.py, así que
el TAG "SALE RIO" del sitio sigue funcionando aunque se actualice el stock
o el catálogo general.
"""

import json
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_EXCEL = ROOT / "SALE_RIO.xlsx"
OUTPUT = ROOT / "sale_rio.json"


def as_text(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


excel = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_EXCEL
if not excel.is_file():
    raise SystemExit(f"No se encontró el Excel: {excel}")

workbook = openpyxl.load_workbook(excel, read_only=True, data_only=True)
sheet = workbook["Hoja1"]

discounts = {}
for row in sheet.iter_rows(min_row=2, max_col=9, values_only=True):
    code = as_text(row[3]).replace(" ", "")
    discount = row[8]
    if not code or discount is None:
        continue
    if code not in discounts or discount > discounts[code]:
        discounts[code] = discount

with OUTPUT.open("w", encoding="utf-8", newline="\n") as file:
    json.dump(discounts, file, ensure_ascii=False, indent=2, sort_keys=True)
    file.write("\n")

print(f"sale_rio.json generado: {len(discounts)} códigos con descuento especial RIO.")
