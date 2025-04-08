// Canvas setup
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// State
let isDrawing = false;
let lastX = 0, lastY = 0;
let currentTool = 'pen';
let currentColor = '#39FF14';
let currentSize = 3;
let currentPage = 0;

let canvasPages = [{
    image: null,
    history: [],
    undone: []
}];

// Elements
const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const highlightBtn = document.getElementById('highlightBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const slideNumberDiv = document.getElementById('slideNumber');

// Initialize brush size
brushSize.value = currentSize;

// Resize canvas to match screen and fix alignment
function resizeCanvas() {
    const sidebar = document.getElementById('sidebar');
    const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;

    canvas.style.width = (window.innerWidth - sidebarWidth) + 'px';
    canvas.style.height = window.innerHeight + 'px';

    canvas.width = window.innerWidth - sidebarWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

// Tool settings
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = currentSize;

// Event listeners
penBtn.onclick = () => setTool('pen');
eraserBtn.onclick = () => setTool('eraser');
highlightBtn.onclick = () => setTool('highlight');
colorPicker.oninput = (e) => currentColor = e.target.value;
brushSize.oninput = (e) => currentSize = e.target.value;
clearBtn.onclick = clearBoard;
saveBtn.onclick = saveDrawing;
nextPageBtn.onclick = nextPage;
prevPageBtn.onclick = prevPage;

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') undo();
    if (e.ctrlKey && e.key === 'y') redo();
});

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', draw);

window.addEventListener('resize', () => {
    saveCurrentState();
    resizeCanvas();
    loadImage(canvasPages[currentPage].image);
});

// Tool handler
function setTool(tool) {
    currentTool = tool;
    ctx.globalCompositeOperation = (tool === 'eraser') ? 'destination-out' : 'source-over';
}

// Drawing logic
function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.shadowBlur = 0;
    saveCurrentState();
}

function draw(e) {
    if (!isDrawing) return;
    const [x, y] = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);

    if (currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentColor;
    } else if (currentTool === 'highlight') {
        ctx.strokeStyle = currentColor + '88';
        ctx.lineWidth = currentSize * 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = currentColor;
    } else if (currentTool === 'eraser') {
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = currentSize;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }

    ctx.stroke();
    [lastX, lastY] = [x, y];
}

function getCoordinates(e) {
    if (e.type.includes('touch')) {
        e = e.touches[0];
    }
    const rect = canvas.getBoundingClientRect();
    return [
        e.clientX - rect.left,
        e.clientY - rect.top
    ];
}

// History
function saveCurrentState() {
    const dataURL = canvas.toDataURL();
    canvasPages[currentPage].history.push(dataURL);
    canvasPages[currentPage].undone = [];
    canvasPages[currentPage].image = dataURL;
}

function undo() {
    const history = canvasPages[currentPage].history;
    const undone = canvasPages[currentPage].undone;
    if (history.length > 1) {
        const last = history.pop();
        undone.push(last);
        loadImage(history[history.length - 1]);
    }
}

function redo() {
    const undone = canvasPages[currentPage].undone;
    if (undone.length > 0) {
        const redoImg = undone.pop();
        canvasPages[currentPage].history.push(redoImg);
        loadImage(redoImg);
    }
}

function clearBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCurrentState();
}

function saveDrawing() {
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = `slide-${currentPage + 1}.png`;
    link.click();
}

// Slide navigation
function nextPage() {
    saveCurrentState();
    currentPage++;
    if (!canvasPages[currentPage]) {
        canvasPages[currentPage] = {
            image: null,
            history: [],
            undone: []
        };
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        loadImage(canvasPages[currentPage].image);
    }
    updateSlideNumber();
}

function prevPage() {
    if (currentPage === 0) return;
    saveCurrentState();
    currentPage--;
    loadImage(canvasPages[currentPage].image);
    updateSlideNumber();
}

function loadImage(dataURL) {
    if (!dataURL) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function updateSlideNumber() {
    slideNumberDiv.innerText = `Slide: ${currentPage + 1}`;
}
