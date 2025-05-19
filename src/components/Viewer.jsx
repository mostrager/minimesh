import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { saveAs } from "file-saver";

const simplifyMesh = (geometry, reductionRatio) => {
  const oldPos = geometry.attributes.position.array;
  const oldCount = geometry.attributes.position.count;
  const newCount = Math.floor(oldCount * (1 - reductionRatio));
  const newPos = oldPos.slice(0, newCount * 3);
  const newGeo = new THREE.BufferGeometry();
  newGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(newPos), 3)
  );
  return newGeo;
};

const Viewer = ({ file }) => {
  const mountRef = useRef(null);
  const [polyCount, setPolyCount] = useState(null);
  const [newPolyCount, setNewPolyCount] = useState(null);
  const [simplified, setSimplified] = useState(null);
  const [reduction, setReduction] = useState(0.5);
  const [mesh, setMesh] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const reader = new FileReader();
    reader.onload = function (event) {
      const contents = event.target.result;
      if (file.name.endsWith(".obj")) {
        const loader = new OBJLoader();
        const obj = loader.parse(contents);
        scene.add(obj);
        let count = 0;
        obj.traverse((child) => {
          if (child.isMesh) {
            count += child.geometry.index
              ? child.geometry.index.count / 3
              : child.geometry.attributes.position.count / 3;
            setMesh(child);
          }
        });
        setPolyCount(Math.round(count));
      } else if (file.name.endsWith(".gltf") || file.name.endsWith(".glb")) {
        const loader = new GLTFLoader();
        loader.parse(contents, "", (gltf) => {
          scene.add(gltf.scene);
          let count = 0;
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              count += child.geometry.index
                ? child.geometry.index.count / 3
                : child.geometry.attributes.position.count / 3;
              setMesh(child);
            }
          });
          setPolyCount(Math.round(count));
        });
      }
    };

    if (file.name.endsWith(".glb")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mount.removeChild(renderer.domElement);
    };
  }, [file]);

  const handleSimplify = () => {
    if (!mesh) return;
    const simplifiedGeo = simplifyMesh(mesh.geometry, reduction);
    const simplifiedMesh = new THREE.Mesh(
      simplifiedGeo,
      new THREE.MeshStandardMaterial({ color: 0xffa500, wireframe: false })
    );
    setSimplified(simplifiedMesh);

    const count = simplifiedGeo.index
      ? simplifiedGeo.index.count / 3
      : simplifiedGeo.attributes.position.count / 3;
    setNewPolyCount(Math.round(count));
  };

  const exportSimplifiedOBJ = () => {
    if (!simplified) return;
    let output = "o SimplifiedMesh\n";
    const pos = simplified.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      output += `v ${pos[i]} ${pos[i + 1]} ${pos[i + 2]}\n`;
    }
    saveAs(new Blob([output]), "simplified.obj");
  };

  const exportSimplifiedGLB = () => {
    if (!simplified) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      simplified,
      (result) => {
        const output = JSON.stringify(result);
        saveAs(new Blob([output], { type: "model/gltf-binary" }), "simplified.glb");
      },
      { binary: true }
    );
  };

  return (
    <div className="mt-6 w-full max-w-4xl">
      {polyCount !== null && (
        <div className="text-center text-lg mb-2">
          <strong>Original Polygon Count:</strong> {polyCount.toLocaleString()}
        </div>
      )}
      {newPolyCount !== null && (
        <div className="text-center text-lg mb-2 text-green-400">
          <strong>Simplified Polygon Count:</strong> {newPolyCount.toLocaleString()}
        </div>
      )}
      <div ref={mountRef} className="w-full h-[600px] bg-black rounded" />
      <div className="mt-4 flex flex-col items-center">
        <label htmlFor="reduction" className="mb-2">
          Simplification Ratio: {(reduction * 100).toFixed(0)}%
        </label>
        <input
          id="reduction"
          type="range"
          min="0"
          max="0.9"
          step="0.05"
          value={reduction}
          onChange={(e) => setReduction(parseFloat(e.target.value))}
          className="w-full max-w-sm"
        />
        <button
          onClick={handleSimplify}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 rounded"
        >
          Apply Simplification
        </button>
        <div className="flex gap-4 mt-2">
          <button
            onClick={exportSimplifiedOBJ}
            className="px-4 py-2 bg-green-500 hover:bg-green-700 rounded"
          >
            Download .OBJ
          </button>
          <button
            onClick={exportSimplifiedGLB}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-700 rounded"
          >
            Download .GLB
          </button>
        </div>
      </div>
    </div>
  );
};

export default Viewer;
