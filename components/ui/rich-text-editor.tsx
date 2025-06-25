"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { IJodit } from "jodit/types/jodit";
import type { IControlType } from "jodit/types/types/toolbar";
import { Skeleton } from "./skeleton";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { Textarea } from "./textarea";
import { 
  Eye, 
  Code, 
  Smartphone, 
  Monitor, 
  Copy, 
  Download, 
  Palette,
  Layout,
  Type,
  Image as ImageIcon
} from "lucide-react";

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
  enableSectionBuilder?: boolean;
  enableAdvancedPreview?: boolean;
  title?: string;
  subtitle?: string;
}

// Section template interface
interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  html: string;
  category: 'hero' | 'content' | 'cta' | 'gallery' | 'custom';
}

// Built-in section templates
const sectionTemplates: SectionTemplate[] = [
  {
    id: 'hero-banner',
    name: 'Hero Banner',
    description: 'Full-width banner with background image',
    category: 'hero',
    html: `<section class="hero-banner" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 80px 20px; text-align: center; min-height: 400px; display: flex; align-items: center; justify-content: center;">
  <div style="max-width: 800px;">
    <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Your Amazing Title</h1>
    <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;">Your compelling subtitle or description goes here</p>
    <button style="background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 50px; font-size: 1.1rem; cursor: pointer; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Get Started</button>
  </div>
</section>`
  },
  {
    id: 'content-section',
    name: 'Content Section',
    description: 'Clean content area with typography',
    category: 'content',
    html: `<section style="padding: 60px 20px; max-width: 1200px; margin: 0 auto;">
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
    <div>
      <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: #2d3748;">Feature Title</h2>
      <p style="font-size: 1.1rem; line-height: 1.6; color: #4a5568; margin-bottom: 1.5rem;">Describe your amazing feature or product benefit here. Make it compelling and informative.</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 0.5rem; color: #4a5568;"><span style="color: #48bb78; margin-right: 8px;">✓</span>Feature point one</li>
        <li style="margin-bottom: 0.5rem; color: #4a5568;"><span style="color: #48bb78; margin-right: 8px;">✓</span>Feature point two</li>
        <li style="margin-bottom: 0.5rem; color: #4a5568;"><span style="color: #48bb78; margin-right: 8px;">✓</span>Feature point three</li>
      </ul>
    </div>
    <div style="text-align: center;">
      <div style="width: 100%; height: 300px; background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">Image Placeholder</div>
    </div>
  </div>
</section>`
  },
  {
    id: 'cta-section',
    name: 'Call to Action',
    description: 'Conversion-focused CTA section',
    category: 'cta',
    html: `<section style="background: #2d3748; color: white; padding: 80px 20px; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">Ready to Get Started?</h2>
    <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">Join thousands of satisfied customers and transform your business today.</p>
    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
      <button style="background: #48bb78; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='#38a169'" onmouseout="this.style.background='#48bb78'">Start Free Trial</button>
      <button style="background: transparent; color: white; padding: 15px 30px; border: 2px solid white; border-radius: 8px; font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='white'; this.style.color='#2d3748'" onmouseout="this.style.background='transparent'; this.style.color='white'">Learn More</button>
    </div>
  </div>
</section>`
  },
  {
    id: 'gallery-grid',
    name: 'Image Gallery',
    description: 'Responsive image grid layout',
    category: 'gallery',
    html: `<section style="padding: 60px 20px; max-width: 1200px; margin: 0 auto;">
  <h2 style="text-align: center; font-size: 2.5rem; font-weight: bold; margin-bottom: 3rem; color: #2d3748;">Gallery</h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
    <div style="height: 200px; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Image 1</div>
    <div style="height: 200px; background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Image 2</div>
    <div style="height: 200px; background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Image 3</div>
    <div style="height: 200px; background: linear-gradient(45deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Image 4</div>
  </div>
</section>`
  }
];

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
  enableSectionBuilder = false,
  enableAdvancedPreview = false,
  title,
  subtitle,
}: RichTextEditorProps) {
  const editorRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Set up responsive design state
  const [isMobile, setIsMobile] = useState(false);
  
  // Enhanced preview states
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [generatedHTML, setGeneratedHTML] = useState('');
  
  // Section builder states
  const [showSectionBuilder, setShowSectionBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SectionTemplate | null>(null);

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

  // Generate complete HTML when content changes
  useEffect(() => {
    generateCompleteHTML();
  }, [value, title, subtitle]);

  // Configure Jodit editor
  const config = createJoditConfig(isMobile, height, placeholder, tabIndex);

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

  // Generate complete HTML structure
  const generateCompleteHTML = () => {
    let html = '';
    
    // If no title and subtitle, create a custom section
    if (!title && !subtitle && enableSectionBuilder) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Content</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    @media (max-width: 768px) {
      .container { padding: 0 20px; }
      section { padding: 40px 20px !important; }
      h1 { font-size: 2rem !important; }
      h2 { font-size: 1.8rem !important; }
      .grid { grid-template-columns: 1fr !important; gap: 20px !important; }
    }
  </style>
</head>
<body>
  <main>
    ${value}
  </main>
</body>
</html>`;
    } else {
      // Standard content with title/subtitle
      html = `<article class="content-article">
        ${title ? `<h1 class="content-title">${title}</h1>` : ''}
        ${subtitle ? `<h2 class="content-subtitle">${subtitle}</h2>` : ''}
        <div class="content-body">
          ${value}
        </div>
      </article>`;
    }
    
    setGeneratedHTML(html);
  };

  // Insert template into editor
  const insertTemplate = (template: SectionTemplate) => {
    const currentContent = value || '';
    const newContent = currentContent + '\n\n' + template.html;
    onChange(newContent);
    setShowSectionBuilder(false);
  };

  // Copy HTML to clipboard
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Download HTML file
  const downloadHTML = () => {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-content.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get preview container styles based on device
  const getPreviewStyles = () => {
    switch (previewDevice) {
      case 'mobile':
        return { width: '375px', height: '600px', margin: '0 auto' };
      case 'tablet':
        return { width: '768px', height: '600px', margin: '0 auto' };
      default:
        return { width: '100%', height: '600px' };
    }
  };

  if (!isMounted) {
    return <EditorSkeleton />;
  }

  return (
    <div className="relative space-y-4">
      {/* Enhanced Controls */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('edit')}
          >
            <Type className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant={viewMode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('code')}
          >
            <Code className="w-4 h-4 mr-1" />
            HTML
          </Button>
        </div>

        <div className="flex gap-2">
          {enableSectionBuilder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSectionBuilder(!showSectionBuilder)}
            >
              <Layout className="w-4 h-4 mr-1" />
              Sections
            </Button>
          )}
          
          {enableAdvancedPreview && viewMode === 'preview' && (
            <>
              <Button
                variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('tablet')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className="w-3 h-3" />
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(generatedHTML)}
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadHTML}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Section Builder Panel */}
      {showSectionBuilder && enableSectionBuilder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Section Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <Button 
                      size="sm" 
                      onClick={() => insertTemplate(template)}
                      className="w-full"
                    >
                      Insert Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Area */}
      <div className="relative">
        {/* Editor Mode */}
        {viewMode === 'edit' && (
          <div className="border rounded-md">
            <JoditEditor
              ref={editorRef}
              value={value}
              config={config}
              onBlur={(newContent) => onChange(newContent)}
              onChange={(newContent) => {}}
            />
          </div>
        )}

        {/* Preview Mode */}
        {viewMode === 'preview' && (
          <Card>
            <CardContent className="p-0">
              <div 
                className="border rounded-md overflow-auto bg-white"
                style={getPreviewStyles()}
              >
                <div
                  className="prose max-w-none p-4"
                  dangerouslySetInnerHTML={{ __html: enableSectionBuilder && !title && !subtitle ? value : generatedHTML }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Code Mode */}
        {viewMode === 'code' && (
          <Card>
            <CardContent className="p-4">
              <Textarea
                value={generatedHTML}
                onChange={(e) => setGeneratedHTML(e.target.value)}
                className="font-mono text-sm min-h-[400px]"
                placeholder="Generated HTML will appear here..."
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Mode: {viewMode}</span>
          {viewMode === 'preview' && enableAdvancedPreview && (
            <span>Device: {previewDevice}</span>
          )}
          <span>Characters: {value.length}</span>
        </div>
        
        {(!title && !subtitle && enableSectionBuilder) && (
          <Badge variant="outline">
            <Layout className="w-3 h-3 mr-1" />
            Section Mode
          </Badge>
        )}
      </div>
    </div>
  );
}