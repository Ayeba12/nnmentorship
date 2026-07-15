"use client";

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, Link, Image, Code, Heading1, Heading2, Table, Undo, Redo 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync value from prop to editor (only if they differ)
  useEffect(() => {
    if (editorRef.current && isMounted) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isMounted]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
      handleInput();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter the link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertTable = () => {
    const tableHTML = `
      <table class="w-full border-collapse border border-navy-200 my-4 text-sm text-navy-800">
        <thead>
          <tr class="bg-navy-50">
            <th class="border border-navy-200 px-4 py-2 text-left font-semibold">Header 1</th>
            <th class="border border-navy-200 px-4 py-2 text-left font-semibold">Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-navy-200 px-4 py-2">Data 1</td>
            <td class="border border-navy-200 px-4 py-2">Data 2</td>
          </tr>
        </tbody>
      </table>
      <p>&nbsp;</p>
    `;
    execCommand('insertHTML', tableHTML);
  };

  return (
    <div className="border border-navy-200 rounded-lg overflow-hidden bg-white shadow-soft focus-within:ring-2 focus-within:ring-gold-400/40 focus-within:border-gold-400 transition-all flex flex-col min-h-[350px]">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 items-center p-2 border-b border-navy-100 bg-navy-50/50 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="px-2 py-1 rounded text-navy-600 hover:bg-navy-100 transition-colors text-xs font-semibold"
          title="Normal Paragraph"
        >
          Normal
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h1>')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-navy-200 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-navy-200 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Unordered List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-navy-200 mx-1" />

        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('unlink')}
          className="px-1.5 py-0.5 rounded text-red-500 hover:bg-navy-100 transition-colors text-xs font-semibold line-through"
          title="Remove Link"
        >
          Unlink
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertTable}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Insert Table"
        >
          <Table className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<pre>')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-navy-200 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('undo')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('redo')}
          className="p-1.5 rounded text-navy-600 hover:bg-navy-100 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editing Area */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[300px] focus:outline-none prose max-w-none prose-sm prose-navy bg-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="min-h-[300px] outline-none text-navy-800"
          data-placeholder={placeholder}
          style={{ minHeight: '300px' }}
        />
      </div>
    </div>
  );
}
