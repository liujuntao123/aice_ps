/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon, XMarkIcon } from './icons';

interface FusionPanelProps {
  onApplyFusion: (sourceImages: File[], prompt: string) => void;
  isLoading: boolean;
  onError: (message: string) => void;
}

const MAX_FILE_SIZE_MB = 12;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FusionPanel: React.FC<FusionPanelProps> = ({ onApplyFusion, isLoading, onError }) => {
  const [sourceImageFile1, setSourceImageFile1] = useState<File | null>(null);
  const [sourceImageFile2, setSourceImageFile2] = useState<File | null>(null);
  const [sourceImageFile3, setSourceImageFile3] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);

  const handleApply = () => {
    const sourceFiles = [sourceImageFile1, sourceImageFile2, sourceImageFile3].filter(Boolean) as File[];
    if (sourceFiles.length > 0 && prompt.trim()) {
        onApplyFusion(sourceFiles, prompt);
    }
  };

  const ImageUploader: React.FC<{
    id: number;
    file: File | null;
    setFile: (file: File | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
  }> = ({ id, file, setFile, fileInputRef }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
      if (file) {
          const newUrl = URL.createObjectURL(file);
          setImageSrc(newUrl);
          return () => {
              URL.revokeObjectURL(newUrl);
          };
      }
      setImageSrc(null);
    }, [file]);

    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            const selectedFile = files[0];
            if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
                onError(`素材图文件大小不能超过 ${MAX_FILE_SIZE_MB}MB。请选择一个较小的文件。`);
                return;
            }
            onError(''); // Clear previous errors
            setFile(selectedFile);
        }
    };

    const handleClearImage = useCallback(() => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [setFile, fileInputRef]);

    return (
        <div 
            className={`w-full p-4 border-2 rounded-lg transition-all duration-200 flex-1 ${isDraggingOver ? 'border-dashed border-blue-400 bg-blue-500/10' : 'border-gray-600'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                handleFileSelect(e.dataTransfer.files);
            }}
        >
            {!imageSrc ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-8 h-full">
                    <UploadIcon className="w-8 h-8 mb-2" />
                    <p className="font-semibold">上传素材图 {id}</p>
                    <p className="text-xs">拖放文件或 <span className="text-blue-400 font-semibold cursor-pointer" onClick={() => fileInputRef.current?.click()}>点击浏览</span></p>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} />
                </div>
            ) : (
                <div className="relative group flex items-center justify-center h-full">
                    <img src={imageSrc} alt={`Source for fusion ${id}`} className="w-auto h-32 mx-auto rounded-md object-contain" />
                    <button 
                        onClick={handleClearImage}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove source image ${id}`}
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">智能合成</h3>
      <p className="text-sm text-gray-400 -mt-2">上传一至三张素材图，然后描述如何将它们结合。</p>

      <div className="w-full flex flex-col md:flex-row gap-4">
        <ImageUploader id={1} file={sourceImageFile1} setFile={setSourceImageFile1} fileInputRef={fileInputRef1} />
        <ImageUploader id={2} file={sourceImageFile2} setFile={setSourceImageFile2} fileInputRef={fileInputRef2} />
        <ImageUploader id={3} file={sourceImageFile3} setFile={setSourceImageFile3} fileInputRef={fileInputRef3} />
      </div>
      
      <div className="w-full flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如，“把图1人物放到主图中，用图2风格渲染，并加入图3的背景”"
          className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
          disabled={isLoading || (!sourceImageFile1 && !sourceImageFile2 && !sourceImageFile3)}
        />
        <button
          onClick={handleApply}
          className="bg-gradient-to-br from-purple-600 to-purple-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-purple-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || !prompt.trim() || (!sourceImageFile1 && !sourceImageFile2 && !sourceImageFile3)}
        >
          应用合成
        </button>
      </div>
    </div>
  );
};

export default FusionPanel;