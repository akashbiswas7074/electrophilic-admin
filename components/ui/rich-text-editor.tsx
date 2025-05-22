"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IJodit } from "jodit/types/jodit";
import type { IControlType } from "jodit/types/types/toolbar";
import { Skeleton } from "./skeleton";

// Import Jodit Editor with dynamic import for better performance
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

// Loading skeleton for the editor
const EditorSkeleton = () => (
  <div className="border rounded-md p-4 min-h-[400px] flex items-center justify-center bg-muted/20">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-pulse flex space-x-2">
        <div className="h-4 w-4 bg-muted rounded-full animate-bounce"></div>
        <div className="h-4 w-4 bg-muted rounded-full animate-bounce delay-150"></div>
        <div className="h-4 w-4 bg-muted rounded-full animate-bounce delay-300"></div>
      </div>
      <p className="text-muted-foreground text-sm">Loading editor...</p>
    </div>
  </div>
);

// Define the props for our component
interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  tabIndex?: number;
}

// Export the config creation function so it can be used elsewhere if needed
export const createJoditConfig = (isMobile: boolean, height: number, placeholder: string, tabIndex?: number): any => {
  return {
    readonly: false,
    height: height,
    width: '100%',
    language: 'en',
    direction: 'ltr',
    theme: 'default',
    enter: 'br',
    toolbarSticky: true,
    toolbarStickyOffset: 0,
    placeholder: placeholder,
    tabIndex: tabIndex,
    
    // Style and helper plugins
    beautifyHTML: true,
    removeEmptyTags: true,
    
    // Better mobile support
    buttons: isMobile
      ? [
          'bold', 'italic', 'underline', '|',
          'ul', 'ol', '|',
          'link', 'image', '|',
          'fullsize'
        ]
      : [
          'source', '|',
          'bold', 'italic', 'underline', 'strikethrough', '|',
          'ul', 'ol', '|',
          'outdent', 'indent', '|',
          'fontsize', 'brush', '|',
          'image', 'table', 'link', 'hr', '|',
          'align', '|',
          'undo', 'redo', '|',
          'fullsize'
        ],
    
    // Events with safeguards
    events: {
      afterInit: function(editor: any) {
        try {
          // Force editor to recognize lists properly
          editor.e.on('afterGetValueFromEditor', function(html: any) {
            if (typeof html !== 'string') {
              return html === null || html === undefined ? '' : String(html);
            }
            
            return html.replace(/<ul/g, '<ul style="list-style-type: disc; padding-left: 40px;"')
                      .replace(/<ol/g, '<ol style="list-style-type: decimal; padding-left: 40px;"')
                      .replace(/<li/g, '<li style="margin-bottom: 8px;"');
          });
        } catch (e) {
          console.error('Editor initialization event error:', e);
        }
      },
      
      afterGetValueFromEditor: (html: string | null | undefined) => {
        if (typeof html === 'string') {
          return html
            .replace(/<p><\/p>/g, '')
            .replace(/<p>&nbsp;<\/p>/g, '')
            .replace(/&nbsp;/g, ' ');
        }
        return html || '';
      },
    },
    
    // Mobile-friendly toolbar
    toolbarAdaptive: isMobile,
    sizeLG: 900,
    sizeMD: 700,
    sizeSM: 400,
    
    // User-friendly responsive UI
    allowResizeY: true,
    spellcheck: true,
    
    // Better image handling
    enableDragAndDropFileToEditor: true,
    uploader: {
      insertImageAsBase64URI: true
    },
    
    // Style options
    style: {
      fontSize: '16px',
      lineHeight: '1.6',
    },
  };
};

// Export a default config for global use
export const joditConfig = createJoditConfig(false, 500, "Start writing...");

export function RichTextEditor({
  value,
  onChange,
  height = 500,
  placeholder = "Start writing...",
  tabIndex,
}: RichTextEditorProps) {
  const editorRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Set up responsive design state
  const [isMobile, setIsMobile] = useState(false);
  
  // Only render on client-side to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    
    // Check if on mobile device
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Configure Jodit editor
  const config = createJoditConfig(isMobile, height, placeholder, tabIndex);

  // Handle preview functionality
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Handle clipboard events properly
  useEffect(() => {
    if (!isMounted) return;
    
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      if (isResizing) e.preventDefault();
    };
    
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isMounted, isResizing]);

  if (!isMounted) {
    return <EditorSkeleton />;
  }

  return (
    <div className="relative">
      {/* Main Editor */}
      <div className={`border rounded-md ${showPreview ? 'hidden' : 'block'}`}>
        <JoditEditor
          ref={editorRef}
          value={value}
          config={config}
          onBlur={(newContent) => onChange(newContent)}
          onChange={(newContent) => {}}
        />
      </div>
      
      {/* Preview Mode */}
      {showPreview && (
        <div className="border rounded-md p-4 min-h-[400px] bg-white overflow-auto">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
      
      {/* Preview Toggle Button */}
      <div className="mt-2 flex justify-end">
        <button 
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80 transition-colors"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>
    </div>
  );
}