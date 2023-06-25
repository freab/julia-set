import "./style.css";
import * as THREE from "three";
import testVertexShader from "./shader/vertex.glsl";
import testFragmentShader from "./shader/fragment.glsl";

let analyser, source, audioData, uniforms, scene;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

document.querySelector("button").addEventListener("click", function () {
  audioCtx.resume().then(() => {
    startMic();
    console.log("Playback resumed successfully");
  });
});

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.autoClearColor = false;

const camera = new THREE.OrthographicCamera(
  -1, // left
  1, // right
  1, // top
  -1, // bottom
  -1, // near
  1 // far
);

function createScene() {
  scene = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(2, 2);

  uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
    iChannel0: {
      value: new THREE.DataTexture(
        audioData,
        analyser.frequencyBinCount / 2,
        1,
        THREE.RedFormat
      ),
    },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: testVertexShader,
    fragmentShader: testFragmentShader,
    uniforms: uniforms,
  });

  scene.add(new THREE.Mesh(plane, material));
}

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

function resizeRendererToDisplaySize(renderer) {
  const needResize =
    canvas.width !== window.innerWidth || canvas.height !== window.innerHeight;
  if (needResize) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  return needResize;
}

function animate(time) {
  requestAnimationFrame(animate);

  resizeRendererToDisplaySize(renderer);

  analyser.getByteFrequencyData(audioData);

  time *= 0.01;

  uniforms.iTime.value = time;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iChannel0.value.image.data = audioData;
  uniforms.iChannel0.value.needsUpdate = true;

  renderer.render(scene, camera);
}

function startMic() {
  if (navigator.getUserMedia) {
    navigator.getUserMedia(
      { audio: true, video: false },
      function (stream) {
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaStreamSource(stream);

        source.connect(analyser);

        analyser.fftSize = 1024;
        audioData = new Uint8Array(analyser.frequencyBinCount);

        createScene();
        animate();
      },
      function () {}
    );
  } else {
    // fallback.
  }
}
