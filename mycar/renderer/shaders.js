uniformShader = function (gl) {

  var vertexShaderSource = `
    uniform mat4 uModelViewMatrix;               
    uniform mat4 uProjectionMatrix; 
    uniform mat4 uViewMatrix; 
    uniform mat4 uLightProjectionMatrix;
    uniform mat4 uHeadlightsViewMatrix; 
    uniform mat4 uInverseViewMatrix;                         
    attribute vec3 aPosition;                      
    attribute vec3 aNormal;
    attribute vec2 aTexCoords;
    varying vec3 fragPosition;                      
    varying vec3 fragNormal; 
    varying vec2 vTexCoords; 
    varying vec4 vProjectedThing;
    
    void main(void)                                
    {     
      fragPosition = (uModelViewMatrix * vec4(aPosition, 1.0)).xyz;

      
      // No need for inverse transpose since our transformations are simple
      fragNormal = normalize(uModelViewMatrix * vec4(aNormal,0.0)).xyz;
      
      vTexCoords = vec2(aTexCoords.x,aTexCoords.y);

      vProjectedThing = uLightProjectionMatrix * uHeadlightsViewMatrix * uInverseViewMatrix * uModelViewMatrix * vec4(aPosition, 1.0); //

      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
        
    uniform vec4 uColor;

    uniform vec3 sunLightIntensity; 
    uniform vec3 sunLightDirection; 

    uniform vec3 uLampLocation[12]; 
    uniform vec3 lampDirection;
    uniform float lightInnerCutOff; 
    uniform float lightOuterCutOff; 
    uniform mat4 uViewMatrix;

    
    uniform sampler2D uSampler; //texture0
    uniform bool uTextureOn;

    uniform mat4 uHeadlightsViewMatrix;
    uniform sampler2D uProjectionSampler;
    varying vec4 vProjectedThing;
    uniform mat4 uInverseViewMatrix;
    
    varying vec3 fragPosition;
    varying vec3 fragNormal; 
    varying vec2 vTexCoords;
                     
    void main(void)                                
    {  

      // Sunlight
      // light direction in view space
      vec3 lightDirectionVS = normalize((uViewMatrix * vec4(sunLightDirection,0.0))).xyz;
      float diffuseSun = max(dot(fragNormal, lightDirectionVS),0.0);
      vec3 lightIntensity = sunLightIntensity * diffuseSun;
      
      // Lamps
      
      // light direction in view space
      vec3 lightDirection = normalize((uViewMatrix * vec4(lampDirection,0.0))).xyz;

      for(int i=0;i<12;++i)
      { 
        vec3 offset = ((uViewMatrix * vec4(uLampLocation[i], 1.0)).xyz + (uViewMatrix * vec4(0.0,1.0,0.0,0.0)).xyz) - fragPosition;
        float distance = length(offset);
        float attenuation = 1.0 / (distance * distance);
        vec3 surfToLight = normalize(offset);
        vec3 lightToSurf = -surfToLight;
        
        float diffuseLamp = max(dot(surfToLight, fragNormal),0.0);
        float angleToSurface = dot(lightDirection, lightToSurf);
        float spot = smoothstep(lightInnerCutOff, lightOuterCutOff, angleToSurface);
        lightIntensity += sunLightIntensity * diffuseLamp * spot * attenuation;   
      }

      // Headlight

      vec3 headlightTexCoords = (vProjectedThing / vProjectedThing.w).xyz * 0.5 + 0.5;
      vec4 headlightColor;
      float projectedZ = (uHeadlightsViewMatrix * uInverseViewMatrix * vec4(fragPosition, 1.0)).z;

    
      if(projectedZ < -2.0 
      && headlightTexCoords.x <= 1.0 && headlightTexCoords.x >= 0.0
      && headlightTexCoords.y <= 1.0 && headlightTexCoords.y >= 0.0){
          headlightColor = texture2D(uProjectionSampler, headlightTexCoords.xy);
      } 

      
      


      if (uTextureOn == false){
        gl_FragColor = vec4(uColor.rgb * lightIntensity, uColor.a);
      }
      else{
        gl_FragColor = vec4(texture2D(uSampler,vTexCoords).xyz, 1.0) * vec4(uColor.rgb * lightIntensity, uColor.a) +
        vec4(headlightColor.xyz, 1.0) * vec4(uColor.rgb * lightIntensity, uColor.a);    //                             
      }

    }                                             
  `;

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var aNormalIndex = 1;
  var aTexCoordsIndex = 2;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
  gl.bindAttribLocation(shaderProgram, aTexCoordsIndex, "aTexCoords");
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.\n\n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }
  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTexCoordsIndex = aTexCoordsIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  
  shaderProgram.sunLightIntensityLocation = gl.getUniformLocation(shaderProgram, "sunLightIntensity");
  shaderProgram.sunLightDirectionLocation = gl.getUniformLocation(shaderProgram, "sunLightDirection");
  
  shaderProgram.lampDirectionLocation = gl.getUniformLocation(shaderProgram, "lampDirection");
  shaderProgram.lightInnerCutOffLocation = gl.getUniformLocation(shaderProgram, "lightInnerCutOff");
  shaderProgram.lightOuterCutOffLocation = gl.getUniformLocation(shaderProgram, "lightOuterCutOff");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
  shaderProgram.uLampLocation= new Array();
  nLights = 12;
  
  for(var i = 0; i < nLights; ++i){
    shaderProgram.uLampLocation[i] = gl.getUniformLocation(shaderProgram,"uLampLocation["+i+"]");
  }
  
  shaderProgram.uTextureOnLocation = gl.getUniformLocation(shaderProgram, "uTextureOn");

  shaderProgram.uLightProjectionMatrix = gl.getUniformLocation(shaderProgram, "uLightProjectionMatrix");
  shaderProgram.uHeadlightsViewMatrix = gl.getUniformLocation(shaderProgram, "uHeadlightsViewMatrix");
  shaderProgram.uInverseViewMatrix = gl.getUniformLocation(shaderProgram, "uInverseViewMatrix");

  return shaderProgram;
};
depthShader = function (gl) {

  var vertexShaderSource = `
    uniform mat4 uModelViewMatrix;               
    uniform mat4 uProjectionMatrix; 
    uniform mat4 uViewMatrix; 
    uniform mat4 uLightProjectionMatrix;
    uniform mat4 uHeadlightsViewMatrix; 
    uniform mat4 uInverseViewMatrix;                         
    attribute vec3 aPosition;                      
    attribute vec3 aNormal;
    attribute vec2 aTexCoords;
    varying vec3 fragPosition;                      
    varying vec3 fragNormal; 
    varying vec2 vTexCoords; 
    varying vec4 vProjectedThing;
    
    void main(void)                                
    {     
      vec4 position = vec4(aPosition, 1.0);

      gl_Position = uLightProjectionMatrix * uHeadlightsViewMatrix * uInverseViewMatrix * uModelViewMatrix * position;     
    }                                              
  `;

  var fragmentShaderSource = `
    precision highp float;                         
                     
    void main(void)                                
    {  
    }                                             
  `;

  // create the vertex shader
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  var aPositionIndex = 0;
  var aNormalIndex = 1;
  var aTexCoordsIndex = 2;
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal");
  gl.bindAttribLocation(shaderProgram, aTexCoordsIndex, "aTexCoords");
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    var str = "Unable to initialize the shader program.\n\n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }
  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;
  shaderProgram.aTexCoordsIndex = aTexCoordsIndex;
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  
  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");
  
  shaderProgram.sunLightIntensityLocation = gl.getUniformLocation(shaderProgram, "sunLightIntensity");
  shaderProgram.sunLightDirectionLocation = gl.getUniformLocation(shaderProgram, "sunLightDirection");
  
  shaderProgram.lampDirectionLocation = gl.getUniformLocation(shaderProgram, "lampDirection");
  shaderProgram.lightInnerCutOffLocation = gl.getUniformLocation(shaderProgram, "lightInnerCutOff");
  shaderProgram.lightOuterCutOffLocation = gl.getUniformLocation(shaderProgram, "lightOuterCutOff");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");
  shaderProgram.uLampLocation= new Array();
  nLights = 12;
  
  for(var i = 0; i < nLights; ++i){
    shaderProgram.uLampLocation[i] = gl.getUniformLocation(shaderProgram,"uLampLocation["+i+"]");
  }
  
  shaderProgram.uTextureOnLocation = gl.getUniformLocation(shaderProgram, "uTextureOn");

  shaderProgram.uLightProjectionMatrix = gl.getUniformLocation(shaderProgram, "uLightProjectionMatrix");
  shaderProgram.uHeadlightsViewMatrix = gl.getUniformLocation(shaderProgram, "uHeadlightsViewMatrix");
  shaderProgram.uInverseViewMatrix = gl.getUniformLocation(shaderProgram, "uInverseViewMatrix");

  return shaderProgram;
};