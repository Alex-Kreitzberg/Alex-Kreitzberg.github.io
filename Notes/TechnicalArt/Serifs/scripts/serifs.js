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
        let dragging = false;
        draggable.addEventListener('pointerdown', (e) => {
            dragging = true;
            e.currentTarget.setPointerCapture(e.pointerId);
        });
        draggable.addEventListener('pointerup', (e) => { dragging = false; });
        draggable.addEventListener('pointercancel', (e) => { dragging = false; });
        draggable.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            let p = convertPixelToSvgCoord(e)
            draggable.setAttribute('cx', p.x);
            draggable.setAttribute('cy', p.y);
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

const letterCanvas = document.getElementById("letterPaintingExercise");
const letterCtx = letterCanvas.getContext("2d");
letterCtx.imageSmoothingEnabled = true;
letterCanvas.addEventListener("mousedown", (e)=>{
    let xPrev = e.offsetX;
    let yPrev = e.offsetY;
    const drawOnDrag = (e) => {
        console.log("hit");
        letterCtx.beginPath();
        letterCtx.moveTo(xPrev - 10, yPrev);
        letterCtx.lineTo(xPrev + 10, yPrev);
        letterCtx.lineTo(e.offsetX + 10, e.offsetY);
        letterCtx.lineTo(e.offsetX - 10, e.offsetY);
        letterCtx.fill();
        letterCtx.rect(xPrev-10, yPrev, 20, 1);
        letterCtx.fill();
        xPrev = e.offsetX;
        yPrev = e.offsetY;
    }
    letterCanvas.addEventListener("mousemove", drawOnDrag);
    document.addEventListener("mouseup",(e) =>{
        letterCanvas.removeEventListener("mousemove", drawOnDrag);
    });
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