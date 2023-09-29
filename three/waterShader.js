
const waterVertexShader = `
  varying vec2 vUv;
	varying vec3 vNormal;
 
  uniform float time;
	uniform float waveHeight;
 	uniform float waveSpeed;
  
	void main() {

    vUv = uv;
	
    float t = time * waveSpeed;
    
    // VERTEX POSITION
    
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif
	
    mvPosition.z -= sin(t + ((uv.y + uv.x) * 3.1416 * 2.0)) * waveHeight;
    
    //
    
    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;
		
		vNormal = normal;

	}
`;

const waterFragmentShader = `
	varying vec2 vUv;
 	varying vec3 vNormal;
 
 	uniform float shadowDarkness;
	uniform float time;
  uniform float waveSpeed;
 
 	void main() {
	  vec3 waterColour = vec3(0.21, 0.21, 0.95);
	  vec3 whiteColour = vec3(0.3, 0.3, 1.0);

	  float t2 = time * waveSpeed;
	  float mixingValue = (sin(t2 + ((vUv.y + vUv.x) * 3.1416 * 2.0)) + 1.0) * 0.5;

	  vec3 mixColour = mix(waterColour, whiteColour, mixingValue);

	  gl_FragColor = vec4(mixColour, 0.5);

		gl_FragColor.r *= shadowDarkness;
		gl_FragColor.g *= shadowDarkness;
 		gl_FragColor.b *= shadowDarkness;
	}
`;

export { waterVertexShader, waterFragmentShader }