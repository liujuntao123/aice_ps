/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('gemini-api-key') || '';
      const storedBaseUrl = localStorage.getItem('gemini-base-url') || '';
      setApiKey(storedKey);
      setBaseUrl(storedBaseUrl);
      setIsSaved(false); // Reset saved status on open
    }
  }, [isOpen]);
  
  const handleSave = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('gemini-base-url', baseUrl);
    setIsSaved(true);
    onSave();
    // Optionally close the modal after a short delay
    setTimeout(() => {
        onClose();
    }, 1000);
  };
  
  const handleClear = () => {
    localStorage.removeItem('gemini-api-key');
    localStorage.removeItem('gemini-base-url');
    setApiKey('');
    setBaseUrl('');
    setIsSaved(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-blue-500/10 w-full max-w-lg m-4 p-6 text-gray-200 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" aria-label="关闭设置">
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4">API 设置</h2>
        
        <div className="text-yellow-300/80 bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg text-sm mb-4">
          <b>请注意：</b>使用您自己的 Google Gemini API 密钥将会产生费用。如果留空，应用将尝试使用系统配置的免费 API。
        </div>
        <div className="text-cyan-300/80 bg-cyan-900/20 border border-cyan-700/50 p-3 rounded-lg text-sm mb-6">
            <b>通知：</b>我们提供高性价比且稳定的 Nano Banana 图片生成 API，详情请访问 <a href="https://cnb.build/no.1/api/-/issues/2" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-cyan-200">极具性价比API平台</a>。
        </div>

        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="api-key-input" className="font-semibold text-gray-300">
                    Gemini API Key
                </label>
                <input
                    id="api-key-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                        setApiKey(e.target.value);
                        setIsSaved(false);
                    }}
                    placeholder="在此处粘贴您的 API 密钥"
                    className="bg-gray-900 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
            </div>
            
            <div className="flex flex-col gap-2">
                <label htmlFor="base-url-input" className="font-semibold text-gray-300">
                    API Base URL (可选)
                </label>
                <input
                    id="base-url-input"
                    type="text"
                    value={baseUrl}
                    onChange={(e) => {
                        setBaseUrl(e.target.value);
                        setIsSaved(false);
                    }}
                    placeholder="例如: https://apis.kuai.host/"
                    className="bg-gray-900 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
            </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleClear}
                className="flex-1 bg-gray-700/50 text-gray-300 font-bold py-3 px-6 rounded-lg transition-colors hover:bg-gray-700/80 active:scale-95"
            >
                清除
            </button>
            <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed"
                disabled={isSaved}
            >
                {isSaved ? '已保存！' : '保存设置'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
