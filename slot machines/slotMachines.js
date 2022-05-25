"use strict";
const canvas = document.getElementById('Canvas');
const gl = canvas.getContext('webgl');
var angleInDeg = 0;

var m3 = {
  dotProduct: function (mat1, mat2) {
    return [
      mat1[0] * mat2[0] + mat1[1] * mat2[3] + mat1[2] * mat2[6], mat1[0] * mat2[1] + mat1[1] * mat2[4] + mat1[2] * mat2[7], mat1[0] * mat2[2] + mat1[1] * mat2[5] + mat1[2] * mat2[8],
      mat1[3] * mat2[0] + mat1[4] * mat2[3] + mat1[5] * mat2[6], mat1[3] * mat2[1] + mat1[4] * mat2[4] + mat1[5] * mat2[7], mat1[3] * mat2[2] + mat1[4] * mat2[5] + mat1[5] * mat2[8],
      mat1[6] * mat2[0] + mat1[7] * mat2[3] + mat1[8] * mat2[6], mat1[6] * mat2[1] + mat1[7] * mat2[4] + mat1[8] * mat2[7], mat1[6] * mat2[2] + mat1[7] * mat2[5] + mat1[8] * mat2[8]
    ];
  },
  rotationAboutZ: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1
    ];
  },

  rotationAboutX: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      1, 0, 0,
      0, c, -s,
      0, s, c
    ];
  },

  rotationAboutY: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
      c, 0, s,
      0, 1, 0,
      -s, 0, c
    ];
  },

  scaling: function (sx, sy, sz) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, sz,
    ];
  },
};

var m4 = {

  perspective: function (fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  translation: function (tx, ty, tz) {
    return [
      1, 0, 0, tx,
      0, 1, 0, ty,
      0, 0, 1, tz,
      0, 0, 0, 1
    ];
  },
}

const vertices = circleSectorDepth(0, 0, 100, 300, 0, 360, 40, -200);

/*const colour = [

];

for (let i = 0; i < vertices.length / 3; i++) {
  for (let j = 0; j < 3; j++) {
    colour.push(0, 0, 0, 1);
    i++;
  }
  const sample = [Math.random(), Math.random(), Math.random(), 1];
  for (let j = 0; j < 6; j++) {
    colour.push.apply(colour, sample);
    i++;
  }

}*/

var texture = [];
const ratio = 1/3; 
for (let i = 0; i < vertices.length / 3; i++) {
  for (let k = 0; k < 3; k++) {
    for (let j = 0; j < 3; j++) {
      texture.push(
        0, 0,
        0, 1,
        1, 0
      );
      texture.push(
        ratio * (j+0), ratio * (k+1),
        ratio * (j+0), ratio * (k+0),
        ratio * (j+1), ratio * (k+0),
        ratio * (j+0), ratio * (k+1),
        ratio * (j+1), ratio * (k+0),
        ratio * (j+1), ratio * (k+1)
      );
      i += 9;
    }
  }
}




const vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

/*const color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colour), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);*/

var texPoints_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texPoints_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

var texture_buffer = gl.createTexture();
var image = new Image();
image.src = "istockphoto-156732749-612x612.jpg";
image.addEventListener('load', function () {
  // Now that the image has loaded make copy it to the texture.
  gl.bindTexture(gl.TEXTURE_2D, texture_buffer);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
 // gl.generateMipmap(gl.TEXTURE_2D);
});

const vertCode = `
attribute vec2 texture;
attribute vec3 a_position;
//attribute vec4 color;
uniform vec3 u_resolution;
uniform mat3 u_matrix;
uniform mat4 u_trans;
varying vec4 vcolor;
varying vec2 vtexture;
void main() {
  vec3 position =  a_position * u_matrix ;
  vec3 zeroToOne = position / u_resolution;
  vec4 coords = vec4(zeroToOne, 1.0) * u_trans ;
  float zToDivideBy = 1.0 - coords.z;
  gl_Position =   vec4(coords.xy ,coords.z, coords.w) ;
  //vcolor = color;
  vtexture=texture;
}
`;

const vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

const fragCode = `
precision mediump float;

//varying vec4 vcolor;
varying vec2 vtexture;
uniform sampler2D fragsamper;
void main() {
   //gl_FragColor = vcolor;
   gl_FragColor =texture2D(fragsamper,vtexture);
}
`;

const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var coord = gl.getAttribLocation(shaderProgram, "a_position");
gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coord);

