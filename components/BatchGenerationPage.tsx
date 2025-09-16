/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Spinner from './Spinner';
import { CopyIcon, DownloadIcon } from './icons';
import { generateImageFromText } from '../services/geminiService';

type GenerationStatus = 'pending' | 'done' | 'error';

type BatchResult = {
    id: string;
    prompt: string;
    status: GenerationStatus;
    imageUrl?: string;
    error?: string;
};

const ASPECT_RATIOS: { name: string; value: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' }[] = [
    { name: '方形', value: '1:1' },
    { name: '横向', value: '16:9' },
    { name: '纵向', value: '9:16' },
    { name: '风景', value: '4:3' },
    { name: '肖像', value: '3:4' },
];

const BatchGenerationPage: React.FC = () => {
    const [promptInput, setPromptInput] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [results, setResults] = useState<BatchResult[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [banner, setBanner] = useState<{ type: 'error' | 'info'; message: string } | null>(null);
    const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
    const copyTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!banner) {
            return;
        }
        const timer = window.setTimeout(() => {
            setBanner(null);
        }, 4000);
        return () => window.clearTimeout(timer);
    }, [banner]);

    const parsedPrompts = useMemo(() => {
        return promptInput
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }, [promptInput]);

    const completedCount = results.filter((result) => result.status !== 'pending').length;
    const progressPercentage = results.length === 0 ? 0 : Math.round((completedCount / results.length) * 100);

    const handleGenerate = useCallback(async () => {
        if (isGenerating) {
            setBanner({ type: 'info', message: '正在生成，请等待当前任务完成。' });
            return;
        }

        if (parsedPrompts.length === 0) {
            setBanner({ type: 'error', message: '请至少输入一个提示词。' });
            return;
        }

        setBanner(null);
        const timestamp = Date.now();
        const initialResults: BatchResult[] = parsedPrompts.map((prompt, index) => ({
            id: `${timestamp}-${index}`,
            prompt,
            status: 'pending',
        }));

        setResults(initialResults);
        setIsGenerating(true);

        try {
            for (let index = 0; index < parsedPrompts.length; index += 1) {
                const prompt = parsedPrompts[index];
                const resultId = initialResults[index].id;
                try {
                    const imageUrl = await generateImageFromText(prompt, aspectRatio);
                    setResults((prev) =>
                        prev.map((item) =>
                            item.id === resultId
                                ? {
                                      ...item,
                                      status: 'done',
                                      imageUrl,
                                      error: undefined,
                                  }
                                : item,
                        ),
                    );
                } catch (error) {
                    const message = error instanceof Error ? error.message : '生成失败，请稍后重试。';
                    setResults((prev) =>
                        prev.map((item) =>
                            item.id === resultId
                                ? {
                                      ...item,
                                      status: 'error',
                                      error: message,
                                      imageUrl: undefined,
                                  }
                                : item,
                        ),
                    );
                }
            }
        } finally {
            setIsGenerating(false);
        }
    }, [aspectRatio, isGenerating, parsedPrompts]);

    const handleCopyPrompt = useCallback((prompt: string, id: string) => {
        if (!navigator?.clipboard) {
            setBanner({ type: 'error', message: '当前浏览器不支持复制到剪贴板。' });
            return;
        }

        navigator.clipboard
            .writeText(prompt)
            .then(() => {
                setCopiedPromptId(id);
                if (copyTimeoutRef.current) {
                    window.clearTimeout(copyTimeoutRef.current);
                }
                copyTimeoutRef.current = window.setTimeout(() => {
                    setCopiedPromptId(null);
                }, 2000);
            })
            .catch(() => {
                setBanner({ type: 'error', message: '复制提示词失败，请手动复制。' });
            });
    }, []);

    const handleDownloadImage = useCallback((url: string, index: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleClearResults = useCallback(() => {
        if (isGenerating) {
            return;
        }
        setResults([]);
        setBanner(null);
        setCopiedPromptId(null);
    }, [isGenerating]);

    const handleClearPrompts = useCallback(() => {
        if (isGenerating) {
            return;
        }
        setPromptInput('');
    }, [isGenerating]);

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in">
            <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 sm:p-8 backdrop-blur-sm flex flex-col gap-6">
                <div className="flex flex-col gap-3 text-left">
                    <h2 className="text-3xl font-bold text-gray-100">批量生成图像</h2>
                    <p className="text-gray-400">
                        每行输入一个提示词，点击“开始生成”后，系统将按照顺序依次创建图片。
                    </p>
                    <p className="text-sm text-gray-500">
                        已输入 <span className="font-semibold text-gray-200">{parsedPrompts.length}</span> 条提示词。
                    </p>
                </div>

                {banner && (
                    <div
                        className={`px-4 py-3 rounded-lg border ${
                            banner.type === 'error'
                                ? 'bg-red-500/15 border-red-500 text-red-200'
                                : 'bg-blue-500/15 border-blue-500 text-blue-200'
                        }`}
                    >
                        {banner.message}
                    </div>
                )}

                <textarea
                    value={promptInput}
                    onChange={(event) => setPromptInput(event.target.value)}
                    placeholder="例如：\n一只戴着宇航员头盔的小狗漂浮在多彩的星云中，数字艺术\n古风少女在竹林下弹琴，墨色水彩风格"
                    className="w-full bg-gray-900/60 border border-gray-700 text-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-base min-h-[220px] resize-y disabled:opacity-60"
                    disabled={isGenerating}
                />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">宽高比：</span>
                        {ASPECT_RATIOS.map(({ name, value }) => (
                            <button
                                key={value}
                                onClick={() => setAspectRatio(value)}
                                disabled={isGenerating}
                                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                                    aspectRatio === value
                                        ? 'bg-gradient-to-br from-blue-600 to-purple-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white/10 hover:bg-white/20 text-gray-200'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleClearPrompts}
                            disabled={isGenerating || promptInput.length === 0}
                            className="px-4 py-2 rounded-lg border border-gray-600 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-40"
                        >
                            清空输入
                        </button>
                        <button
                            type="button"
                            onClick={handleClearResults}
                            disabled={isGenerating || results.length === 0}
                            className="px-4 py-2 rounded-lg border border-gray-600 text-sm font-semibold text-gray-300 hover:bg-white/10 transition disabled:opacity-40"
                        >
                            清空结果
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-500 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-purple-500/40 transition disabled:opacity-60"
                        >
                            {isGenerating ? '生成中…' : '开始生成'}
                        </button>
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>共 {results.length} 张图片</span>
                            <span>
                                已完成 <span className="text-gray-200 font-semibold">{completedCount}</span> / {results.length}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-700/80 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.length === 0 && !isGenerating && (
                    <div className="col-span-full">
                        <div className="border border-dashed border-gray-700 rounded-2xl p-12 text-center text-gray-400 bg-gray-800/30">
                            <p className="text-lg font-semibold text-gray-200 mb-2">等待开始</p>
                            <p>输入提示词并点击“开始生成”以批量创建图片。</p>
                        </div>
                    </div>
                )}

                {results.map((result, index) => (
                    <div
                        key={result.id}
                        className="bg-gray-800/40 border border-gray-700 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-blue-300/80 uppercase tracking-wide">
                                    提示词 {index + 1}
                                </p>
                                <p className="mt-1 text-gray-200 text-sm whitespace-pre-wrap break-words">
                                    {result.prompt}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCopyPrompt(result.prompt, result.id)}
                                    className="p-2 rounded-full bg-white/5 text-gray-300 hover:bg-white/15 transition"
                                    title="复制提示词"
                                >
                                    <CopyIcon className="w-4 h-4" />
                                </button>
                                {copiedPromptId === result.id && (
                                    <span className="text-xs text-green-400 font-semibold">已复制</span>
                                )}
                                {result.status === 'done' && result.imageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadImage(result.imageUrl!, index)}
                                        className="p-2 rounded-full bg-white/5 text-gray-300 hover:bg-white/15 transition"
                                        title="下载图片"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="relative w-full min-h-[220px] bg-gray-900/60 border border-gray-700/70 rounded-xl flex items-center justify-center overflow-hidden">
                            {result.status === 'pending' && (
                                <div className="flex flex-col items-center gap-3 text-gray-300">
                                    <Spinner className="w-10 h-10 text-blue-400" />
                                    <span className="text-sm font-medium">正在根据提示词创作...</span>
                                </div>
                            )}
                            {result.status === 'error' && (
                                <div className="flex flex-col gap-2 text-center px-4">
                                    <span className="text-red-300 font-semibold">生成失败</span>
                                    <span className="text-sm text-red-200/80">{result.error}</span>
                                </div>
                            )}
                            {result.status === 'done' && result.imageUrl && (
                                <img
                                    src={result.imageUrl}
                                    alt={`批量生成的图像 ${index + 1}`}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BatchGenerationPage;
