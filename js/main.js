//=============================================================================
// Front-end GUI application for modeler.js.
// Copyright (C) 2019 Mattias Andersson. All rights reserved.
//=============================================================================
const default_model = 'lattice.mdg';
const shaders = `@fragmentshader FS
precision mediump float;

varying vec3 normal;
varying vec4 vertPos;
varying vec3 cameraPos;
varying vec4 weight;
varying vec4 color;

uniform vec3 lightPos[4];
uniform vec3 lightColor[4];
uniform float phongPower[4];
uniform vec3 ambientColor;

const float two_pi = 6.2831853071;
const float sqrt_1_3 = 0.57735026918;

vec3 rotateHue(vec3 rgb, float hue) {
  float cosA = cos(hue * two_pi);
  float sinA = sin(hue * two_pi);
  vec3 neo = vec3(
    cosA + (1.0 - cosA) / 3.0, 
    (1.0 - cosA) / 3.0 - sqrt_1_3 * sinA, 
    (1.0 - cosA) / 3.0 + sqrt_1_3 * sinA
  );
  return vec3(
    rgb.r * neo[0] + rgb.g * neo[1] + rgb.b * neo[2],
    rgb.r * neo[2] + rgb.g * neo[0] + rgb.b * neo[1],
    rgb.r * neo[1] + rgb.g * neo[2] + rgb.b * neo[0]
  );
}

void main() {

  vec3 normal = normalize(normal);
  if (!gl_FrontFacing) {
    normal = -normal;
  }

  vec3 reflectedLightColor;  
  for(int i = 0; i <= 3; i++) {
    vec3 lightDir = normalize(vertPos.xyz - lightPos[i]);
    float lambertian = max(dot(lightDir,normal), 0.0);  
    float specular = 0.0;

    if(lambertian > 0.0) {
      vec3 reflectDir = reflect(lightDir, normal);
      vec3 viewDir = normalize(cameraPos - vertPos.xyz);
      float specAngle = max(dot(reflectDir, viewDir), 0.0);
      specular = pow(specAngle, phongPower[i]);
      reflectedLightColor += 0.5 * lambertian * color.rgb + specular * lightColor[i];
    }
  }  
  reflectedLightColor = rotateHue(reflectedLightColor, weight.a);
  gl_FragColor = vec4(ambientColor + reflectedLightColor, 1.0 + color.a);    
}
@endshader
@vertexshader VS
     attribute vec4 aVertexPosition;
     attribute vec3 aVertexNormal;
     attribute vec4 aVertexWeight;
     attribute vec4 aVertexColor;
     attribute float aVertexBone;

     uniform mat3 uNMatrix;
     uniform mat4 uPMatrix;
     uniform mat4 uBoneMatrix[60];
     uniform vec3 uCameraPos;

     varying vec4 vertPos;
     varying vec3 cameraPos;
     varying vec3 normal;
     varying vec4 weight;
     varying vec4 color;

     mat3 getNormalMat(mat4 mat) {
        return mat3(mat[0][0], mat[1][0], mat[2][0], mat[0][1], mat[1][1], mat[2][1], mat[0][2], mat[1][2], mat[2][2]);
     }

     void main(void) {
       mat4 uMVMatrix = uBoneMatrix[int(aVertexBone)];
       vertPos = aVertexPosition;
       vertPos.w = 1.0;
       vertPos = uMVMatrix * vertPos;
       cameraPos = uCameraPos;
       gl_Position = uPMatrix * vertPos;
       normal = aVertexNormal * getNormalMat(uMVMatrix);
       weight = aVertexWeight;
       color = aVertexColor;
     }
@endshader

program {
  vertexshader VS
  fragmentshader FS
  target screen
  render
}

uniform lightPos[0] -100 -300 -250
uniform lightColor[0] 1 1 1
uniform phongPower[0] 30

uniform lightPos[1] 300 -100 -100
uniform lightColor[1] 1 0.77 0.77
uniform phongPower[1] 20

uniform lightPos[2] -3000 100 2000
uniform lightColor[2] 0.75 0.5 0.5
uniform phongPower[2] 15

uniform lightPos[3] 3000 -1000 2000
uniform lightColor[3] 0.3 0.2 0.1
uniform phongPower[3] 3

uniform ambientColor 0.1 0.1 0.1
`;
var target = document.getElementById('modeler'); 
var view = Modeler.createView(target);
function buildPresets() {
  var presets = view.getPresets();
  var params = view.getParams();
  var parent = document.getElementById('presets-container');
  parent.innerHTML = '';
  if (Object.keys(params).length === 0) {   
    parent.style.display = 'none';
    window.dispatchEvent(new Event('resize'));
    return;
  }
  parent.style.display = 'block';
  if (Object.keys(presets).length !== 0) {    
    var select = document.createElement('select');
    select.id = 'select_presets';
    parent.appendChild(select);
    for (var key in presets) {
      var el = document.createElement('option');
      el.textContent = key;
      el.value = key;
      select.appendChild(el);
    }
    if (typeof selected_preset !== 'undefined') {
      select.value = selected_preset;
    }
    select.addEventListener(
      'change',
      function() {
        selected_preset = this.value;
        p = presets[this.value];
        if (p != null) {
          view.setParams(p);
          recompile();
        }
      },
      false
    );       
  }
  for (var key in params) {
    var value = params[key];
    var vtype = value['type'];
    if (vtype == 'hidden') {
      continue;
    }
    function createInput(elementType) {
      var id = 'input_' + key;
      var input = document.createElement(elementType);
      parent.appendChild(input);
      input.id = id;
      input.name = key;

      var label = document.createElement('label');
      label.id = 'label_' + key;      
      label.htmlFor = key;
      label.innerHTML = key;
      parent.insertBefore(label,input);
      return [input, label];
    }
    function paramChanged() {
      var param = {};
      param[this.name] = this.value;
      view.setParams(param);
      recompile();
    }
    switch (vtype) {
      case 'int':
      case 'float':
        var [input, label] = createInput('input');
        input.type = 'range';
        input.step = vtype == 'int' ? 1 : 'any';
        input.min = value['min'];
        input.max = value['max'];
        input.value = value['value'];
        input.classList.add('slider');    
        input.onchange = paramChanged;
        var x = document.createElement('input');
        x.name = key;
        x.type = 'number';
        x.value = input.value;
        x.onchange = paramChanged;      
        label.appendChild(x);    
        break;
      case 'bool':
        var [input, label] = createInput('input');
        input.type = 'checkbox';
        input.checked = Boolean(value['value']);
        input.onchange = function() {
          var param = {};            
          param[this.name] = this.checked;
          view.setParams(param);
          recompile();
        }
        break;
      case 'enum':
        var [input, label] = createInput('select');
        value['items'].forEach(function (item, i) {
          var el = document.createElement('option');
          el.textContent = item;
          el.value = i;
          input.appendChild(el);
        });
        input.value = value['value'];
        input.onchange = paramChanged;
        break;
    }     
  }
}
function recompile() {
  view.compile(shaders + editor.getValue());
  buildPresets();
}
const urlParams = new URLSearchParams(window.location.search);
const src = urlParams.get('src');
if (src) {
  var req1 = new XMLHttpRequest();
  req1.open('GET', src);
  req1.onload = function() {
    if (this.readyState === XMLHttpRequest.DONE) {
      editor.setValue(this.responseText);
      recompile();
    }
  }
  req1.send();
}
// ace editor keyboard shortcuts
var editor = ace.edit("editor");  
editor.commands.addCommand({
  name: 'recompile',
  bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
  exec: function(editor) {
    recompile();
  },
  readOnly: true
});
editor.commands.addCommand({
  name: 'play',
  bindKey: {win: 'Ctrl-Space',  mac: 'Command-Space'},
  exec: function(editor) {
    view.playpause();
  },
  readOnly: true
});
// set up buttons
var btn_play = document.getElementById("btn-play");
var btn_pause = document.getElementById("btn-pause");
var btn_recompile = document.getElementById("btn-recompile");
var btn_presets = document.getElementById("btn-presets");  
var btn_editor = document.getElementById("btn-editor");  
btn_recompile.onclick = function() {
  recompile();
} 
btn_play.onclick = function() {
  view.play();
  this.style.display = 'none';
  btn_pause.style.display = 'block';
}
btn_pause.onclick = function() {
  view.pause();
  this.style.display = 'none';
  btn_play.style.display = 'block';
}  