/*gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
var color = gl.getAttribLocation(shaderProgram, "color");
gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(color);*/


gl.bindBuffer(gl.ARRAY_BUFFER, texPoints_buffer);
var Texture = gl.getAttribLocation(shaderProgram, "texture");
gl.vertexAttribPointer(Texture, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(Texture);

var resolutionLocation = gl.getUniformLocation(shaderProgram, "u_resolution");
gl.uniform3f(resolutionLocation, gl.canvas.width, gl.canvas.height, gl.canvas.width);

/*var colorLocation = gl.getUniformLocation(shaderProgram, "u_color");
gl.uniform4fv(colorLocation, colour);*/

var spin = [true, true, true, true, true];
var finalAng = [0, 0, 0, 0, 0]

function draw() {
  gl.clearColor(0.1, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.activeTexture(gl.TEXTURE0);
  gl.viewport(0, 0, canvas.width, canvas.height);

  var matrix = m3.dotProduct(m3.rotationAboutX(-finalAng[0] * Math.PI / 180), m3.rotationAboutY(90 * Math.PI / 180));
  var matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  var trans = m4.translation(-0.75, 0, 0);
  var transLocation = gl.getUniformLocation(shaderProgram, "u_trans");
  gl.uniformMatrix4fv(transLocation, false, trans);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

  var matrix = m3.dotProduct(m3.rotationAboutX(-finalAng[1] * Math.PI / 180), m3.rotationAboutY(90 * Math.PI / 180));
  var matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  var trans = m4.translation(-0.38, 0, 0);
  var transLocation = gl.getUniformLocation(shaderProgram, "u_trans");
  gl.uniformMatrix4fv(transLocation, false, trans);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

  var matrix = m3.dotProduct(m3.rotationAboutX(-finalAng[2] * Math.PI / 180), m3.rotationAboutY(90 * Math.PI / 180));
  var matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  var trans = m4.translation(0, 0, 0);
  var transLocation = gl.getUniformLocation(shaderProgram, "u_trans");
  gl.uniformMatrix4fv(transLocation, false, trans);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

  var matrix = m3.dotProduct(m3.rotationAboutX(-finalAng[3] * Math.PI / 180), m3.rotationAboutY(90 * Math.PI / 180));
  var matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  var trans = m4.translation(0.38, 0, 0);
  var transLocation = gl.getUniformLocation(shaderProgram, "u_trans");
  gl.uniformMatrix4fv(transLocation, false, trans);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

  var matrix = m3.dotProduct(m3.rotationAboutX(-finalAng[4] * Math.PI / 180), m3.rotationAboutY(90 * Math.PI / 180));
  var matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  var trans = m4.translation(0.75, 0, 0);
  var transLocation = gl.getUniformLocation(shaderProgram, "u_trans");
  gl.uniformMatrix4fv(transLocation, false, trans);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);

  if (Math.random() < 0.065) {
    if (finalAng[0] > 360 * Math.random() && finalAng[0] % 40 == 0) { spin[0] = false; }
  }
  if (spin[0]) { finalAng[0] = (finalAng[0] + 10) % 360; }
  if (Math.random() < 0.065) {
    if (finalAng[1] > 360 * Math.random() && finalAng[1] % 40 == 0) { spin[1] = false; }
  }
  if (spin[1]) { finalAng[1] = (finalAng[1] + 10) % 360; }
  if (Math.random() < 0.065) {
    if (finalAng[2] > 360 * Math.random() && finalAng[2] % 40 == 0) { spin[2] = false; }
  }
  if (spin[2]) { finalAng[2] = (finalAng[2] + 10) % 360; }
  if (Math.random() < 0.065) {
    if (finalAng[3] > 360 * Math.random() && finalAng[3] % 40 == 0) { spin[3] = false; }
  }
  if (spin[3]) { finalAng[3] = (finalAng[3] + 10) % 360; }
  if (Math.random() < 0.065) {
    if (finalAng[4] > 360 * Math.random() && finalAng[4] % 40 == 0) { spin[4] = false; }
  }
  if (spin[4]) { finalAng[4] = (finalAng[4] + 10) % 360; }

  if (spin[0] || spin[1] || spin[2] || spin[3] || spin[4]) { requestAnimationFrame(draw); }

}


//**********************************************FUNCTIONS********************************************************** */
function circleSectorDepth(x0, y0, z0, rad, degAng_i, degAng_f, degAngStep, depth) {
  var vecPoints = [];
  vecPoints.push(x0, y0, z0);
  for (var thita = degAng_i; thita <= degAng_f; thita += degAngStep) {
    vecPoints.push(rad * Math.cos(thita * Math.PI / 180) + x0, rad * Math.sin(thita * Math.PI / 180) + y0, z0);
    if (thita - degAng_i >= degAngStep) {
      vecPoints.push(vecPoints[vecPoints.length - 2 * 3], vecPoints[vecPoints.length - 2 * 3 + 1], vecPoints[vecPoints.length - 2 * 3 + 2],
        vecPoints[vecPoints.length - 1 * 3], vecPoints[vecPoints.length - 1 * 3 + 1], vecPoints[vecPoints.length - 1 * 3 + 2],
        vecPoints[vecPoints.length - 1 * 3], vecPoints[vecPoints.length - 1 * 3 + 1], vecPoints[vecPoints.length - 1 * 3 + 2] + depth,
        vecPoints[vecPoints.length - 2 * 3], vecPoints[vecPoints.length - 2 * 3 + 1], vecPoints[vecPoints.length - 2 * 3 + 2],
        vecPoints[vecPoints.length - 1 * 3], vecPoints[vecPoints.length - 1 * 3 + 1], vecPoints[vecPoints.length - 1 * 3 + 2] + depth,
        vecPoints[vecPoints.length - 2 * 3], vecPoints[vecPoints.length - 2 * 3 + 1], vecPoints[vecPoints.length - 2 * 3 + 2] + depth);

    }
    if (degAng_i <= thita - degAngStep && thita < degAng_f) {
      vecPoints.push(x0, y0, z0, rad * Math.cos(thita * Math.PI / 180) + x0, rad * Math.sin(thita * Math.PI / 180) + y0, z0);
    }
  }
  return vecPoints;
}

var buffer;
var contextClass = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);
var dance = document.getElementById("everybodydance");
if (contextClass) {
  var context = new contextClass();
} else {
  onError;
}
var request = new XMLHttpRequest();
request.open('GET', "https://s3-us-west-2.amazonaws.com/s.cdpn.io/4273/gonna-make-you-sweat.mp3", true);
request.responseType = 'arraybuffer';
request.onload = function() {
 context.decodeAudioData(request.response, function(theBuffer) {
 buffer = theBuffer;
  }, onError);
}
request.send();

function onError() { console.log("Bad browser! No Web Audio API for you"); }

function unpress() { dance.classList.remove("pressed"); }

function playSound() {
 dance.classList.add("pressed");
  var source = context.createBufferSource();
  source.buffer = buffer;
 source.connect(context.destination);
  source.start(0);
  var delay = 2000;
  setTimeout(unpress,delay);
}
dance.addEventListener('click', function(event) { playSound(); 
  spin=[];
  spin = [true, true, true, true, true];
  draw();
});