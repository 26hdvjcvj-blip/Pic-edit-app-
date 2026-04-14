/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import { Upload, Download, RotateCcw, Zap, Sun, Contrast } from 'lucide-react';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [filter, setFilter] = useState({ brightness: 100, contrast: 100, grayscale: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        applyFilters(e.target?.result as string, filter);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyFilters = useCallback((imgSrc: string, currentFilter: typeof filter) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = `brightness(${currentFilter.brightness}%) contrast(${currentFilter.contrast}%) grayscale(${currentFilter.grayscale}%)`;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imgSrc;
  }, []);

  const updateFilter = (key: keyof typeof filter, value: number) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    if (image) applyFilters(image, newFilter);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-[#141414] pb-4">
        <h1 className="text-3xl font-bold tracking-tighter">PixelCraft Editor</h1>
        <div className="flex gap-4">
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
        <div className="md:col-span-3 bg-white p-4 border border-[#141414] flex items-center justify-center min-h-[500px]">
          {image ? (
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          ) : (
            <p className="text-gray-500">Upload an image to start editing</p>
          )}
        </div>

        <aside className="bg-white p-6 border border-[#141414] space-y-6">
          <h2 className="font-serif italic text-lg uppercase opacity-70">Adjustments</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs uppercase font-mono">
              <span className="flex items-center gap-1"><Sun size={14}/> Brightness</span>
              <span>{filter.brightness}%</span>
            </div>
            <input type="range" min="0" max="200" value={filter.brightness} onChange={(e) => updateFilter('brightness', parseInt(e.target.value))} className="w-full" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs uppercase font-mono">
              <span className="flex items-center gap-1"><Contrast size={14}/> Contrast</span>
              <span>{filter.contrast}%</span>
            </div>
            <input type="range" min="0" max="200" value={filter.contrast} onChange={(e) => updateFilter('contrast', parseInt(e.target.value))} className="w-full" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs uppercase font-mono">
              <span className="flex items-center gap-1"><Zap size={14}/> Grayscale</span>
              <span>{filter.grayscale}%</span>
            </div>
            <input type="range" min="0" max="100" value={filter.grayscale} onChange={(e) => updateFilter('grayscale', parseInt(e.target.value))} className="w-full" />
          </div>

          <button onClick={() => { setFilter({ brightness: 100, contrast: 100, grayscale: 0 }); if (image) applyFilters(image, { brightness: 100, contrast: 100, grayscale: 0 }); }} className="w-full flex items-center justify-center gap-2 border border-[#141414] py-2 rounded hover:bg-[#141414] hover:text-[#E4E3E0]">
            <RotateCcw size={16} />
            Reset
          </button>
        </aside>
      </main>
    </div>
  );
}
