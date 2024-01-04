"use strict";
/**
 * Credit is given to the following people for their work:
 * https://github.com/gfxfundamentals/webgl2-fundamentals/graphs/contributors
 * This is a modified version of the code from this repository:
 * https://webgl2fundamentals.org/webgl/lessons/webgl-shadertoy.html
 * Many thanks to the authors for their hard work.
 */

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const vs = `#version 300 es
     // an attribute is an input (in) to a vertex shader.
     // It will receive data from a buffer
     in vec4 a_position;

     // all shaders have a main function
     void main() {

       // gl_Position is a special variable a vertex shader
       // is responsible for setting
       gl_Position = a_position;
     }
   `;

  const fs = `#version 300 es
   precision highp float;

   uniform vec2 iResolution;
   uniform vec2 iMouse;
   uniform float iTime;

   const vec3 White = vec3(1.0);
   const vec3 LightGrey = vec3(0.7);
   const vec3 DarkGrey = vec3(0.3);
   const vec3 Black = vec3(0.0);

   const float thickness = 0.001;

   float sdBox(vec2 b, vec2 p){
      vec2 d = abs(p)-b;
      return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
   }
   vec3 square(float r, vec2 uv){
      return mix(DarkGrey, White, step(thickness, abs(sdBox(vec2(r), uv))));
   }

   float sdCircle(float r, vec2 uv){
      return r - length(uv);
   }

   vec3 circle(float r, vec2 uv){
      return mix(DarkGrey, White, step(thickness, abs(sdCircle(r, uv))));
   }

   vec3 circleWithSquare(float r, vec2 uv){
      return mix(
         square(r, uv), 
         circle(r, uv), 
         float(circle(r, uv) != White)
      );
   }

   float sdInfiniteNestedCircles(float scale, vec2 uv){
      float radiusPower = round(
            log(length(uv))/log(1.0/sqrt(2.0)) 
            - log(scale)/log(1.0/sqrt(2.0))
      );
      return sdCircle(scale*pow(1.0/sqrt(2.0), radiusPower), uv); 
         
   }
   vec3 infiniteNestedCircles(float scale, vec2 uv){
      float circleD = sdInfiniteNestedCircles(scale, uv);
      return mix(White, DarkGrey, float(abs(circleD) <= thickness ));
   }

   float sdInfiniteNestedBoxes(float scale, vec2 uv){
      float radiusPower = 
         round(
               log(max(
                     abs(uv.x), abs(uv.y)
                  )    
               )
               /log(1.0/sqrt(2.0))
               - log(scale)/log(1.0/sqrt(2.0))
         );
      
      return sdBox(scale*vec2(pow(1.0/sqrt(2.0), radiusPower)), uv);
         
   }
   vec3 infiniteNestedBoxes(float scale, vec2 uv){
      float boxesD = sdInfiniteNestedBoxes(scale, uv);
      return mix(White, DarkGrey, float( abs(boxesD) <= thickness ));
   }

   vec3 proportionConstruction(float scale, vec2 uv){
      return mix(
         infiniteNestedBoxes(scale, uv), 
         infiniteNestedCircles(scale, uv), 
         float(infiniteNestedCircles(scale, uv) != White)
      );
   }

   void mainImage( out vec4 fragColor, in vec2 fragCoord ){
      float unit = min(iResolution.x, iResolution.y);
      float pw = 1.0/unit;
      // Normalized pixel coordinates (from 0 to 1)
      vec2 uv = fragCoord/unit;
      if(iResolution.y < iResolution.x){
         uv = uv - vec2(0.5*iResolution.x/unit, 0.5);
      }
      else{
         uv = uv - vec2(0.5, 0.5*iResolution.y/unit);
      }
      float timeToCycle = 4.0;
      float alpha = mod(iTime, timeToCycle) / timeToCycle;
      float powerCount = 1.0*alpha;
      float scale = pow(sqrt(2.0) / 2.0, -powerCount);

      // anti-alias
      int division = 4;
      float s = 1.0/float(division);
      vec4 average = vec4(0.0);
      for(float horShift = -0.5*pw; horShift <= 0.5*pw; horShift += s*pw){
         for(float verShift = -0.5*pw; verShift <= 0.5*pw; verShift += s*pw){
               average += vec4(proportionConstruction(scale, uv + vec2(horShift, verShift)), 1.0);
         }
      }
      average += vec4(proportionConstruction(scale, uv), 1.0);
      average /= average.a;
      
      // Output to screen
      fragColor = average;
   }

   out vec4 outColor;

   void main() {
     mainImage(outColor, gl_FragCoord.xy);
   }
   `;

  // setup GLSL program
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  const resolutionLocation = gl.getUniformLocation(program, "iResolution");
  const mouseLocation = gl.getUniformLocation(program, "iMouse");
  const timeLocation = gl.getUniformLocation(program, "iTime");

  // Create a vertex array object (attribute state)
  const vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // fill it with a 2 triangles that cover clip space
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // first triangle
    1, -1,
    -1, 1,
    -1, 1,  // second triangle
    1, -1,
    1, 1,
  ]), gl.STATIC_DRAW);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
    positionAttributeLocation,
    2,          // 2 components per iteration
    gl.FLOAT,   // the data is 32bit floats
    false,      // don't normalize the data
    0,          // 0 = move forward size * sizeof(type) each iteration to get the next position
    0,          // start at the beginning of the buffer
  );

  let mouseX = 0;
  let mouseY = 0;

  function setMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
  }

  canvas.addEventListener('mousemove', setMousePosition);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    setMousePosition(e.touches[0]);
  }, { passive: false });

  function render(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    //Add adjustment for high density displays.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth*dpr;
    canvas.height = canvas.clientHeight*dpr;

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(mouseLocation, mouseX, mouseY);
    gl.uniform1f(timeLocation, time);

    gl.drawArrays(
      gl.TRIANGLES,
      0,     // offset
      6,     // num vertices to process
    );

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
