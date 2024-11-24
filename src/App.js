import React, { useState, useEffect } from 'react';
import { Split, Copy, Download, Upload } from 'lucide-react';
import './App.css'
// Enhanced markdown processing function that calls our backend
const processMarkdown = async (markdown) => {
  try {
    const response = await fetch('http://localhost:3001/api/markdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: markdown ? JSON.stringify({ markdown }) : "",
    });
    
    if (!response.ok) {
      throw new Error('Failed to process markdown');
    }
    
    const data = await response.json();
    return data.html;
  } catch (error) {
    console.log( error);
    if(error.response)
    
    return 'Error processing markdown';
  }
};

// Syntax highlighting helpers
const syntaxPatterns = [
  { pattern: /(^# .*$)/gm, className: 'text-purple-500' }, // h1
  { pattern: /(^## .*$)/gm, className: 'text-blue-500' }, // h2
  { pattern: /(\*\*.*?\*\*)/g, className: 'text-green-500' }, // bold
  { pattern: /(\*.*?\*)/g, className: 'text-yellow-600' }, // italic
  { pattern: /(`.*?`)/g, className: 'text-red-500 bg-gray-100 rounded px-1' }, // inline code
  { pattern: /(\[.*?\]\(.*?\))/g, className: 'text-blue-600' }, // links
];

const applySyntaxHighlighting = (text, selectionStart) => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    let segments = [{ text: line, className: '' }];
    
    syntaxPatterns.forEach(({ pattern, className }) => {
      segments = segments.flatMap(segment => {
        if (!segment.className) {
          const parts = segment.text.split(pattern);
          const matches = segment.text.match(pattern) || [];
          
          return parts.reduce((acc, part, i) => {
            if (i > 0) {
              acc.push({ text: matches[i - 1], className });
            }
            if (part) {
              acc.push({ text: part, className: '' });
            }
            return acc;
          }, []);
        }
        return [segment];
      });
    });
    
    return (
      <div key={lineIndex} className="whitespace-pre">
        {segments.map((segment, i) => (
          <span key={i} className={segment.className}>
            {segment.text}
          </span>
        ))}
      </div>
    );
  });
};

const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);

  useEffect(() => {
    const convertMarkdown = async () => {
      setIsProcessing(true);
      try {
        const processed = await processMarkdown(markdown);
        setHtml(processed);
      } catch (error) {
        console.error('Error processing markdown:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    const timeoutId = setTimeout(convertMarkdown, 300);
    return () => clearTimeout(timeoutId);
  }, [markdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4 bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Split className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Enhanced Markdown Editor</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Copy content"
          >
            <Copy className="h-5 w-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Download markdown"
          >
            <Download className="h-5 w-5" />
          </button>
          <label className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors" title="Upload markdown">
            <Upload className="h-5 w-5" />
            <input
              type="file"
              accept=".md,.markdown"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Editor</h2>
          <div className="relative h-96 border rounded-md">
            <textarea
              className="absolute inset-0 w-full h-full p-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onSelect={(e) => setSelectionStart(e.target.selectionStart)}
              spellCheck="false"
            />
            <div className="absolute inset-0 w-full h-full p-2 font-mono text-sm pointer-events-none">
              {applySyntaxHighlighting(markdown, selectionStart)}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <div 
            className="w-full h-96 p-2 border rounded-md overflow-auto prose prose-sm"
            dangerouslySetInnerHTML={{ 
              __html: isProcessing ? 'Processing...' : html 
            }}
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {isProcessing ? 'Converting markdown...' : 'Ready'}
      </div>
    </div>
  );
};

export default MarkdownEditor;