/*
function download(filename, url) {
  var save = document.createElement('a');
  save.download = filename;
  save.href = url;
  var event = document.createEvent("Event");
  event.initEvent("click");
  save.dispatchEvent(event);
}
document.getElementById("btn-download").onclick = function() {
  download('model.stl', view.exportSTL());
}
*/  
function toggleContainer(name) {
  var x = document.getElementById(name);
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
  window.dispatchEvent(new Event('resize'));
}
btn_editor.onclick = function() {
  toggleContainer("editor-container");
}
btn_presets.onclick = function() {
  toggleContainer("presets-container");
}
progress = document.getElementById("progress"); 
view.setOnProgress(function(x, total) {
  progress.value = x;
  progress.max = total;
  progress.step = 'any';
});
progress.oninput = function() { 
  view.seek(this.value); 
}

function loadFromURL(url) {
  var req = new XMLHttpRequest();
  req.open('GET', url);
  req.onload = function() {
    if (this.readyState === XMLHttpRequest.DONE) {
      editor.setValue(this.responseText);
      view.resetUserTransform();
      recompile();
    }
  }
  req.send();
}
// set up select box
var select = document.getElementById("src"); 
var req2 = new XMLHttpRequest();
req2.open('GET', 'https://api.github.com/repos/meanderix/modeler/contents/models');
req2.onload = function() {
  if (this.readyState === XMLHttpRequest.DONE) {
    var data = JSON.parse(this.response);
    data.forEach(file => {
      var el = document.createElement("option");
      el.textContent = file.name.slice(0, -4);
      el.value = file.download_url;
      if (file.name == default_model) {
        el.selected = true;
        loadFromURL(file.download_url);
      }
      select.appendChild(el);
    })
  }
}
req2.send();
select.onchange = function() {
  loadFromURL(this.value);
}