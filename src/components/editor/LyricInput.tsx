import React from 'react';

export const LyricInput = ({ value, onChange, onKeyDown, className, ...props }: any) => {
  const renderStyledText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\\(.*?\\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return (
          <span key={i} className="text-amber-500 dark:text-amber-400">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Remove color classes from the base className for the input to ensure text-transparent works
  const inputClassName = className
    .replace(/(?:[a-z0-9-]+:)?text-(?:zinc|white|black|slate|stone|neutral|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\\d+)?/g, '')
    .trim();

  return (
    <div className="relative w-full flex items-center">
      <div 
        className={`${className} pointer-events-none whitespace-pre overflow-hidden absolute left-0 right-0 border-none bg-transparent px-0`}
        aria-hidden="true"
        style={{ font: 'inherit', letterSpacing: 'inherit' }}
      >
        {renderStyledText(value)}
      </div>
      <input
        {...props}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`${inputClassName} !text-transparent caret-zinc-900 dark:caret-white bg-transparent relative z-10 w-full border-none outline-none focus:ring-0 px-0`}
        style={{ font: 'inherit', letterSpacing: 'inherit' }}
      />
    </div>
  );
};
