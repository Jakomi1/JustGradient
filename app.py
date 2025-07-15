from flask import Flask, render_template, request, jsonify
import html
import re

app = Flask(__name__)

class ColorUtils:
    @staticmethod
    def hex_to_rgb(hex_color):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        try:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except ValueError:
            return None

    @staticmethod
    def rgb_to_hex(r, g, b):
        """Convert RGB values to hex color"""
        return f"#{r:02x}{g:02x}{b:02x}"

    @staticmethod
    def interpolate_color(color1, color2, factor):
        """Interpolate between two hex colors"""
        rgb1 = ColorUtils.hex_to_rgb(color1)
        rgb2 = ColorUtils.hex_to_rgb(color2)
        if not rgb1 or not rgb2:
            return color1
        r = int(rgb1[0] + (rgb2[0] - rgb1[0]) * factor)
        g = int(rgb1[1] + (rgb2[1] - rgb1[1]) * factor)
        b = int(rgb1[2] + (rgb2[2] - rgb1[2]) * factor)
        return ColorUtils.rgb_to_hex(r, g, b)

    @staticmethod
    def is_valid_hex(hex_color):
        """Validate hex color format"""
        pattern = r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
        return bool(re.match(pattern, hex_color))

    @staticmethod
    def generate_gradient(text, colors):
        """Generate gradient colors for each character in text"""
        if not text or len(colors) < 2:
            return []
        results = []
        total_segments = len(colors) - 1
        # Distribute characters evenly across segments
        segment_length = (len(text) - 1) / total_segments if len(text) > 1 else 0
        for i, char in enumerate(text):
            if len(text) == 1:
                seg_idx, progress = 0, 0
            else:
                seg_idx = min(int(i / segment_length), total_segments - 1)
                progress = (i - seg_idx * segment_length) / segment_length
            col = ColorUtils.interpolate_color(colors[seg_idx], colors[seg_idx + 1], progress)
            results.append({'character': char, 'color': col, 'index': i})
        return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate-gradient', methods=['POST'])
def generate_gradient():
    data = request.get_json() or {}
    text = data.get('text', '')
    colors = data.get('colors', [])

    # Validate colors
    valid_colors = [c for c in colors if ColorUtils.is_valid_hex(c)]
    if len(valid_colors) < 2:
        return jsonify({'error': 'At least 2 valid hex colors required'}), 400

    # Allow all characters including special/unicode; no length limit
    gradient = ColorUtils.generate_gradient(text, valid_colors)

    # Build HTML with escaped characters
    html_code = ''.join(
        f'<span style="color:{item["color"]}">{html.escape(item["character"])}</span>'
        for item in gradient
    )

    return jsonify({'gradient': gradient, 'html': html_code})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
