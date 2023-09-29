let simpleNoise = `
    float N (vec2 st) { // https://thebookofshaders.com/10/
        return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
    }
    
    float smoothNoise( vec2 ip ){ // https://www.youtube.com/watch?v=zXsWftRdsvU
    	vec2 lv = fract( ip );
      vec2 id = floor( ip );
      
      lv = lv * lv * ( 3. - 2. * lv );
      
      float bl = N( id );
      float br = N( id + vec2( 1, 0 ));
      float b = mix( bl, br, lv.x );
      
      float tl = N( id + vec2( 0, 1 ));
      float tr = N( id + vec2( 1, 1 ));
      float t = mix( tl, tr, lv.x );
      
      return mix( b, t, lv.y );
    }
  `;

const vertexShader = `
  varying vec2 vUv;
	
  uniform float time;
  
  ${simpleNoise}
  
	void main() {

    vUv = uv;
    float t = time * 2.0;
    
    // VERTEX POSITION
    
    vec4 mvPosition = vec4( position, 1.0 );
    #ifdef USE_INSTANCING
    	mvPosition = instanceMatrix * mvPosition;
    #endif
    
    // DISPLACEMENT
    
    float noise = smoothNoise(mvPosition.xz * 0.5 + vec2(0., t));
		noise = pow(noise * 0.5 + 0.5, 2.0) * 2.0;
		noise = 1.0;
    
    // here the displacement is made stronger on the blades tips.
    float dispPower = 1. - cos( uv.y * 3.1416 * 0.5 );
    
    float displacement = noise * ( 0.3 * dispPower );
	
    mvPosition.z -= (sin(t + (uv.y * 2.0)) + 0.5) * displacement * 0.5;
    
    //
    
    vec4 modelViewPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * modelViewPosition;

	}
`;

const fragmentShader = `
	varying vec2 vUv;
 
 	uniform sampler2D map;
	uniform sampler2D alphaMap;
 	uniform float shadowDarkness;
 
 	void main() {
  	gl_FragColor = texture2D( map, vUv);
    vec4 tex2 = texture2D( alphaMap, vUv );
    if(tex2.r - 1.0 < 0.0) {
        gl_FragColor.a = 0.0;
        //or without transparent = true use
        //discard; 
    }

		gl_FragColor.r *= shadowDarkness;
		gl_FragColor.g *= shadowDarkness;
 		gl_FragColor.b *= shadowDarkness;
	}
`;

export { vertexShader, fragmentShader }