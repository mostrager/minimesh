import React, { useState } from "react";
import Viewer from "./components/Viewer";
import Dropzone from "react-dropzone";

function App() {
  const [modelFile, setModelFile] = useState(null);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-6">MiniMesh</h1>
      <Dropzone onDrop={(acceptedFiles) => setModelFile(acceptedFiles[0])}>
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className="w-full max-w-xl border-2 border-dashed border-white rounded p-6 text-center cursor-pointer hover:bg-gray-800"
          >
            <input {...getInputProps()} accept=".obj,.gltf,.glb" />
            <p>Drag & drop a 3D model here, or click to select a file</p>
          </div>
        )}
      </Dropzone>
      {modelFile && <Viewer file={modelFile} />}
    </div>
  );
}

export default App;

