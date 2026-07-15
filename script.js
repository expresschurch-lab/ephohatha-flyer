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
frame.src = 'frame.png';

let userImage = null;

// Dynamic percentage-based coordinates to align perfectly with your frame layout
const GEOMETRY = {
    centerX_pct: 0.50,    // 50% (centered horizontally)
    centerY_pct: 0.315,   // 31.5% from top (perfect center of the gold shield's circle)
    radius_pct: 0.115,    // 11.5% of total width (size of the circle)
    nameBoxY_pct: 0.373,  // 37.3% from top (directly on the "NAME OF ATTENDEE" line)
    nameBoxX_pct: 0.59    // 59% from left (centered perfectly on top of the blank line "_____")
};

// Image transformation states for drag-and-scale adjustments
let imgScale = 1.0;
let imgX = 0;
let imgY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

let isPhotoAdded = false;
let isNameProvided = false;

// Set canvas size when frame loads
frame.onload = function() {
    canvas.width = frame.width;
    canvas.height = frame.height;
    
    // Initialize image positions based on loaded template dimensions
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
                
                // Reset positions to default center of the circle
                imgX = canvas.width * GEOMETRY.centerX_pct;
                imgY = canvas.height * GEOMETRY.centerY_pct;
                
                // Initialize scale to fit nicely inside the circular crop
                const targetRadius = canvas.width * GEOMETRY.radius_pct;
                const defaultSize = targetRadius * 2.2; // slightly larger than crop circle
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

// Update preview as inputs change
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

// Zoom Slider Action
zoomSlider.addEventListener('input', () => {
    imgScale = zoomSlider.value / 100;
    zoomValue.textContent = zoomSlider.value + '%';
    drawCanvas();
});

// Interactive Drag / Pan Controls directly on Canvas
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

// Attach Event Listeners to Canvas for drag actions
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
window.addEventListener('mouseup', stopDrag);

canvas.addEventListener('touchstart', startDrag, { passive: false });
canvas.addEventListener('touchmove', drag, { passive: false });
window.addEventListener('touchend', stopDrag);

// Main Drawing Function
function drawCanvas() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cropX = canvas.width * GEOMETRY.centerX_pct;
    const cropY = canvas.height * GEOMETRY.centerY_pct;
    const cropRadius = canvas.width * GEOMETRY.radius_pct;

    // 2. Draw User Image inside Clip Mask
    if (userImage) {
        ctx.save();
        
        // Define circular crop area
        ctx.beginPath();
        ctx.arc(cropX, cropY, cropRadius, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw user image centered around (imgX, imgY) with scaling applied
        const w = userImage.width * imgScale;
        const h = userImage.height * imgScale;
        ctx.drawImage(userImage, imgX - w / 2, imgY - h / 2, w, h);
        
        ctx.restore();
    }
    
    // 3. Draw Template Frame on top
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    
    // 4. Draw User Name onto the attendee line
    const name = nameInput.value.trim().toUpperCase();
    if (name) {
        ctx.save();
        ctx.font = `bold ${fontSizeSlider.value}px '${fontSelector.value}', sans-serif`;
        ctx.fillStyle = '#111111'; // Dark aesthetic font color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom'; // Sits cleanly on top of the line
        
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

// Download Trigger
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `ephphatha-flyer-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});