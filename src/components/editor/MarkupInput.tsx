import React from 'react';
import { getSectionTextColor } from '../../utils/songUtils';

export const MarkupInput = ({ value, onChange, textareaRef, className, onScroll, ...props }: any) => {
  const renderStyledMarkup = (text: string) => {
    if (!text) return null;
    const lines = text.split('\\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      const isSection = (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('**[') && trimmed.endsWith(']**'));
      
      let colorClass = '';
      if (isSection) {
        const name = trimmed.replace(/[\\[\\]\\*]/g, '');
        colorClass = getSectionTextColor(name) + ' font-bold';
      }
      
      return (
        <div key={i} className={colorClass}>
          {line || '\\u00A0'}
        </div>
      );
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div 
        className={`${className} pointer-events-none whitespace-pre-wrap overflow-hidden absolute inset-0 border-transparent bg-transparent`}
        aria-hidden="true"
        style={{ 
          font: 'inherit', 
          letterSpacing: 'inherit', 
          lineHeight: 'inherit',
          padding: '1.25rem',
          boxSizing: 'border-box'
        }}
      >
        {renderStyledMarkup(value)}
      </div>
      <textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={onScroll}
        className={`${className} !text-transparent caret-zinc-900 dark:caret-white relative z-10 bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] whitespace-pre-wrap`}
        style={{ 
          font: 'inherit', 
          letterSpacing: 'inherit', 
          lineHeight: 'inherit',
          padding: '1.25rem',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};
