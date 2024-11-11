/*
the FollowFromUpCamera always look at the car from a position abova right over the car
*/
FollowFromUpCamera = function(){

    /* the only data it needs is the position of the camera */
    this.frame = glMatrix.mat4.create();
    
    /* update the camera with the current car position */
    this.update = function(car_position){
      this.frame = car_position;
    }
  
    /* return the transformation matrix to transform from world coordinates to the view reference frame */
    this.matrix = function(){
      let eye = glMatrix.vec3.create();
      let target = glMatrix.vec3.create();
      let up = glMatrix.vec4.create();
      
      glMatrix.vec3.transformMat4(eye, [0,50,0], this.frame);
      glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
      glMatrix.vec4.transformMat4(up, [0.0,0.0,-1,0.0], this.frame);
      
      return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target,up.slice(0,3));	
    }
  }
  
/*
the ChaseCamera always look at the car from behind the car, slightly above
*/
ChaseCamera = function(){
  
    /* the only data it needs is the frame of the camera */
    this.frame = [0,0,0];
    
    /* update the camera with the current car position */
    this.update = function(car_frame){
      this.frame = car_frame.slice();
    }
  
    /* return the transformation matrix to transform from worlod coordiantes to the view reference frame */
    this.matrix = function(){
      let eye = glMatrix.vec3.create();
      let target = glMatrix.vec3.create();
      glMatrix.vec3.transformMat4(eye, [0.0,4.0,10.0,1.0], this.frame);
      glMatrix.vec3.transformMat4(target, [0.0,0.0,0.0,1.0], this.frame);
      return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye, target,[0, 1, 0]);	
    }
}
  
/*
the FlyingCamera always look at the car from behind the car, slightly above
*/
let flying_camera_position = glMatrix.vec3.fromValues(0,50,10);
let flight_speed = .1;
targetOffset = [0,-.5, .5]
flying_camera_localX = [1,0,0]
target = glMatrix.vec3.create();

FlyingCamera = function() {
  this.frame = glMatrix.mat4.create();
  /* update the camera with the current car position */
  this.update = function(car_position){
  }

  /* return the transformation matrix to transform from world coordiantes to the view reference frame */
  this.matrix = function(){
    let going_left  = Game.cars[0].control_keys['a'];
    let going_right = Game.cars[0].control_keys['d'];
    let going_forward    = Game.cars[0].control_keys['w'];
    let going_back  = Game.cars[0].control_keys['s'];

    let local_Z = targetOffset;
    let local_Y = [0,1,0]
    let local_X = glMatrix.vec3.create();
    glMatrix.vec3.cross(local_X, local_Y, local_Z);
    flying_camera_localX = local_X
    if(going_forward)    glMatrix.vec3.add(flying_camera_position, flying_camera_position, local_Z);
    if(going_back)  glMatrix.vec3.subtract(flying_camera_position, flying_camera_position, local_Z);
    if(going_left)  glMatrix.vec3.add(flying_camera_position, flying_camera_position, local_X);
    if(going_right) glMatrix.vec3.subtract(flying_camera_position, flying_camera_position, local_X);


    let eye = glMatrix.vec3.create();
    let target = glMatrix.vec3.create();
    let up = glMatrix.vec4.create();

    glMatrix.vec3.add(target, flying_camera_position, targetOffset);
    eye = flying_camera_position;
    glMatrix.vec3.transformMat4(target, target, this.frame);
    glMatrix.vec4.transformMat4(up, [0.0,1.0,0.0,0.0], this.frame);

    return glMatrix.mat4.lookAt(glMatrix.mat4.create(),eye,target,up.slice(0,3));
  }
  drag = false;
  
  on_mouseMove = function(e){}
  
  on_keyup = function(e){
    Renderer.car.control_keys[e.key] = false;
  }
  on_keydown = function(e){
    Renderer.car.control_keys[e.key] = true;
  }
  
  
  on_mousedown = function(e){
    drag = true;
    startX = e.clientX;
    startY = e.clientY;
  
  }
  
  Rphi      = glMatrix.mat4.create();
  Rtheta    = glMatrix.mat4.create();
  
  on_mouseMove = function(e){
    if(!drag)
      return;
  
    deltaX = e.clientX-startX;
    deltaY = e.clientY-startY;
  
  
    glMatrix.mat4.fromRotation(Rphi  , -deltaX * 0.002,[0,1,0]);
    glMatrix.mat4.fromRotation(Rtheta,  deltaY * 0.002,flying_camera_localX);
    glMatrix.mat4.mul(Rphi,Rphi,Rtheta);
  
    newDir = glMatrix.vec3.create();
    targetOffset = glMatrix.vec3.transformMat4(newDir, targetOffset ,Rphi);
  
    startX =  e.clientX;
    startY =  e.clientY;
  
  }
  on_mouseup = function(e){
    drag = false;
  }
}


  
/* the main object to be implementd */
var Renderer = new Object();
  
/* array of cameras that will be used */
Renderer.cameras = [];
// add a FollowFromUpCamera
Renderer.cameras.push(new FollowFromUpCamera());
Renderer.cameras.push(new ChaseCamera());
Renderer.cameras.push(new FlyingCamera());
  
// set the camera currently in use
Renderer.currentCamera = 0;