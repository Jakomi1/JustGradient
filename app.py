from flask import Flask, render_template, request, jsonify
import colorsys
import re
import json

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
        characters_per_segment = (len(text) - 1) / total_segments if len(text) > 1 else 0
        
        for i, char in enumerate(text):
            if len(text) == 1:
                segment_index = 0
                segment_progress = 0
            else:
                segment_index = min(int(i / characters_per_segment), total_segments - 1)
                segment_progress = (i - (segment_index * characters_per_segment)) / characters_per_segment
            
            start_color = colors[segment_index]
            end_color = colors[segment_index + 1]
            interpolated_color = ColorUtils.interpolate_color(start_color, end_color, segment_progress)
            
            results.append({
                'character': char,
                'color': interpolated_color,
                'index': i
            })
        
        return results

# Predefined color schemes
PREDEFINED_SCHEMES = [
    {
        'name': 'Neon Rainbow',
        'colors': ['#FF0080', '#FF8000', '#80FF00', '#00FF80', '#0080FF', '#8000FF'],
        'description': 'Vibrant neon colors with electric energy'
    },
    {
        'name': 'Ocean Depths',
        'colors': ['#00D4FF', '#0099CC', '#006699', '#003366'],
        'description': 'Deep ocean blues from surface to abyss'
    },
    {
        'name': 'Sunset Glow',
        'colors': ['#FFD700', '#FF8C00', '#FF4500', '#DC143C'],
        'description': 'Warm sunset colors from gold to crimson'
    },
    {
        'name': 'Forest Spirit',
        'colors': ['#90EE90', '#32CD32', '#228B22', '#006400'],
        'description': 'Natural green tones from light to deep forest'
    },
    {
        'name': 'Purple Haze',
        'colors': ['#E6E6FA', '#DDA0DD', '#9370DB', '#4B0082'],
        'description': 'Dreamy purple gradients from lavender to indigo'
    },
    {
        'name': 'Fire & Ice',
        'colors': ['#00FFFF', '#4169E1', '#FF69B4', '#FF0000'],
        'description': 'Dramatic contrast from cool ice to hot fire'
    },
    {
        'name': 'Monochrome',
        'colors': ['#FFFFFF', '#CCCCCC', '#666666', '#000000'],
        'description': 'Classic grayscale from white to black'
    },
    {
        'name': 'Cyber Punk',
        'colors': ['#00FF41', '#FFFF00', '#FF00FF', '#00FFFF'],
        'description': 'Futuristic neon colors with digital vibes'
    }
]

@app.route('/')
def index():
    return render_template('index.html', schemes=PREDEFINED_SCHEMES)

@app.route('/api/generate-gradient', methods=['POST'])
def generate_gradient():
    data = request.get_json()
    text = data.get('text', '')
    colors = data.get('colors', ['#FF0080', '#00FF80'])
    
    # Validate colors
    valid_colors = [color for color in colors if ColorUtils.is_valid_hex(color)]
    if len(valid_colors) < 2:
        return jsonify({'error': 'At least 2 valid hex colors required'}), 400
    
    # Limit text length
    if len(text) > 8:
        text = text[:10]
    
    gradient_result = ColorUtils.generate_gradient(text, valid_colors)
    
    # Generate HTML code
    html_code = ''.join([
        f'<span style="color:{item["color"]}">{item["character"]}</span>'
        for item in gradient_result
    ])
    
    return jsonify({
        'gradient': gradient_result,
        'html': html_code
    })

@app.route('/api/schemes')
def get_schemes():
    return jsonify(PREDEFINED_SCHEMES)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)