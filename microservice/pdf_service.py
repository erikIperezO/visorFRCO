# file: pdf_microservice.py
from flask import Flask, request, jsonify
import fitz  # pip install PyMuPDF
import base64
import os

app = Flask(__name__)

@app.route("/pdf_to_tiles", methods=["GET"])
def pdf_to_tiles():
    pdf_path = request.args.get("pdf_path")
    tile_width = 200
    tile_height = 200  

    if not pdf_path or not os.path.exists(pdf_path):
        return jsonify({"error": "Archivo no encontrado"}), 404

    try:
        doc = fitz.open(pdf_path)
        all_tiles = []

        for page_index, page in enumerate(doc):
            img_width, img_height = page.rect.width, page.rect.height
            tiles = []

            # recorrer en bloques
            for y in range(0, int(img_height), tile_height):
                for x in range(0, int(img_width), tile_width):
                    rect = fitz.Rect(
                        x,
                        y,
                        min(x + tile_width, img_width),
                        min(y + tile_height, img_height)
                    )
                    # Renderizar SOLO el rectángulo
                    tile_pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=rect)  
                    tile_bytes = tile_pix.tobytes("png")
                    tile_base64 = base64.b64encode(tile_bytes).decode("utf-8")

                    tiles.append({
                        "x": x,
                        "y": y,
                        "width": rect.width,
                        "height": rect.height,
                        "image": tile_base64
                    })

            all_tiles.append({
                "page_number": page_index + 1,
                "tiles": tiles
            })

        doc.close()
        return jsonify({"pages": all_tiles})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
