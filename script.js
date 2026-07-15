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

// Exact geometry parameters for a standard 1080x1080 canvas
const CROPPING = {
    centerX: 540,      // Centers the circular image horizontally on a 1080px wide canvas
    centerY: 495,      // Center height of the circular transparent window inside the gold shield
    radius: 125,       // Radius of the transparent hole
    nameBoxY: 595      // Vertical line center of the white "NAME OF ATTENDEE" bar
};

// Image transformation states for drag-and-scale adjustments
let imgScale = 1.0;
let imgX = CROPPING.centerX;
let imgY = CROPPING.centerY;
let isDragging = false;
let startX = 0;
let startY = 0;

let isPhotoAdded = false;
let isNameProvided = false;

// Set canvas size when frame loads
frame.onload = function() {
    canvas.width = frame.width;
    canvas.height = frame.height;
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
                
                // Initialize positions & automatic fitting scale
                const defaultSize = CROPPING.radius * 2;
                const minDimension = Math.min(userImage.width, userImage.height);
                imgScale = defaultSize / minDimension;
                
                zoomSlider.value = Math.round(imgScale * 100);
                zoomValue.textContent = zoomSlider.value + '%';
                
                imgX = CROPPING.centerX;
                imgY = CROPPING.centerY;
                
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
    
    // Scaling factor in case canvas size on screen is different from rendering size
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
    
    // 2. Draw User Image inside Clip
    if (userImage) {
        ctx.save();
        
        // Define circular crop area
        ctx.beginPath();
        ctx.arc(CROPPING.centerX, CROPPING.centerY, CROPPING.radius, 0, Math.PI * 2);
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
        ctx.fillStyle = '#0f0200'; // Match dark font aesthetic
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Render name on the white line, with an offset to sit nicely on the line
        ctx.fillText(name, CROPPING.centerX + 75, CROPPING.nameBoxY);
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
    link.download = `my-concert-flyer-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});