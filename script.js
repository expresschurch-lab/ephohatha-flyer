/* script.js */
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const nameInput = document.getElementById('nameInput');
const fontSelector = document.getElementById('fontSelector');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const downloadBtn = document.getElementById('downloadBtn');

// Zoom & Adjust elements
const photoAdjustControls = document.getElementById('photoAdjustControls');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');

// Load frame template
const frame = new Image();
frame.src = 'frame.png'; // Make sure your file is named frame.png or frame.jpg in your repo!

let userImage = null;

// Exact 1:1 proportional layout coordinates from your template
const GEOMETRY = {
    centerX_pct: 0.50,    // Perfectly centered horizontally (50%)
    centerY_pct: 0.475,   // Center of the gold shield's black opening (47.5%)
    radius_pct: 0.105,    // Size of the black crop window (10.5%)
    nameBoxX_pct: 0.63,   // Centered horizontally over the blank line "_____" (63%)
    nameBoxY_pct: 0.605   // Sits perfectly on top of the black attendee line (60.5%)
};

// Image transformation states for dragging and zooming
let imgScale = 1.0;
let imgX = 0;
let imgY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

let isPhotoAdded = false;
let isNameProvided = false;

// Set canvas size when the frame loads to match its original high-res dimensions
frame.onload = function() {
    canvas.width = frame.width;
    canvas.height = frame.height;
    
    // Default image focal point is the center of the frame's circle
    imgX = canvas.width * GEOMETRY.centerX_pct;
    imgY = canvas.height * GEOMETRY.centerY_pct;
    
    drawCanvas();
};

// Handle Photo Upload
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            userImage = new Image();
            userImage.onload = () => {
                isPhotoAdded = true;
                photoAdjustControls.style.display = 'block';
                
                // Initialize photo position in the center of the circle
                imgX = canvas.width * GEOMETRY.centerX_pct;
                imgY = canvas.height * GEOMETRY.centerY_pct;
                
                // Fit photo inside the crop window automatically
                const targetRadius = canvas.width * GEOMETRY.radius_pct;
                const defaultSize = targetRadius * 2.2; 
                const minDimension = Math.min(userImage.width, userImage.height);
                imgScale = defaultSize / minDimension;
                
                zoomSlider.value = Math.round(imgScale * 100);
                zoomValue.textContent = zoomSlider.value + '%';
                
                drawCanvas();
                updateDownloadButtonState();
            };
            userImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Live-render update inputs
nameInput.addEventListener('input', () => {
    isNameProvided = nameInput.value.trim() !== "";
    drawCanvas();
    updateDownloadButtonState();
});

fontSelector.addEventListener('change', drawCanvas);
fontSizeSlider.addEventListener('input', () => {
    fontSizeValue.textContent = fontSizeSlider.value + 'px';
    drawCanvas();
});

// Scale Photo via Zoom Slider
zoomSlider.addEventListener('input', () => {
    imgScale = zoomSlider.value / 100;
    zoomValue.textContent = zoomSlider.value + '%';
    drawCanvas();
});

// Interactive Drag/Pan Logic
function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDrag(e) {
    if (!userImage) return;
    isDragging = true;
    const pos = getCanvasMousePos(e);
    startX = pos.x - imgX;
    startY = pos.y - imgY;
}

function drag(e) {
    if (!isDragging || !userImage) return;
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    imgX = pos.x - startX;
    imgY = pos.y - startY;
    drawCanvas();
}

function stopDrag() {
    isDragging = false;
}

// Canvas Touch/Mouse Listeners
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
window.addEventListener('mouseup', stopDrag);

canvas.addEventListener('touchstart', startDrag, { passive: false });
canvas.addEventListener('touchmove', drag, { passive: false });
window.addEventListener('touchend', stopDrag);

// Canvas Render Loop
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cropX = canvas.width * GEOMETRY.centerX_pct;
    const cropY = canvas.height * GEOMETRY.centerY_pct;
    const cropRadius = canvas.width * GEOMETRY.radius_pct;

    // 1. Draw User Image inside Circular Crop
    if (userImage) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cropX, cropY, cropRadius, 0, Math.PI * 2);
        ctx.clip();
        
        const w = userImage.width * imgScale;
        const h = userImage.height * imgScale;
        ctx.drawImage(userImage, imgX - w / 2, imgY - h / 2, w, h);
        ctx.restore();
    }
    
    // 2. Draw Frame Template on Top
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    
    // 3. Draw Attendee Name
    const name = nameInput.value.trim().toUpperCase();
    if (name) {
        ctx.save();
        ctx.font = `bold ${fontSizeSlider.value}px '${fontSelector.value}', sans-serif`;
        ctx.fillStyle = '#0f0200'; // Dark text styling matching template
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; // Renders exactly on top of the black line
        
        const textX = canvas.width * GEOMETRY.nameBoxX_pct;
        const textY = canvas.height * GEOMETRY.nameBoxY_pct;
        
        ctx.fillText(name, textX, textY);
        ctx.restore();
    }
}

// Update Download Button State
function updateDownloadButtonState() {
    if (isPhotoAdded && isNameProvided) {
        downloadBtn.disabled = false;
        downloadBtn.style.opacity = "1";
    } else {
        downloadBtn.disabled = true;
        downloadBtn.style.opacity = "0.6";
    }
}

// Trigger image download
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `ephphatha-flyer-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});