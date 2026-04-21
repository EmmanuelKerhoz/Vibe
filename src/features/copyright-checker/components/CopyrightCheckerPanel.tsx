import React, { useState } from 'react';
import {
  Body1, Button, Caption1, Card, CardHeader, Divider, Field,
  Input, Spinner, Subtitle2, Textarea, Title3,
} from '@fluentui/react-components';
import { RiskBadge } from './RiskBadge';
import { FlaggedMatchesTable } from './FlaggedMatchesTable';
import { useCopyrightChecker } from '../hooks/useCopyrightChecker';
import type { CheckerConfig, LanguageCode } from '../domain/types';
import type { ReferenceCorpusRepository } from '../services/repository/ReferenceCorpusRepository';
import type { EmbeddingProvider } from '../services/similarity/SemanticMatcher';

export const CHECKER_DISCLAIMER =
  'This similarity assessment is an internal risk signal only. ' +
  'It is not a legal opinion and does not confirm copyright clearance.';

interface CopyrightCheckerPanelProps {
  readonly repository: ReferenceCorpusRepository;
  readonly config?: CheckerConfig;
  readonly embeddings?: EmbeddingProvider;
  readonly initialText?: string;
  readonly initialTitle?: string;
  readonly initialArtist?: string;
  readonly initialLanguage?: LanguageCode;
}

const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 };

/**
 * Internal review panel: submit lyrics, see a risk score, top reasons,
 * a privacy-redacted overlap table, a reviewer note template, and the
 * mandatory disclaimer. No external lyrics are ever displayed here.
 */
export const CopyrightCheckerPanel: React.FC<CopyrightCheckerPanelProps> = ({
  repository, config, embeddings,
  initialText = '', initialTitle = '', initialArtist = '', initialLanguage,
}) => {
  const [text, setText] = useState(initialText);
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage ?? 'en');

  const checker = useCopyrightChecker({
    repository,
    ...(config ? { config } : {}),
    ...(embeddings ? { embeddings } : {}),
  });

  const handleRun = (): void => {
    checker.runCheck({
      text,
      ...(title ? { title } : {}),
      ...(artist ? { artist } : {}),
      ...(language ? { language } : {}),
    });
  };

  return (
    <Card aria-label="Lyrics similarity risk checker" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <CardHeader
        header={<Title3>Lyrics similarity risk checker</Title3>}
        description={<Caption1>Internal review tool — not a legal verdict.</Caption1>}
      />

      <div style={rowStyle}>
        <Field label="Title (optional)" style={fieldStyle}>
          <Input value={title} onChange={(_, d) => setTitle(d.value)} />
        </Field>
        <Field label="Artist (optional)" style={fieldStyle}>
          <Input value={artist} onChange={(_, d) => setArtist(d.value)} />
        </Field>
        <Field label="Language" style={fieldStyle}>
          <Input value={language} onChange={(_, d) => setLanguage(d.value)} maxLength={5} />
        </Field>
      </div>

      <Field label="Lyrics" style={fieldStyle}>
        <Textarea
          value={text}
          onChange={(_, d) => setText(d.value)}
          rows={10}
          placeholder="Paste lyrics here for an internal similarity risk check…"
          aria-describedby="checker-disclaimer"
        />
      </Field>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          appearance="primary"
          onClick={handleRun}
          disabled={!text.trim() || checker.status === 'running'}
        >
          Run similarity check
        </Button>
        <Button appearance="subtle" onClick={checker.reset} disabled={checker.status === 'idle'}>
          Reset
        </Button>
        {checker.status === 'running' && <Spinner size="tiny" label="Analyzing…" />}
      </div>

      <Divider />

      {checker.status === 'idle' && !checker.assessment && (
        <Body1 style={{ opacity: 0.7 }}>Enter lyrics and run a check to see results.</Body1>
      )}

      {checker.status === 'error' && checker.error && (
        <Body1 role="alert" style={{ color: 'var(--colorPaletteRedForeground1, #b00020)' }}>
          {checker.error}
        </Body1>
      )}

      {checker.status === 'done' && checker.assessment && (
        <ResultsSection assessment={checker.assessment} />
      )}

      <Caption1 id="checker-disclaimer" style={{ opacity: 0.75 }}>
        {CHECKER_DISCLAIMER}
      </Caption1>
    </Card>
  );
};

interface ResultsSectionProps {
  readonly assessment: import('../domain/types').RiskAssessment;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ assessment }) => {
  const noResults = assessment.flaggedMatches.length === 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <RiskBadge level={assessment.level} score={assessment.overallScore} />
        <Caption1>Score: <strong>{assessment.overallScore}</strong> / 100</Caption1>
      </div>

      {noResults ? (
        <Body1 style={{ opacity: 0.8 }}>
          No similarity findings above threshold. Continue routine review.
        </Body1>
      ) : (
        <>
          <Subtitle2 as="h4" style={{ margin: 0 }}>Top reasons</Subtitle2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {assessment.reasons.slice(0, 5).map((r) => (
              <li key={r.code}><Body1>{r.message}</Body1></li>
            ))}
          </ul>

          <Subtitle2 as="h4" style={{ margin: 0 }}>Flagged overlaps</Subtitle2>
          <FlaggedMatchesTable matches={assessment.flaggedMatches} />

          <Subtitle2 as="h4" style={{ margin: 0 }}>Reviewer note template</Subtitle2>
          <pre
            style={{
              fontFamily: 'inherit', fontSize: 12, whiteSpace: 'pre-wrap',
              background: 'var(--colorNeutralBackground2, #f5f5f5)',
              padding: 12, borderRadius: 6, margin: 0,
            }}
          >{assessment.reviewerNotesTemplate}</pre>
        </>
      )}
    </div>
  );
};
