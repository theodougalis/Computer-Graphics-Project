
Texture_Projector = function(){
  this.frame = [0,0,0];

  /* update the projector with the current car position */
  this.update = function(car_frame){
    this.frame = car_frame.slice();
  }

  /* return the transformation matrix to transform from world coordiantes to the view reference frame */
  this.matrix = function(){
    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();

    glMatrix.vec3.transformMat4(eye, [0.0, 1.0, -0.1, 1.0], this.frame);

    glMatrix.vec3.transformMat4(target, [0,1,-4.0,1.0], this.frame);
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);
  }
}

Renderer.HeadLightProjector = new Texture_Projector();




/*
create the buffers for an object as specified in common/shapes/triangle.js
*/
Renderer.createObjectBuffers = function (gl, obj) {

  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  if(typeof obj.texCoords != 'undefined'){
    obj.texCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  //** */
  obj.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  //** */

  
  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  var edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (var i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6 + 0] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3 + 0];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};



//Create Textures 
Renderer.loadTexture = function (tu, url, gl){
  
	var image = new Image();
	image.src = url;
	image.addEventListener('load',function(){
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.activeTexture(gl.TEXTURE0+tu);	
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,texture);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		});
	}



/*
draw an object as specified in common/shapes/triangle.js for which the buffer 
have alrady been created
*/
Renderer.drawObject = function (gl, obj, fillColor, lineColor) {

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

  if(typeof obj.texCoords != 'undefined'){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);	
    gl.enableVertexAttribArray(this.uniformShader.aTexCoordsIndex);
    gl.vertexAttribPointer(this.uniformShader.aTexCoordsIndex, 2, gl.FLOAT, false, 0, 0);
}

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aNormalIndex);
  gl.vertexAttribPointer(this.uniformShader.aNormalIndex, 3, gl.FLOAT, true, 0, 0);

  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.POLYGON_OFFSET_FILL);
  
  gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/*
initialize the object in the scene
*/
Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");
  this.rotation=0;


  this.cube = new Cube();
  ComputeNormals(this.cube);
  this.createObjectBuffers(gl,this.cube);
  
  this.cylinder = new Cylinder(20);
  ComputeNormals(this.cylinder);
  this.createObjectBuffers(gl,this.cylinder );
  
  ComputeNormals(Game.scene.trackObj);
  ComputeNormals(Game.scene.groundObj);
  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (var i = 0; i < Game.scene.buildings.length; ++i){
    ComputeNormals(Game.scene.buildingsObjTex[i]);
    Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i]);

    ComputeNormals(Game.scene.buildingsObjTex[i].roof);
    Renderer.createObjectBuffers(gl,Game.scene.buildingsObjTex[i].roof);
  }
  this.loadTexture(1,"../common/textures/grass_tile.png",gl);
  this.loadTexture(0,"../common/textures/street4.png",gl);
  this.loadTexture(2,"../common/textures/facade1.jpg",gl);
  this.loadTexture(3,"../common/textures/roof.jpg",gl);
  this.loadTexture(4,"../common/textures/headlight.png",gl);
};

