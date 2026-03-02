document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        images: [], // { file, name, id }
        currentIndex: -1,
        logo: {
            img: null,
            pos: 'cc',
            size: 20,
            opacity: 0.8
        },
        text: {
            content: '',
            color: '#ffffff',
            font: 'Outfit',
            pos: 'br',
            size: 10,
            opacity: 0.8
        },
        results: []
    };

    // DOM Elements
    const picInput = document.getElementById('pic-input');
    const logoInput = document.getElementById('logo-input');
    const picUploadZone = document.getElementById('pic-upload-zone');
    const logoUploadZone = document.getElementById('logo-upload-zone');
    const fileList = document.getElementById('file-list');
    const picCountDisplay = document.getElementById('pic-count');

    // Logo Inputs
    const logoSizeInput = document.getElementById('logo-size');
    const logoOpacityInput = document.getElementById('logo-opacity');
    const logoSizeVal = document.getElementById('logo-size-val');
    const logoOpacityVal = document.getElementById('logo-opacity-val');

    // Text Inputs
    const wmText = document.getElementById('wm-text');
    const wmColor = document.getElementById('wm-color');
    const wmFont = document.getElementById('wm-font');
    const textSizeInput = document.getElementById('text-size');
    const textOpacityInput = document.getElementById('text-opacity');
    const textSizeVal = document.getElementById('text-size-val');
    const textOpacityVal = document.getElementById('text-opacity-val');

    const previewCanvas = document.getElementById('preview-canvas');
    const noPreview = document.getElementById('no-preview');
    const previewFilename = document.getElementById('preview-filename');
    const resultsGrid = document.getElementById('results-grid');
    const processBtn = document.getElementById('process-btn');
    const downloadZipBtn = document.getElementById('download-zip');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const themeToggle = document.getElementById('theme-toggle');
    const removeLogoBtn = document.getElementById('remove-logo');

    // Tab Logic
    const tabIndicator = document.getElementById('tab-indicator');
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if(tabIndicator) {
                tabIndicator.style.transform = `translateX(${index * 100}%)`;
            }
        });
    });

    // Theme Toggle
    themeToggle.addEventListener('change', () => {
        document.body.setAttribute('data-theme', themeToggle.checked ? 'dark' : 'light');
    });

    // Position Toggles
    function setupPosGrid(gridId, stateObj) {
        const grid = document.getElementById(gridId);
        grid.querySelectorAll('.pos-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                grid.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                stateObj.pos = btn.dataset.pos;
                updatePreview();
            });
        });
    }

    setupPosGrid('logo-pos-grid', state.logo);
    setupPosGrid('text-pos-grid', state.text);

    // Upload Zones
    picUploadZone.addEventListener('click', () => picInput.click());
    logoUploadZone.addEventListener('click', () => logoInput.click());

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        picUploadZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
        logoUploadZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        picUploadZone.addEventListener(eventName, () => picUploadZone.classList.add('drag-active'), false);
        logoUploadZone.addEventListener(eventName, () => logoUploadZone.classList.add('drag-active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        picUploadZone.addEventListener(eventName, () => picUploadZone.classList.remove('drag-active'), false);
        logoUploadZone.addEventListener(eventName, () => logoUploadZone.classList.remove('drag-active'), false);
    });

    picUploadZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });
    
    logoUploadZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            logoInput.files = e.dataTransfer.files;
            handleLogoUpload({ target: logoInput });
        }
    });

    picInput.addEventListener('change', (e) => handleFiles(e.target.files));
    logoInput.addEventListener('change', handleLogoUpload);

    // Logo Listeners
    logoSizeInput.addEventListener('input', (e) => {
        state.logo.size = parseInt(e.target.value);
        logoSizeVal.textContent = state.logo.size + '%';
        updatePreview();
    });
    logoOpacityInput.addEventListener('input', (e) => {
        state.logo.opacity = parseFloat(e.target.value);
        logoOpacityVal.textContent = state.logo.opacity;
        updatePreview();
    });

    // Text Listeners
    wmText.addEventListener('input', (e) => { state.text.content = e.target.value; updatePreview(); });
    wmColor.addEventListener('input', (e) => { state.text.color = e.target.value; updatePreview(); });
    wmFont.addEventListener('change', (e) => { state.text.font = e.target.value; updatePreview(); });
    textSizeInput.addEventListener('input', (e) => {
        state.text.size = parseInt(e.target.value);
        textSizeVal.textContent = state.text.size + '%';
        updatePreview();
    });
    textOpacityInput.addEventListener('input', (e) => {
        state.text.opacity = parseFloat(e.target.value);
        textOpacityVal.textContent = state.text.opacity;
        updatePreview();
    });

    // Functions
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const id = Date.now() + Math.random();
            state.images.push({ file, name: file.name, id });
        });
        renderFileList();
        if (state.currentIndex === -1 && state.images.length > 0) {
            state.currentIndex = 0;
            updatePreview();
        }
    }

    window.removeFile = (id) => {
        const idx = state.images.findIndex(img => img.id === id);
        state.images.splice(idx, 1);
        if (state.currentIndex >= state.images.length) state.currentIndex = state.images.length - 1;
        renderFileList();
        if (state.images.length === 0) renderNoPreview();
        else updatePreview();
    };

    function renderFileList() {
        fileList.innerHTML = '';
        state.images.forEach((img, idx) => {
            const li = document.createElement('li');
            li.className = `file-item ${idx === state.currentIndex ? 'active' : ''}`;
            li.innerHTML = `<span>${img.name}</span> <button class="btn-clear" onclick="event.stopPropagation(); removeFile(${img.id})">&times;</button>`;
            li.onclick = () => { state.currentIndex = idx; renderFileList(); updatePreview(); };
            fileList.appendChild(li);
        });
        picCountDisplay.textContent = state.images.length;
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.logo.img = img;
                document.getElementById('logo-thumb').src = event.target.result;
                document.getElementById('logo-preview-container').classList.remove('hidden');
                updatePreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeLogoBtn.onclick = () => {
        state.logo.img = null;
        document.getElementById('logo-thumb').src = '';
        document.getElementById('logo-preview-container').classList.add('hidden');
        logoInput.value = '';
        updatePreview();
    };

    function renderNoPreview() {
        previewCanvas.style.display = 'none';
        noPreview.style.display = 'block';
        previewFilename.textContent = 'No image selected';
    }

    let previewDebounce;
    async function updatePreview() {
        if (state.currentIndex === -1 || state.images.length === 0) { renderNoPreview(); return; }
        clearTimeout(previewDebounce);
        previewDebounce = setTimeout(async () => {
            const currentImgInfo = state.images[state.currentIndex];
            previewFilename.textContent = currentImgInfo.name;
            noPreview.style.display = 'none';
            previewCanvas.style.display = 'block';
            const mainImg = await loadImage(currentImgInfo.file);
            drawToCanvas(previewCanvas, mainImg);
        }, 50);
    }

    function loadImage(file) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function drawToCanvas(canvas, mainImg) {
        const ctx = canvas.getContext('2d');
        canvas.width = mainImg.width;
        canvas.height = mainImg.height;
        ctx.drawImage(mainImg, 0, 0);

        const baseDim = Math.min(canvas.width, canvas.height);
        const padding = baseDim * 0.05;

        // Draw Logo
        if (state.logo.img) {
            ctx.globalAlpha = state.logo.opacity;
            const wmWidth = baseDim * (state.logo.size / 100);
            const wmHeight = (state.logo.img.height / state.logo.img.width) * wmWidth;
            const pos = calculatePosition(canvas.width, canvas.height, wmWidth, wmHeight, state.logo.pos, padding);
            ctx.drawImage(state.logo.img, pos.x, pos.y, wmWidth, wmHeight);
        }

        // Draw Text
        if (state.text.content) {
            ctx.globalAlpha = state.text.opacity;
            const fontSize = baseDim * (state.text.size / 100);
            ctx.font = `${fontSize}px "${state.text.font}", sans-serif`;
            ctx.fillStyle = state.text.color;

            // Set alignment based on position key
            const posKey = state.text.pos;

            // Horizontal Alignment
            if (posKey.includes('l')) {
                ctx.textAlign = 'left';
            } else if (posKey.includes('r')) {
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'center';
            }

            // Vertical Alignment
            if (posKey.includes('t')) {
                ctx.textBaseline = 'top';
            } else if (posKey.includes('b')) {
                ctx.textBaseline = 'bottom';
            } else {
                ctx.textBaseline = 'middle';
            }

            // Calculate Coordinates
            let x, y;

            if (ctx.textAlign === 'left') x = padding;
            else if (ctx.textAlign === 'right') x = canvas.width - padding;
            else x = canvas.width / 2;

            if (ctx.textBaseline === 'top') y = padding;
            else if (ctx.textBaseline === 'bottom') y = canvas.height - padding;
            else y = canvas.height / 2;

            ctx.fillText(state.text.content, x, y);
        }
        ctx.globalAlpha = 1.0;
        // Reset defaults
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }

    function calculatePosition(cw, ch, ww, wh, posKey, padding) {
        switch (posKey) {
            case 'tl': return { x: padding, y: padding };
            case 'tc': return { x: (cw - ww) / 2, y: padding };
            case 'tr': return { x: cw - ww - padding, y: padding };
            case 'ml': return { x: padding, y: (ch - wh) / 2 };
            case 'cc': return { x: (cw - ww) / 2, y: (ch - wh) / 2 };
            case 'mr': return { x: cw - ww - padding, y: (ch - wh) / 2 };
            case 'bl': return { x: padding, y: ch - wh - padding };
            case 'bc': return { x: (cw - ww) / 2, y: ch - wh - padding };
            case 'br': return { x: cw - ww - padding, y: ch - wh - padding };
            default: return { x: (cw - ww) / 2, y: (ch - wh) / 2 };
        }
    }

    processBtn.onclick = async () => {
        if (state.images.length === 0) return alert('Upload images first');
        processBtn.disabled = true;
        progressContainer.classList.remove('hidden');
        resultsGrid.innerHTML = '';
        state.results = [];
        const offscreen = document.createElement('canvas');
        for (let i = 0; i < state.images.length; i++) {
            const mainImg = await loadImage(state.images[i].file);
            drawToCanvas(offscreen, mainImg);
            const mime = state.images[i].file.type || 'image/png';
            const blob = await new Promise(resolve => offscreen.toBlob(resolve, mime, 1.0));
            state.results.push({ blob, name: `watermarked_${state.images[i].name}` });
            const thumb = document.createElement('img');
            thumb.className = 'result-thumb';
            thumb.src = URL.createObjectURL(blob);
            resultsGrid.appendChild(thumb);
            const percent = Math.round(((i + 1) / state.images.length) * 100);
            progressBar.style.width = percent + '%';
            progressText.textContent = percent + '%';
        }
        processBtn.disabled = false;
        downloadZipBtn.classList.remove('hidden');
    };

    downloadZipBtn.onclick = async () => {
        const zip = new JSZip();
        state.results.forEach(res => zip.file(res.name, res.blob));
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `watermark_pro_batch_${Date.now()}.zip`;
        link.click();
    };
});
