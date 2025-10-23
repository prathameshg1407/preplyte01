import React from 'react';

interface TipTapContent {
  type: string;
  content?: TipTapContent[];
  text?: string;
  marks?: Array<{ type: string; attrs?: any }>;
  attrs?: any;
}

interface TipTapRendererProps {
  content: TipTapContent | string;
  className?: string;
}

function renderNode(node: TipTapContent, index: number): React.ReactNode {
  // Handle text nodes
  if (node.type === 'text') {
    let text: React.ReactNode = node.text || '';
    
    // Apply text marks (bold, italic, etc.)
    if (node.marks) {
      node.marks.forEach((mark) => {
        switch (mark.type) {
          case 'bold':
            text = <strong key={`bold-${index}`}>{text}</strong>;
            break;
          case 'italic':
            text = <em key={`italic-${index}`}>{text}</em>;
            break;
          case 'code':
            text = <code key={`code-${index}`} className="bg-muted px-1 py-0.5 rounded text-sm">{text}</code>;
            break;
          case 'underline':
            text = <u key={`underline-${index}`}>{text}</u>;
            break;
          case 'strike':
            text = <s key={`strike-${index}`}>{text}</s>;
            break;
          case 'link':
            text = (
              <a 
                key={`link-${index}`}
                href={mark.attrs?.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {text}
              </a>
            );
            break;
        }
      });
    }
    
    return text;
  }

  // Handle block nodes
  const children = node.content?.map((child, i) => renderNode(child, i)) || [];

  switch (node.type) {
    case 'doc':
      return <div key={index}>{children}</div>;

    case 'paragraph':
      return <p key={index} className="mb-3 last:mb-0">{children}</p>;

    case 'heading':
      const level = node.attrs?.level || 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const headingClasses = {
        1: 'text-2xl font-bold mb-4',
        2: 'text-xl font-bold mb-3',
        3: 'text-lg font-semibold mb-2',
        4: 'text-base font-semibold mb-2',
        5: 'text-sm font-semibold mb-2',
        6: 'text-sm font-semibold mb-2',
      };
      return <Tag key={index} className={headingClasses[level as keyof typeof headingClasses]}>{children}</Tag>;

    case 'bulletList':
      return <ul key={index} className="list-disc list-inside mb-3 space-y-1">{children}</ul>;

    case 'orderedList':
      return <ol key={index} className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;

    case 'listItem':
      return <li key={index}>{children}</li>;

    case 'codeBlock':
      return (
        <pre key={index} className="bg-muted p-3 rounded-lg overflow-x-auto mb-3">
          <code className="text-sm">{children}</code>
        </pre>
      );

    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-primary pl-4 italic mb-3">
          {children}
        </blockquote>
      );

    case 'horizontalRule':
      return <hr key={index} className="my-4 border-t border-border" />;

    case 'hardBreak':
      return <br key={index} />;

    case 'image':
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || ''}
          title={node.attrs?.title}
          className="max-w-full h-auto rounded-lg my-3"
        />
      );

    case 'table':
      return (
        <div key={index} className="overflow-x-auto mb-3">
          <table className="min-w-full border-collapse border border-border">
            <tbody>{children}</tbody>
          </table>
        </div>
      );

    case 'tableRow':
      return <tr key={index} className="border-b border-border">{children}</tr>;

    case 'tableCell':
    case 'tableHeader':
      const CellTag = node.type === 'tableHeader' ? 'th' : 'td';
      return (
        <CellTag 
          key={index} 
          className="border border-border px-3 py-2 text-left"
        >
          {children}
        </CellTag>
      );

    default:
      // Fallback for unknown node types
      return <div key={index}>{children}</div>;
  }
}

export default function TipTapRenderer({ content, className = '' }: TipTapRendererProps) {
  // Handle string content (plain text)
  if (typeof content === 'string') {
    return <div className={className}>{content}</div>;
  }

  // Handle empty content
  if (!content || !content.content) {
    return <div className={className}>No content available</div>;
  }

  // Render TipTap JSON
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      {renderNode(content, 0)}
    </div>
  );
}