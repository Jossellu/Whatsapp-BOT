// src/utils/excelProcessor.js
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


export function generarExcelFiltrado(opcion) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const basePath = path.resolve('data', 'INVENTARIO.xlsx');
  const wb = xlsx.readFile(basePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(ws);

  // Función para limpiar y convertir el valor '$1,889.00' a número
  const parsePrecio = (valor) => {
    if (typeof valor !== 'string') return 0;
    return parseFloat(valor.replace(/[$,]/g, '')) || 0;
  };

  // Aplicar lógica de filtrado
  let filtrado;
  switch (opcion) {
    case 'INVENTARIO DEL DIA':
      filtrado = data.filter(item => item['Almacén'] === 'GENERAL');
      break;
    case 'GAMA MEDIA':
      filtrado = data.filter(item => parsePrecio(item['$ Público']) < 7000);
      break;
    case 'GAMA ALTA':
      filtrado = data.filter(item => parsePrecio(item['$ Público']) >= 7000);
      break;
    default:
      filtrado = [];
  }

  // Crear nuevo archivo Excel con los datos filtrados
  const nuevoWorkbook = xlsx.utils.book_new();
  const nuevoWorksheet = xlsx.utils.json_to_sheet(filtrado);
  xlsx.utils.book_append_sheet(nuevoWorkbook, nuevoWorksheet, 'Filtrado');

  // Generar nombre único para evitar colisiones
  const filename = `${opcion.toLowerCase().replace(/ /g, '_')}_${Date.now()}.xlsx`;
  const outputPath = path.join(__dirname, 'public', filename);

  xlsx.writeFile(nuevoWorkbook, outputPath);

  // Retornar ruta pública
  return `/archivos/${filename}`;
}

