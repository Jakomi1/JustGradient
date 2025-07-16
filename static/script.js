let colors = ['#FF0080', '#00FF80'];
let currentGradient = [];
let currentHtml = '';

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    initializeColorInputs();
    //loadColorSchemes();

    updatePreview();
    handleTextInput(null)
    // Event listeners
    document.getElementById('textInput').addEventListener('input', handleTextInput);
    document.getElementById('addColorBtn').addEventListener('click', addColor);
    document.getElementById('copyBtn').addEventListener('click', copyHtml);
});

function handleTextInput(e) {
    const text = e?.target?.value ?? ""; // Wenn e null oder undefined ist, wird "" verwendet
    const charCount = text.length;
    document.getElementById('charCount').textContent = `${charCount}/8`;
    document.getElementById('charCount').className = `font-mono ${charCount >= 8 ? 'text-yellow-400' : 'text-blue-400'}`;
    updatePreview();
}


function initializeColorInputs() {
    const container = document.getElementById('colorInputs');
    container.innerHTML = '';

    colors.forEach((color, index) => {
        const colorInput = createColorInput(color, index);
        container.appendChild(colorInput);
    });

    updateGradientPreview();
}

function createColorInput(color, index) {
    const div = document.createElement('div');
    div.className = 'relative group';
    div.innerHTML = `
                <div class="flex items-center space-x-3 bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200">
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="relative">
                            <input
                                type="color"
                                value="${color}"
                                onchange="updateColor(${index}, this.value)"
                                class="w-12 h-12 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                                style="background-color: ${color}"
                            />
                        </div>
                        
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-300 mb-1">
                                Color ${index + 1}
                            </label>
                            <input
                                type="text"
                                value="${color}"
                                onchange="updateColor(${index}, this.value)"
                                oninput="validateHexInput(this, ${index})"
                                placeholder="#FF0000"
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                maxlength="7"
                            />
                        </div>
                    </div>
                    
                    ${colors.length > 2 ? `
                        <button
                            onclick="removeColor(${index})"
                            class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            aria-label="Remove color"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            `;
    return div;
}

function updateColor(index, value) {
    if (isValidHex(value)) {
        colors[index] = value.toUpperCase();
        updateGradientPreview();
        updatePreview();
    }
}

function validateHexInput(input, index) {
    const value = input.value.toUpperCase();
    input.value = value;

    if (isValidHex(value)) {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-600');
        updateColor(index, value);
    } else {
        input.classList.remove('border-gray-600');
        input.classList.add('border-red-500');
    }
}

function addColor() {
    const newColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    colors.push(newColor);
    initializeColorInputs();
    updatePreview();
}

function removeColor(index) {
    if (colors.length > 2) {
        colors.splice(index, 1);
        initializeColorInputs();
        updatePreview();
    }
}

function updateGradientPreview() {
    const preview = document.getElementById('gradientPreview');
    preview.style.background = `linear-gradient(to right, ${colors.join(', ')})`;
}

function isValidHex(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

async function updatePreview() {
    const text = document.getElementById('textInput').value;

    // Wenn kein Text, alles zurücksetzen
    if (!text) {
        document.getElementById('textPreview').innerHTML = '';
        document.getElementById('htmlCode').textContent = '';
        return;
    }

    try {
        // Anfrage ans Backend
        const response = await fetch('/api/generate-gradient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, colors })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        currentGradient = data.gradient;
        currentHtml = data.html;

        // 1) HTML‑Vorschau aktualisieren (echtes HTML)
        const previewHtml = data.gradient.map(item =>
            `<span style="color:${item.color}" class="inline-block transition-transform duration-200 hover:scale-110">${item.character}</span>`
        ).join('');
        document.getElementById('textPreview').innerHTML = previewHtml;

        // 2) Farb‑Code zum Kopieren vorbereiten („<#HEX>Zeichen“ pro Zeile)
        const previewData = data.gradient.map(item =>
            `<${item.color}>${item.character}</${item.color}>`
        ).join('\n');
        document.getElementById('htmlCode').textContent = previewData;

    } catch (error) {
        console.error('Error generating gradient:', error);
        // Optional: zeige Fehler in der UI an
        document.getElementById('textPreview').innerHTML =
            `<span class="text-red-500">Fehler: ${error.message}</span>`;
        document.getElementById('htmlCode').textContent = '';
    }
}





async function copyHtml() {
    const htmlCodeElem = document.getElementById('htmlCode');
    if (!htmlCodeElem || !htmlCodeElem.textContent) return;

    const textToCopy = htmlCodeElem.textContent.replace(/\n/g, "");
    const btn = document.getElementById('copyBtn');
    const originalContent = btn.innerHTML;

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            // Fallback: temporäres Textarea nutzen
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';  // Verhindert Scrollen
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (!successful) throw new Error('Fallback: Copy command was unsuccessful');
        }

        btn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Copied!</span>
        `;

        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);

    } catch (error) {
        console.error('Failed to copy:', error);
    }
}

/*async function loadColorSchemes() {
           try {
               const response = await fetch('/api/schemes');
               const schemes = await response.json();
               
               const container = document.getElementById('colorSchemes');
               container.innerHTML = '';
               
               schemes.forEach(scheme => {
                   const schemeElement = createSchemeElement(scheme);
                   container.appendChild(schemeElement);
               });
           } catch (error) {
               console.error('Error loading color schemes:', error);
           }
       }*/

/*function createSchemeElement(scheme) {
    const button = document.createElement('button');
    button.className = 'p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 text-left group';
    button.onclick = () => selectScheme(scheme);
    
    const colorDots = scheme.colors.slice(0, 4).map(color => 
        `<div class="w-4 h-4 rounded-full border border-gray-500" style="background-color: ${color}"></div>`
    ).join('');
    
    const extraColors = scheme.colors.length > 4 ? 
        `<div class="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
            <span class="text-xs text-white">+${scheme.colors.length - 4}</span>
        </div>` : '';
    
    button.innerHTML = `
        <div class="flex items-center space-x-3 mb-2">
            <div class="flex space-x-1">
                ${colorDots}
                ${extraColors}
            </div>
            <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z"></path>
            </svg>
        </div>
        
        <div class="space-y-1">
            <h4 class="font-medium text-white group-hover:text-blue-300 transition-colors">
                ${scheme.name}
            </h4>
            <p class="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                ${scheme.description}
            </p>
        </div>
    `;
    
    return button;
}*/

/*function selectScheme(scheme) {
    colors = [...scheme.colors];
    initializeColorInputs();
    updatePreview();
}*/
