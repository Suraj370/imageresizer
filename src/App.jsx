// App.jsx
import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [originalImage, setOriginalImage] = useState(null);
  const [lockAspect, setLockAspect] = useState(false);
  const [format, setFormat] = useState('png');
  const [fillMode, setFillMode] = useState('stretch'); // New state for fill mode
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const aspectRatio = useRef(null);

  const MAX_SIZE = 5000;

  useEffect(() => {
    if (originalImage && originalCanvasRef.current) {
      drawOriginalPreview(originalImage);
    }
  }, [originalImage]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setOriginalImage(img);
          setWidth(img.width);
          setHeight(img.height);
          aspectRatio.current = img.width / img.height;
          setIsLoading(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawOriginalPreview = (img) => {
    const canvas = originalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = Math.max(img.width, 200);
    canvas.height = Math.max(img.height, 200);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const handleResize = () => {
    if (!image || !canvasRef.current) return;

    let newWidth = Math.min(parseInt(width) || 0, MAX_SIZE);
    let newHeight = Math.min(parseInt(height) || 0, MAX_SIZE);

    if (lockAspect && aspectRatio.current) {
      if (width !== '' && height === '') {
        newHeight = Math.round(newWidth / aspectRatio.current);
      } else if (height !== '' && width === '') {
        newWidth = Math.round(newHeight * aspectRatio.current);
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const imgAspect = image.width / image.height;
    const canvasAspect = newWidth / newHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (fillMode === 'stretch') {
      // Stretch to fill exact dimensions (original behavior)
      drawWidth = newWidth;
      drawHeight = newHeight;
      offsetX = 0;
      offsetY = 0;
    } else if (fillMode === 'fit') {
      // Scale to fit within dimensions, fill background
      ctx.fillStyle = '#ffffff'; // White background, can be customizable
      ctx.fillRect(0, 0, newWidth, newHeight);

      if (imgAspect > canvasAspect) {
        drawWidth = newWidth;
        drawHeight = newWidth / imgAspect;
      } else {
        drawHeight = newHeight;
        drawWidth = newHeight * imgAspect;
      }
      offsetX = (newWidth - drawWidth) / 2;
      offsetY = (newHeight - drawHeight) / 2;
    } else if (fillMode === 'crop') {
      // Scale to fill dimensions, crop excess
      if (imgAspect > canvasAspect) {
        drawHeight = newHeight;
        drawWidth = newHeight * imgAspect;
        offsetX = (newWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = newWidth;
        drawHeight = newWidth / imgAspect;
        offsetX = 0;
        offsetY = (newHeight - drawHeight) / 2;
      }
    }

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    setWidth(newWidth);
    setHeight(newHeight);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleImageUpload({ target: { files: [e.dataTransfer.files[0]] } });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    const link = document.createElement('a');
    link.download = `resized-image.${format}`;
    link.href = canvasRef.current.toDataURL(mimeType, format === 'jpg' ? 0.95 : 1.0);
    link.click();
  };

  return (
    <div className="container">
      <h1>Image Resizer</h1>

      <div 
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isLoading}
        />
        <p>Drag and drop an image here or click to select</p>
      </div>

      {isLoading && <div className="loader">Loading...</div>}

      <div className="controls">
        <div className="input-group">
          <label>
            Width:
            <input
              type="number"
              min="1"
              max={MAX_SIZE}
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                if (lockAspect && aspectRatio.current) {
                  setHeight(Math.round(e.target.value / aspectRatio.current));
                }
              }}
            />
          </label>
          <label>
            Height:
            <input
              type="number"
              min="1"
              max={MAX_SIZE}
              value={height}
              onChange={(e) => {
                setHeight(e.target.value);
                if (lockAspect && aspectRatio.current) {
                  setWidth(Math.round(e.target.value * aspectRatio.current));
                }
              }}
            />
          </label>
        </div>

        <label>
          <input
            type="checkbox"
            checked={lockAspect}
            onChange={(e) => setLockAspect(e.target.checked)}
          />
          Lock Aspect Ratio
        </label>

        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="png">PNG</option>
          <option value="jpg">JPEG</option>
          <option value="webp">WebP</option>
        </select>

        <select value={fillMode} onChange={(e) => setFillMode(e.target.value)}>
          <option value="stretch">Stretch</option>
          <option value="fit">Fit (Contain)</option>
          <option value="crop">Crop (Cover)</option>
        </select>

        <button onClick={handleResize} disabled={isLoading}>
          Resize
        </button>
        <button onClick={handleDownload} disabled={isLoading || !image}>
          Download
        </button>
      </div>

      <div className="preview-container">
        {originalImage && (
          <div className="preview">
            <h3>Original</h3>
            <canvas ref={originalCanvasRef} />
          </div>
        )}
        {image && (
          <div className="preview">
            <h3>Resized</h3>
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;