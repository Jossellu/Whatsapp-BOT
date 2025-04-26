import pandas as pd
import matplotlib.pyplot as plt
from matplotlib import colors
import os
import sys
from datetime import datetime
import re

# Configuración inicial
os.makedirs('C:/WhatsApp BOT/public/imagenes', exist_ok=True)
EXCEL_PATH = 'C:/WhatsApp BOT/data/INVENTARIO.xlsx'
IMAGENES_DIR = 'C:/WhatsApp BOT/public/imagenes'

# Función para limpiar precios
def limpiar_precio(valor):
    """Convierte un string como '$1,889.00' a float"""
    try:
        return float(str(valor).replace('$', '').replace(',', ''))
    except:
        return None

# Función principal para generar imágenes
def generar_imagen(opcion, mensaje_usuario=None, remove_last_column=False): # 👈 nuevo parámetro

    # Leer el archivo
    df = pd.read_excel(EXCEL_PATH)

    # Asegurarse de que '$ Público' esté limpio
    df['$ Público'] = df['$ Público'].apply(limpiar_precio)

    # Filtrar por almacén GENERAL
    df = df[df['Almacén'] == 'GENERAL']
    
    # Filtro por opción
    if opcion == 'INVENTARIO GAMA BAJA':
        filtrado = df[df['$ Público'] < 7000]
        filtrado.sort_values(by='$ Público', inplace=True)
        titulo = 'Inventario Gama Baja'
        nombre_imagen = 'gama_baja'

    elif opcion == 'INVENTARIO GAMA ALTA':
        filtrado = df[df['$ Público'] > 7000]
        titulo = 'Inventario Gama Alta'
        nombre_imagen = 'gama_alta'

    else:
        stopwords = set([
        'muestrame', 'quiero', 'color', 'de', 'con', 'un', 'una', 'el', 'la', 'los', 'las','Enséñame', 
        'me', 'por','gb','GB','ram','RAM','favor', 'busca', 'mostrar','equipos', 'enseñame', 'ver',
        'en', 'modelo','modelos', 'dame','almacenamiento','memoria','capacidad','equipo', 'Muéstrame','muéstrame','enséñame'
        ])

        def limpiar_opcion(opcion):
            palabras = re.findall(r'\w+', opcion.lower())
            keywords = [p for p in palabras if p not in stopwords]
            return keywords

        palabras_clave = limpiar_opcion(opcion)
        filtrado = df[df['Descripción de producto'].str.lower().apply(
            lambda x: all(p in x for p in palabras_clave)
        )]
        nombre_imagen = 'busqueda_modelo'
    
    # Columnas a mostrar
    columnas_a_mostrar = ['Descripción de producto', '$ Público', '$ Distri.', 'Dispo.']

    # 👇 Aquí eliminamos la última columna si es necesario
    if remove_last_column and len(columnas_a_mostrar) > 0:
        columnas_a_mostrar = columnas_a_mostrar[:-1]

    filtrado = filtrado[columnas_a_mostrar].head(60)
    filtrado = filtrado.rename(columns={'$ Distri.': '$Sub Distri'})

    if filtrado.empty:
        print("No se encontraron datos para la opción seleccionada.")
        return None
    # Configuración dinámica
    num_rows = len(filtrado)
    max_desc_width = max([len(str(x)) for x in filtrado['Descripción de producto']]) if 'Descripción de producto' in filtrado.columns else 50

    # Ajustes de tamaño (enfocados en las columnas de precios)
    fig_width = max(12, max_desc_width * 0.12 + 6)  # Más ancho para acomodar precios
    fig_height = max(6, num_rows * 0.4)

    fig, ax = plt.subplots(figsize=(fig_width, fig_height))
    ax.axis('off')

    # Colores mejorados
    color_fondo_tabla = '#f0f8ff'        # Azul muy clarito de fondo
    color_encabezados = '#1e3d59'        # Azul oscuro elegante
    color_filas_pares = '#e8f0fe'        # Azul pastel para filas pares
    color_filas_impares = '#ffffff'      # Blanco para filas impares
    color_texto_precio = '#d7263d'       # Rojo llamativo para precios

    # Crear la tabla
    tabla = ax.table(
        cellText=filtrado.values,
        colLabels=filtrado.columns,
        cellLoc='center',
        loc='center',
        colWidths=[0.55] + [0.2] * (len(filtrado.columns) - 1)  # Ajuste dinámico
    )

    # Estilos de la tabla
    tabla.auto_set_font_size(False)
    tabla.set_fontsize(15)  # Letras un poquito más grandes para impacto

    # Aplicar estilos a celdas
    for (i, j), cell in tabla.get_celld().items():
        cell.set_edgecolor('gray')
        if i == 0:
            cell.set_facecolor(color_encabezados)
            cell.set_text_props(color='white', weight='bold', size=15)
        elif i > 0:
            # Alternar colores en filas
            cell.set_facecolor(color_filas_pares if i % 2 == 0 else color_filas_impares)
            
            # Alinear a la izquierda la descripción
            if j == 0:
                cell.set_text_props(ha='left', weight='bold')
                cell._text.set_horizontalalignment('left')
                cell._text.set_position((0.02, 0))
            
            # Resaltar el precio público con color rojo
            if filtrado.columns[j] == '$Sub Distri':
                cell.set_text_props(color=color_texto_precio, weight='bold')

    # Ajustar columnas automáticamente
    tabla.auto_set_column_width([0])
    tabla.scale(1, 2)  # Más alto para dar más aire a las filas

    # Cambiar fondo general de la figura
    fig.patch.set_facecolor(color_fondo_tabla)

    # Ajustar layout
    fig.tight_layout(rect=[0, 0, 1, 0.95])  # Un poco más de espacio arriba

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_imagen = f"{nombre_imagen}_{timestamp}.png"
    ruta_imagen = os.path.join(IMAGENES_DIR, nombre_imagen).replace('\\', '/')

    try:
        plt.savefig(ruta_imagen, bbox_inches='tight')
        plt.close()
        print(ruta_imagen)
        return ruta_imagen
    except Exception as e:
        print(f"Error al guardar la imagen: {e}")
        return None

# Si el script es ejecutado directamente
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Por favor, proporcione la opción a generar (INVENTARIO GAMA BAJA, INVENTARIO GAMA ALTA, o BUSCAR MODELO)")
    else:
        opcion = sys.argv[1]
        mensaje_usuario = sys.argv[2] if len(sys.argv) > 2 else None
        # 👇 Leer el parámetro opcional remove_last_column (default a False)
        remove_last_column = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
        generar_imagen(opcion, mensaje_usuario, remove_last_column)

