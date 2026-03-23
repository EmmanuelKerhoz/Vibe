import { strToU8, zipSync } from 'fflate';
import type { Section } from '../types';

export type ExportFormat = 'txt' | 'markup' | 'odt' | 'docx';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const ODT_MIME = 'application/vnd.oasis.opendocument.text';

type SongExportParams = {
  song: Section[];
  title: string;
  topic: string;
  mood: string;
  songLanguage?: string;
  format: ExportFormat;
};

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const escapeMarkdown = (value: string) => value.replace(/([\\`*_{}[\]()#+\-.!|>])/g, '\\$1');

const getBaseFileName = (title: string) => (title.trim() || 'Untitled Song').replace(/\s+/g, '_');

/** Returns true if a lyric line text is an artifact that should be excluded from exports. */
const isArtifactLine = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed === '' || trimmed === '[]';
};

const buildTxtContent = (song: Section[], title: string, songLanguage = '') => {
  let content = songLanguage.trim() ? `# lang: ${songLanguage.trim()}\n\n` : '';
  content += `${title}\n\n`;
  song.forEach(section => {
    content += `[${section.name}]\n`;
    section.lines
      .filter(line => !isArtifactLine(line.text))
      .forEach(line => { content += `${line.text}\n`; });
    content += '\n';
  });
  return content;
};

const buildMarkupContent = (song: Section[], title: string, topic: string, mood: string) => {
  let content = `# ${escapeMarkdown(title)}\n\n`;
  content += `**Topic:** ${escapeMarkdown(topic)}\n`;
  content += `**Mood:** ${escapeMarkdown(mood)}\n\n`;
  song.forEach(section => {
    content += `### ${escapeMarkdown(section.name)}\n\n`;
    section.lines
      .filter(line => !isArtifactLine(line.text))
      .forEach(line => {
        content += line.isMeta
          ? `*${escapeMarkdown(line.text)}*  \n`
          : `${escapeMarkdown(line.text)}  \n`;
      });
    content += '\n';
  });
  return content;
};

const buildWordParagraph = (text: string, options?: { bold?: boolean }) => {
  if (!text) return '<w:p/>';
  return `<w:p><w:r>${options?.bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
};

const buildDocxBlob = (song: Section[], title: string, topic: string, mood: string, songLanguage = '') => {
  const paragraphs = [
    buildWordParagraph(title, { bold: true }),
    buildWordParagraph(`Topic: ${topic}`),
    buildWordParagraph(`Mood: ${mood}`),
    '<w:p/>',
    ...song.flatMap(section => [
      buildWordParagraph(section.name, { bold: true }),
      ...section.lines
        .filter(line => !isArtifactLine(line.text))
        .map(line => buildWordParagraph(line.text)),
      '<w:p/>',
    ]),
  ].join('');
  const trimmedSongLanguage = songLanguage.trim();

  const files = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  ${trimmedSongLanguage ? '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' : ''}
</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  ${trimmedSongLanguage ? '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' : ''}
</Relationships>`),
    'word/document.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`),
    ...(trimmedSongLanguage ? {
      'docProps/core.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties
  xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:language>${escapeXml(trimmedSongLanguage)}</dc:language>
</cp:coreProperties>`),
    } : {}),
  };

  return new Blob([zipSync(files, { level: 0 })], { type: DOCX_MIME });
};

const buildOdtBlob = (song: Section[], title: string, topic: string, mood: string, songLanguage = '') => {
  const paragraphs = [
    `<text:p text:style-name="Title">${escapeXml(title)}</text:p>`,
    `<text:p text:style-name="Standard">${escapeXml(`Topic: ${topic}`)}</text:p>`,
    `<text:p text:style-name="Standard">${escapeXml(`Mood: ${mood}`)}</text:p>`,
    '<text:p text:style-name="Standard"/>',
    ...song.flatMap(section => [
      `<text:p text:style-name="Heading">${escapeXml(section.name)}</text:p>`,
      ...section.lines
        .filter(line => !isArtifactLine(line.text))
        .map(line => `<text:p text:style-name="Standard">${escapeXml(line.text)}</text:p>`),
      '<text:p text:style-name="Standard"/>',
    ]),
  ].join('');
  const trimmedSongLanguage = songLanguage.trim();

  const files = {
    mimetype: strToU8(ODT_MIME),
    'content.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="Title" style:family="paragraph">
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading" style:family="paragraph">
      <style:text-properties fo:font-size="12pt" fo:font-weight="bold"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>
      ${paragraphs}
    </office:text>
  </office:body>
</office:document-content>`),
    'styles.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.2">
  <office:styles>
    <style:default-style style:family="paragraph"/>
  </office:styles>
</office:document-styles>`),
    'meta.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.2">
  <office:meta>
    <meta:generator>Vibe Export</meta:generator>
    ${trimmedSongLanguage ? `<dc:language>${escapeXml(trimmedSongLanguage)}</dc:language>` : ''}
  </office:meta>
</office:document-meta>`),
    'settings.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  office:version="1.2">
  <office:settings/>
</office:document-settings>`),
    'META-INF/manifest.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="${ODT_MIME}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`),
  };

  return new Blob([zipSync(files, { level: 0 })], { type: ODT_MIME });
};

export const createSongExport = ({
  song, title, topic, mood, songLanguage = '', format,
}: SongExportParams): { blob: Blob; filename: string } => {
  const baseFileName = getBaseFileName(title);
  switch (format) {
    case 'txt':
      return {
        blob: new Blob(['\uFEFF' + buildTxtContent(song, title, songLanguage)], { type: 'text/plain;charset=utf-8' }),
        filename: `${baseFileName}.txt`,
      };
    case 'markup':
      return {
        blob: new Blob([buildMarkupContent(song, title, topic, mood)], { type: 'text/markdown;charset=utf-8' }),
        filename: `${baseFileName}.md`,
      };
    case 'docx':
      return { blob: buildDocxBlob(song, title, topic, mood, songLanguage), filename: `${baseFileName}.docx` };
    case 'odt':
      return { blob: buildOdtBlob(song, title, topic, mood, songLanguage), filename: `${baseFileName}.odt` };
  }
};
