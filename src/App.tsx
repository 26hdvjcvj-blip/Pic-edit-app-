/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, ChangeEvent, MouseEvent } from 'react';
import { Upload, Download, RotateCcw, Zap, Sun, Contrast, Crop, RotateCw, Undo2, Redo2, Maximize, Palette, Eraser, Film, Mic, Layers, Sliders, FileUp } from 'lucide-react';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [history, setHistory] = useState<{filter: typeof filter, rotation: number, crop: {x: number, y: number, w: number, h: number} | null}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filter, setFilter] = useState({ brightness: 100, contrast: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0 });
  const [rotation, setRotation] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startPos = useRef<{x: number, y: number} | null>(null);

  const addToHistory = (newFilter: typeof filter, newRotation: number, newCrop: {x: number, y: number, w: number, h: number} | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ filter: newFilter, rotation: newRotation, crop: newCrop });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setFilter(state.filter);
      setRotation(state.rotation);
      setCropArea(state.crop);
      setHistoryIndex(newIndex);
      if (image) applyFilters(image, state.filter, state.rotation, state.crop || undefined);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setFilter(state.filter);
      setRotation(state.rotation);
      setCropArea(state.crop);
      setHistoryIndex(newIndex);
      if (image) applyFilters(image, state.filter, state.rotation, state.crop || undefined);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
        const initialState = { filter, rotation, crop: null };
        setHistory([initialState]);
        setHistoryIndex(0);
        applyFilters(result, filter, rotation);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyFilters = useCallback((imgSrc: string, currentFilter: typeof filter, rot: number, crop?: {x: number, y: number, w: number, h: number}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const rad = (rot * Math.PI) / 180;
      const isRotated = rot % 180 !== 0;
      
      if (crop) {
        canvas.width = isRotated ? crop.h : crop.w;
        canvas.height = isRotated ? crop.w : crop.h;
      } else {
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.filter = `brightness(${currentFilter.brightness}%) contrast(${currentFilter.contrast}%) grayscale(${currentFilter.grayscale}%) sepia(${currentFilter.sepia}%) invert(${currentFilter.invert}%) blur(${currentFilter.blur}px)`;
      
      if (crop) {
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, -crop.w / 2, -crop.h / 2, crop.w, crop.h);
      } else {
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }
      ctx.restore();
    };
    img.src = imgSrc;
  }, []);

  const updateFilter = (key: keyof typeof filter, value: number) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    addToHistory(newFilter, rotation, cropArea);
    if (image) applyFilters(image, newFilter, rotation, cropArea || undefined);
  };

  const rotateImage = (direction: 'cw' | 'ccw') => {
    const newRotation = (rotation + (direction === 'cw' ? 90 : -90) + 360) % 360;
    setRotation(newRotation);
    addToHistory(filter, newRotation, cropArea);
    if (image) applyFilters(image, filter, newRotation, cropArea || undefined);
  };

  const confirmCrop = () => {
    if (image && cropArea) {
      applyFilters(image, filter, rotation, cropArea);
      addToHistory(filter, rotation, cropArea);
      setIsCropping(false);
      setCropArea(null);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isCropping) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const x = Math.min(startPos.current!.x, currentPos.x);
    const y = Math.min(startPos.current!.y, currentPos.y);
    const w = Math.abs(startPos.current!.x - currentPos.x);
    const h = Math.abs(startPos.current!.y - currentPos.y);
    setCropArea({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-[#141414] pb-4">
        <h1 className="text-3xl font-bold tracking-tighter">PixelCraft Editor</h1>
        <div className="flex gap-4">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded hover:bg-gray-200 disabled:opacity-50">
            <Undo2 size={18} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded hover:bg-gray-200 disabled:opacity-50">
            <Redo2 size={18} />
          </button>
          <label className="flex items-center gap-2 cursor-pointer bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded hover:opacity-90">
            <Upload size={18} />
            Upload
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
          <button className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded hover:opacity-90">
            <Download size={18} />
            Save
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3 bg-white p-4 border border-[#141414] flex items-center justify-center min-h-[500px] relative">
          {image ? (
            <>
              <canvas 
                ref={canvasRef} 
                className={`max-w-full h-auto ${isCropping ? 'cursor-crosshair' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
              {isCropping && cropArea && (
                <div 
                  className="absolute border-2 border-dashed border-white bg-white/20 pointer-events-none"
                  style={{
                    left: cropArea.x + 16,
                    top: cropArea.y + 16,
                    width: cropArea.w,
                    height: cropArea.h
                  }}
                />
              )}
            </>
          ) : (
            <p className="text-gray-500">Upload an image to start editing</p>
          )}
        </div>

        <aside className="bg-white p-6 border border-[#141414] space-y-8">
          <h2 className="font-serif italic text-lg uppercase opacity-70 border-b border-[#141414] pb-2">Editor Tools</h2>
          
          <div className="flex flex-col gap-6">
            {/* Image Tools Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Image Tools</h3>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Maximize size={16} /> 4K HD Enhance
              </button>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Palette size={16} /> Color Grading
              </button>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Eraser size={16} /> Background Remove
              </button>
            </div>

            {/* Video Tools Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Video Tools</h3>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Film size={16} /> Video Edit
              </button>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <FileUp size={16} /> Video HD Export
              </button>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Mic size={16} /> Video Dubbing
              </button>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Sliders size={16} /> Video Color Edit
              </button>
              <button className="w-full flex items-center gap-3 py-2 px-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-sm">
                <Layers size={16} /> Video BG Change
              </button>
            </div>
          </div>

          <div className="border-t border-[#141414] pt-4">
            <h2 className="font-serif italic text-lg uppercase opacity-70 border-b border-[#141414] pb-2 mb-4">Adjustments</h2>
            <div className="flex flex-col gap-6">
              <button onClick={() => setIsCropping(!isCropping)} className={`w-full flex items-center justify-center gap-2 border border-[#141414] py-2 rounded transition-colors ${isCropping ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414] hover:text-[#E4E3E0]'}`}>
                <Crop size={16} />
                {isCropping ? 'Cancel Crop' : 'Crop Image'}
              </button>
              {isCropping && (
                <button onClick={confirmCrop} className="w-full flex items-center justify-center gap-2 border border-[#141414] py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors">
                  Confirm Crop
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => rotateImage('ccw')} className="flex-1 flex items-center justify-center gap-2 border border-[#141414] py-2 rounded hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
                  <RotateCcw size={16} />
                </button>
                <button onClick={() => rotateImage('cw')} className="flex-1 flex items-center justify-center gap-2 border border-[#141414] py-2 rounded hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
                  <RotateCw size={16} />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-mono">
                  <span className="flex items-center gap-1"><Sun size={14}/> Brightness</span>
                  <span>{filter.brightness}%</span>
                </div>
                <input type="range" min="0" max="200" value={filter.brightness} onChange={(e) => updateFilter('brightness', parseInt(e.target.value))} className="w-full accent-[#141414]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-mono">
                  <span className="flex items-center gap-1"><Contrast size={14}/> Contrast</span>
                  <span>{filter.contrast}%</span>
                </div>
                <input type="range" min="0" max="200" value={filter.contrast} onChange={(e) => updateFilter('contrast', parseInt(e.target.value))} className="w-full accent-[#141414]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-mono">
                  <span className="flex items-center gap-1"><Zap size={14}/> Grayscale</span>
                  <span>{filter.grayscale}%</span>
                </div>
                <input type="range" min="0" max="100" value={filter.grayscale} onChange={(e) => updateFilter('grayscale', parseInt(e.target.value))} className="w-full accent-[#141414]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-mono">
                  <span className="flex items-center gap-1">Sepia</span>
                  <span>{filter.sepia}%</span>
                </div>
                <input type="range" min="0" max="100" value={filter.sepia} onChange={(e) => updateFilter('sepia', parseInt(e.target.value))} className="w-full accent-[#141414]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-mono">
                  <span className="flex items-center gap-1">Invert</span>
                  <span>{filter.invert}%</span>
                </div>
                <input type="range" min="0" max="100" value={filter.invert} onChange={(e) => updateFilter('invert', parseInt(e.target.value))} className="w-full accent-[#141414]" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase font-mono">
                  <span className="flex items-center gap-1">Blur</span>
                  <span>{filter.blur}px</span>
                </div>
                <input type="range" min="0" max="20" value={filter.blur} onChange={(e) => updateFilter('blur', parseInt(e.target.value))} className="w-full accent-[#141414]" />
              </div>
            </div>
            <button onClick={() => { setFilter({ brightness: 100, contrast: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0 }); if (image) applyFilters(image, { brightness: 100, contrast: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0 }, rotation, cropArea || undefined); }} className="w-full flex items-center justify-center gap-2 border border-[#141414] py-2 rounded hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors mt-6">
              <RotateCcw size={16} />
              Reset All
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
