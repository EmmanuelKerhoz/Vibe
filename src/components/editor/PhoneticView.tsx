import React, { useState, useEffect } from 'react';
import { Section } from '../../types';
import { runIPAPipeline } from '../../utils/ipaPipeline';
import { getSectionColorHex } from '../../utils/songUtils';
import { Loader2 } from '../ui/icons';

interface PhoneticViewProps {
  sections: Section[];
  songLanguage?: string;
  className?: string;
}

interface PhoneticLine {
  text: string;
  ipa: string;
  syllables: string[];
  rhymeNucleus: string;
  method: 'service' | 'client-fallback' | 'graphemic';
}

interface PhoneticSection {
  name: string;
  color: string;
  lines: PhoneticLine[];
  language: string;
}

export function PhoneticView({ sections, songLanguage = 'en', className = '' }: PhoneticViewProps) {
  const [phoneticSections, setPhoneticSections] = useState<PhoneticSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processLyrics = async () => {
      setIsLoading(true);
      const results: PhoneticSection[] = [];

      for (const section of sections) {
        const sectionLanguage = section.language || songLanguage;
        const phoneticLines: PhoneticLine[] = [];

        for (const line of section.lines) {
          // Skip empty lines and meta lines
          if (!line.text.trim() || line.isMeta) {
            phoneticLines.push({
              text: line.text,
              ipa: line.text,
              syllables: [],
              rhymeNucleus: '',
              method: 'graphemic',
            });
            continue;
          }

          try {
            const result = await runIPAPipeline(line.text, sectionLanguage);
            phoneticLines.push({
              text: line.text,
              ipa: result.ipa || line.text,
              syllables: result.syllables.map(s => `${s.onset}${s.nucleus}${s.coda}${s.tone || ''}`),
              rhymeNucleus: result.rhymeNucleus,
              method: result.method,
            });
          } catch (error) {
            // Fallback to original text on error
            phoneticLines.push({
              text: line.text,
              ipa: line.text,
              syllables: [],
              rhymeNucleus: '',
              method: 'graphemic',
            });
          }
        }

        results.push({
          name: section.name,
          color: getSectionColorHex(section.name),
          lines: phoneticLines,
          language: sectionLanguage,
        });
      }

      setPhoneticSections(results);
      setIsLoading(false);
    };

    processLyrics();
  }, [sections, songLanguage]);

  if (isLoading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[var(--accent-color)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest">
            Processing Phonetics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${className}`} style={{ padding: '1.5rem' }}>
      {phoneticSections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="mb-8">
          {/* Section Header */}
          <div className="mb-4">
            <h3
              className="text-base font-bold tracking-widest uppercase mb-1"
              style={{ color: section.color }}
            >
              [{section.name}]
            </h3>
            <div className="text-xs text-[var(--text-secondary)] opacity-75">
              Language: {section.language.toUpperCase()}
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-4">
            {section.lines.map((line, lineIdx) => (
              <div key={lineIdx} className="phonetic-line">
                {/* Original Text */}
                <div className="text-sm text-[var(--text-primary)] mb-1 font-normal">
                  {line.text}
                </div>

                {/* IPA Transcription */}
                {line.ipa && line.ipa !== line.text && (
                  <div className="text-base text-[var(--accent-color)] font-mono mb-1">
                    /{line.ipa}/
                  </div>
                )}

                {/* Syllable Breakdown */}
                {line.syllables.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1">
                    {line.syllables.map((syllable, syllIdx) => (
                      <span
                        key={syllIdx}
                        className="text-xs text-[var(--text-secondary)] bg-[var(--bg-sidebar)] px-2 py-0.5 rounded border border-[var(--border-color)]"
                      >
                        {syllable}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rhyme Nucleus */}
                {line.rhymeNucleus && (
                  <div className="text-xs text-[#22d3ee] opacity-85">
                    <span className="opacity-60">Rhyme nucleus:</span> {line.rhymeNucleus}
                  </div>
                )}

                {/* Method indicator (for debugging/transparency) */}
                {line.method !== 'service' && line.text.trim() && !line.text.startsWith('[') && (
                  <div className="text-xs text-[var(--text-secondary)] opacity-50 mt-1">
                    ({line.method === 'client-fallback' ? 'client fallback' : 'graphemic fallback'})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-[var(--text-secondary)]">
            No lyrics to display in phonetic view
          </p>
        </div>
      )}
    </div>
  );
}