/*
draw the car
*/
Renderer.drawCar = function (gl) {

  //Cube 
    M                 = glMatrix.mat4.create();
    rotate_transform  = glMatrix.mat4.create();
    translate_matrix  = glMatrix.mat4.create();
    scale_matrix      = glMatrix.mat4.create();
  
    glMatrix.mat4.fromTranslation(translate_matrix,[0,1,1]);
    glMatrix.mat4.fromScaling(scale_matrix,[0.7,0.2,1]);
    glMatrix.mat4.mul(M,scale_matrix,translate_matrix);
    glMatrix.mat4.fromRotation(rotate_transform,-0.1,[1,0,0]);
    glMatrix.mat4.mul(M,rotate_transform,M);
    glMatrix.mat4.fromTranslation(translate_matrix,[0,0.0,-1]);
    glMatrix.mat4.mul(M,translate_matrix,M); 

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);

    this.drawObject(gl,this.cube,[0.3,0.0,0.8,1.0],[1.0,0.0,1.0,1.0]);
    Renderer.stack.pop();


    //Cylinders
    Mw                 = glMatrix.mat4.create();
    /* draw the wheels */
    glMatrix.mat4.fromRotation(rotate_transform,3.14/2.0,[0,0,1]);
    glMatrix.mat4.fromTranslation(translate_matrix,[1,0,0]);
    glMatrix.mat4.mul(Mw,translate_matrix,rotate_transform);  //Mw= TR
    
    glMatrix.mat4.fromScaling(scale_matrix,[0.1,0.2,0.2]);
    glMatrix.mat4.mul(Mw,scale_matrix,Mw); //Mw= STR
     /* now the diameter of the wheel is 2*0.2 = 0.4 and the wheel is centered in 0,0,0 */

    //make the wheels roll according to speed 
    this.rotation += this.car.speed;
    glMatrix.mat4.fromRotation(rotate_transform,this.rotation*(-3.14/9),[1,0,0]);
    glMatrix.mat4.mul(Mw,rotate_transform,Mw);

     
    glMatrix.mat4.identity(M); 

    //front left wheel

    //make the wheels turn according to wheelsAngle
    glMatrix.mat4.fromRotation(rotate_transform,this.car.wheelsAngle*(3.14/1.8),[0,1,0]);
    glMatrix.mat4.mul(Mw,rotate_transform,Mw);


    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,Mw);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix);
  
    this.drawObject(gl,this.cylinder,[1.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();

    //front right wheel
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.2,-0.7]);
    glMatrix.mat4.mul(M,translate_matrix,Mw);

    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cylinder,[1.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();

    //We don't want the back wheels to rotate according to turning so we set them straight again
    if (this.car.wheelsAngle!=0){
      glMatrix.mat4.fromRotation(rotate_transform,this.car.wheelsAngle*(-3.14/1.8),[0,1,0]);
      glMatrix.mat4.mul(Mw,rotate_transform,Mw);
    }

    /* this will increase the size of the wheel to 0.4*1,5=0.6 */
    glMatrix.mat4.fromScaling(scale_matrix,[1,1.5,1.5]);
    glMatrix.mat4.mul(Mw,scale_matrix,Mw);
    
    //back right wheel
    glMatrix.mat4.fromTranslation(translate_matrix,[0.8,0.3,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,Mw);
  
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    Renderer.stack.pop();

    this.drawObject(gl,this.cylinder,[1.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);

    //back left wheel
    glMatrix.mat4.fromTranslation(translate_matrix,[-0.8,0.3,0.7]);
    glMatrix.mat4.mul(M,translate_matrix,Mw);
  
    Renderer.stack.push();
    Renderer.stack.multiply(M);
    gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, this.stack.matrix); 
    this.drawObject(gl,this.cylinder,[1.0,0.0,0.0,1.0],[0.0,0.0,0.0,1.0]);
    Renderer.stack.pop();
};


Renderer.drawScene = function (gl, shader) {

  var width = this.canvas.width;
  var height = this.canvas.height
  var ratio = width / height;
  this.stack = new MatrixStack();

  
  gl.viewport(0, 0, width, height);
  
  gl.enable(gl.DEPTH_TEST);

  // Clear the framebuffer
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  gl.useProgram(shader);

  // Projection matrices sent to shader
  gl.uniformMatrix4fv(shader.uProjectionMatrixLocation, false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));
  gl.uniformMatrix4fv(shader.uLightProjectionMatrix, false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));
  
  
  
  
  //Sun uniforms
  var sunLightIntensityUniformLocation = gl.getUniformLocation (shader,'sunLightIntensity');
  var sunLightDirectionUniformLocation = gl.getUniformLocation (shader,'sunLightDirection');
  gl.uniform3f(sunLightIntensityUniformLocation, 1.0, 0.8, 0.9);
  gl.uniform3fv(sunLightDirectionUniformLocation, Game.scene.weather.sunLightDirection);
  
  //Lamps uniforms
  for (i=0; i<12; ++i){
    gl.uniform3fv(shader.uLampLocation[i], Game.scene.lamps[i].position);
  }
  
  var lampDirectionLocation = gl.getUniformLocation(shader, 'lampDirection');
  var lightInnerCutOffLocation = gl.getUniformLocation(shader, 'lightInnerCutOff');
  var lightOuterCutOffLocation = gl.getUniformLocation(shader, 'lightOuterCutOff');
  
  gl.uniform3f(lampDirectionLocation, 0.0, -1.0, 0.0);
  gl.uniform1f(lightInnerCutOffLocation, 0.5);
  gl.uniform1f(lightOuterCutOffLocation, 1);
  
  var V = Renderer.cameras[Renderer.currentCamera].matrix();
  
  var invV = glMatrix.mat4.create();                         // inverse of the viewMatrix
  glMatrix.mat4.invert(invV, V);
  
  proj_transform = Renderer.HeadLightProjector.matrix();     // headlight projector transform
  
  gl.uniformMatrix4fv(shader.uViewMatrixLocation, false,  V);
  gl.uniformMatrix4fv(shader.uInverseViewMatrix, false,  invV);
  gl.uniformMatrix4fv(shader.uHeadlightsViewMatrix,  false,  proj_transform);
  
  Renderer.cameras[Renderer.currentCamera].update(this.car.frame);
  Renderer.HeadLightProjector.update(this.car.frame);
  
  // initialize the stack with the identity
  this.stack.loadIdentity();
  // multiply by the view matrix
  this.stack.multiply(V);

  
  
  gl.uniform1i(gl.getUniformLocation(shader,'uTextureOn'),false);
  // drawing the car
  this.stack.push();
  this.stack.multiply(this.car.frame); // projection * viewport
  this.drawCar(gl);
  this.stack.pop();
  
  gl.uniformMatrix4fv(shader.uModelViewMatrixLocation, false, this.stack.matrix);
  
  // drawing the static elements (ground, track and buldings)
  gl.uniform1i(gl.getUniformLocation(shader,'uTextureOn'),true);
  
  gl.uniform1i(gl.getUniformLocation(shader,'uProjectionSampler'),4);
  
  gl.uniform1i(gl.getUniformLocation(shader,'uSampler'),1);
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
  
  gl.uniform1i(gl.getUniformLocation(shader,'uSampler'),0);
  this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0.9, 0.8, 0.7, 1.0]);
  
  gl.uniform1i(gl.getUniformLocation(shader,'uSampler'),2);
	for (var i in Game.scene.buildingsObj) 
  this.drawObject(gl, Game.scene.buildingsObjTex[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
  
  gl.uniform1i(gl.getUniformLocation(shader,'uSampler'),3);
	for (var i in Game.scene.buildingsObj) 
  this.drawObject(gl, Game.scene.buildingsObjTex[i].roof, [0.8, 0.8, 0.8, 1.0], [0.8, 0.8, 0.8, 1.0]);

	gl.useProgram(null);
};



Renderer.Display = function () {
  Renderer.drawScene(Renderer.gl, Renderer.uniformShader);
  window.requestAnimationFrame(Renderer.Display) ;
};


Renderer.setupAndStart = function () {
 /* create the canvas */
	Renderer.canvas = document.getElementById("OUTPUT-CANVAS");
  
 /* get the webgl context */
	Renderer.gl = Renderer.canvas.getContext("webgl");

  /* read the webgl version and log */
	var gl_version = Renderer.gl.getParameter(Renderer.gl.VERSION); 
	log("glversion: " + gl_version);
	var GLSL_version = Renderer.gl.getParameter(Renderer.gl.SHADING_LANGUAGE_VERSION)
	log("glsl  version: "+GLSL_version);

  /* create the matrix stack */
	Renderer.stack = new MatrixStack();

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);

  /* create the shader */
  Renderer.uniformShader = new uniformShader(Renderer.gl);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove',on_mouseMove,false);
  Renderer.canvas.addEventListener('keydown',on_keydown,false);
  Renderer.canvas.addEventListener('keyup',on_keyup,false);
  Renderer.canvas.addEventListener('mouseup',on_mouseup,false);
  Renderer.canvas.addEventListener('mousedown',on_mousedown,false);
  
  
  
  
  Renderer.Display();
}

window.onload = Renderer.setupAndStart;


update_camera = function (value){
  Renderer.currentCamera = value;
}
