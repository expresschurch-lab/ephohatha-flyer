/* script.js */
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const nameInput = document.getElementById('nameInput');
const fontSelector = document.getElementById('fontSelector');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const downloadBtn = document.getElementById('downloadBtn');

// Load your specific frame image
const frame = new Image();
frame.src = 'frame.png'; // Must be saved exactly as frame.png in your GitHub repo

// Reference point for user photo and text alignment
// This is critical for the cropping function to work
let userImage = null;

// Adjust these based on where your transparent circle is on a 1080x1080 canvas
const CROPPING = {
    centerX: 540,  // X coordinate of the circle's center
    centerY: 580,  // Y coordinate of the circle's center
    radius: 175,   // Radius of the transparent hole
    nameBoxY: 825  // Y coordinate of the center of the name box
};

// State to track if both photo and name are provided
let isPhotoAdded = false;
let isNameProvided = false;

// Set canvas size when the frame loads
frame.onload = function() {
    canvas.width = frame.width;
    canvas.height = frame.height;
    drawCanvas();
};

// Handle User Photo Upload
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            userImage = new Image();
            userImage.onload = () => {
                isPhotoAdded = true;
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

// Handle the main draw and crop logic
function drawCanvas() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw User Image with Cropping
    if (userImage) {
        ctx.save();
        
        // Define the circular clipping region
        ctx.beginPath();
        ctx.arc(CROPPING.centerX, CROPPING.centerY, CROPPING.radius, 0, Math.PI * 2);
        ctx.clip();
        
        // Calculate dimensions to fit and center the user photo inside the circle
        // This is complex logic to ensure it doesn't stretch
        let drawWidth, drawHeight, offsetX, offsetY;
        const targetRatio = 1; // Square target ratio for the crop
        const imgRatio = userImage.width / userImage.height;

        if (imgRatio > targetRatio) {
            // Wider than tall
            drawHeight = CROPPING.radius * 2;
            drawWidth = userImage.width * (drawHeight / userImage.height);
            offsetX = CROPPING.centerX - (drawWidth / 2);
            offsetY = CROPPING.centerY - CROPPING.radius;
        } else {
            // Taller than wide
            drawWidth = CROPPING.radius * 2;
            drawHeight = userImage.height * (drawWidth / userImage.width);
            offsetX = CROPPING.centerX - CROPPING.radius;
            offsetY = CROPPING.centerY - (drawHeight / 2);
        }
        
        ctx.drawImage(userImage, offsetX, offsetY, drawWidth, drawHeight);
        ctx.restore();
    }
    
    // 3. Draw the Flyer Frame on top
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    
    // 4. Draw User Name onto the Bar
    const name = nameInput.value.trim().toUpperCase();
    if (name) {
        ctx.save();
        
        // Set the selected font and size
        ctx.font = `600 ${fontSizeSlider.value}px '${fontSelector.value}', sans-serif`;
        ctx.fillStyle = '#111111'; // Text color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Ensure name is horizontally centered on the name box bar
        ctx.fillText(name, CROPPING.centerX, CROPPING.nameBoxY);
        ctx.restore();
    }
}

// Update Download Button
function updateDownloadButtonState() {
    if (isPhotoAdded && isNameProvided) {
        downloadBtn.disabled = false;
        downloadBtn.style.opacity = "1";
    } else {
        downloadBtn.disabled = true;
        downloadBtn.style.opacity = "0.6";
    }
}

// Trigger the download of the final flyer
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `my-concert-flyer-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});