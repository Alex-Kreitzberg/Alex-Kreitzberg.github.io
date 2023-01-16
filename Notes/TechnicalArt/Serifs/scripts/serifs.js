/** Convert from event coordinate space (on the page) to SVG coordinate
 * space (within the svg, honoring responsive resizing, width/height,
 * and viewBox */
function convertPixelToSvgCoord(event) {
    const svg = event.currentTarget.ownerSVGElement;
    let p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    p = p.matrixTransform(svg.getScreenCTM().inverse());
    return p;
}

function constructDraggableReactive(draggableClassName, reactiveUpdate){
    const draggables = document.querySelectorAll('.' + draggableClassName);
    draggables.forEach(draggable => {
        draggable.addEventListener('touchstart',(e)=>{
            e.preventDefault();
        });
        let dragging = false;
        draggable.addEventListener('pointerdown', (e) => {
            dragging = true;
            e.currentTarget.setPointerCapture(e.pointerId);
        });
        draggable.addEventListener('pointerup', (e) => { dragging = false; });
        draggable.addEventListener('pointercancel', (e) => { dragging = false; });
        draggable.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            let {x, y} = convertPixelToSvgCoord(e)
            draggable.setAttribute('cx', x);
            draggable.setAttribute('cy', y);
            reactiveUpdate();
        });
    });
}
function controlPointToDictionary(controlPoint){
    return {
        x : parseInt(controlPoint.getAttribute("cx")),
        y : parseInt(controlPoint.getAttribute("cy"))
    };
}

constructDraggableReactive("arcDraggable", updateArc)
function updateArc(){
    const arcCurve = document.getElementById("arc path");

    const c1 = controlPointToDictionary(document.getElementById("arc control point 1"));
    const c2 = controlPointToDictionary(document.getElementById("arc control point 2"));
    const c3 = controlPointToDictionary(document.getElementById("arc control point 3"));
    function sqr(x){
        return x*x;
    }
    function pythag(pt1, pt2){
        return Math.sqrt(sqr(pt1.x - pt2.x) +  sqr(pt1.y - pt2.y));
    }
    const a = pythag(c1, c2);
    const b = pythag(c2, c3);
    const c = pythag(c1, c3);

    const angle = Math.acos((sqr(c) - (sqr(a) + sqr(b)))/(-2*a*b));
    const r = a*Math.tan(angle/2);

    function scaleVector(s, v){
        return {x : s*v.x, y : s*v.y };
    }

    function subVector(v, w){
        return {x: v.x - w.x, y: v.y - w.y};
    }
    function addVector(v, w){
        return {x: v.x + w.x, y: v.y + w.y};
    }
    circleEndPoint = addVector(
        scaleVector(pythag(c2, c1)/pythag(c3, c2), subVector(c3, c2)),
        c2
    );

    const d = "M" + c1.x + " , " + c1.y +
        "A" + r +" , " + r + " 0, 0, 1 "  + " " + circleEndPoint.x + "," + circleEndPoint.y +
        "L" + c2.x + "," + c2.y +
        "Z";
        arcCurve.setAttribute("d", d);
}

constructDraggableReactive("bezierDraggable", updateBezier);
function updateBezier(){
    const bezierCurve = document.getElementById("bezier path");
    const c1 = controlPointToDictionary(document.getElementById("bezier control point 1"));
    const c2 = controlPointToDictionary(document.getElementById("bezier control point 2"));
    const c3 = controlPointToDictionary(document.getElementById("bezier control point 3"));
    const d = "M" + c1.x + "," + c1.y +
        "Q" + c2.x + "," + c2.y + " " + c3.x + "," + c3.y +
        "L" + c2.x + "," + c2.y +
        "Z";
        bezierCurve.setAttribute("d", d);
}

function convertScreenToCanvasCoord(canvas, event){
    let rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top
    };
}

const letterCanvas = document.getElementById("letterPaintingExercise");
const letterCtx = letterCanvas.getContext("2d");
letterCtx.imageSmoothingEnabled = true;
let canvasDragging = false;
let xPrev = 0;
let yPrev = 0;
letterCanvas.addEventListener('touchstart', (e)=>{
    e.preventDefault();
})
letterCanvas.addEventListener("pointerdown", (e)=>{
    canvasDragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = convertScreenToCanvasCoord(letterCanvas, e);
    xPrev= p.x;
    yPrev = p.y;
});
letterCanvas.addEventListener("pointerup",()=>{canvasDragging=false;});
letterCanvas.addEventListener("pointercancel", ()=>{canvasDragging=false;});
letterCanvas.addEventListener("pointermove", (e)=>{
    if (!canvasDragging) return;
    const p = convertScreenToCanvasCoord(letterCanvas, e);
    xNext = p.x;
    yNext = p.y;
    letterCtx.beginPath();
    letterCtx.moveTo(xPrev - 10, yPrev);
    letterCtx.lineTo(xPrev + 10, yPrev);
    letterCtx.lineTo(xNext + 10, yNext);
    letterCtx.lineTo(xNext - 10, yNext);
    letterCtx.fill();
    letterCtx.rect(xPrev-10, yPrev, 20, 1);
    letterCtx.fill();
    xPrev = xNext;
    yPrev = yNext;
});

const refreshButton = document.getElementById("refreshPaintingButton");
refreshButton.onclick = () => {letterCtx.clearRect(0, 0, letterCtx.canvas.width, letterCtx.canvas.height);};

const fixedSerifCanvas = document.getElementById("FixedWidthBrushStrokeSerif");
const fixedBrushCtx = fixedSerifCanvas.getContext("2d");
const FixedBrushSlider = document.getElementById("SerifBrushProgression");
FixedBrushSlider.oninput = function(){
    const serifWidth = 300;
    fixedBrushCtx.clearRect(0, 0, fixedBrushCtx.canvas.width, fixedBrushCtx.canvas.height);
    for(let i = 0; i < this.value; i++){
        let h = serifWidth;
        let x = serifWidth - i;
        let y = Math.round(Math.sqrt(h*h - x*x));
        fixedBrushCtx.beginPath();
        fixedBrushCtx.moveTo(h-x, 0);
        fixedBrushCtx.lineTo(h, y);
        fixedBrushCtx.stroke();
    }
};