import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableColumnDefinition,
  createTableColumn,
  Badge,
  Button,
  tokens,
  TableRowId,
} from '@fluentui/react-components';
import { Delete24Regular, Cloud24Regular, Laptop24Regular } from '@fluentui/react-icons';
import type { TrackEntry } from './types';

interface TrackListProps {
  tracks: TrackEntry[];
  selectedId: string | undefined;
  onSelect: (track: TrackEntry) => void;
  onRemove: (id: string) => void;
  filter: 'cloud' | 'local' | 'all';
}

export function TrackList({ tracks, selectedId, onSelect, onRemove, filter }: TrackListProps) {
  const visible = filter === 'all' ? tracks : tracks.filter(t => t.source === filter);

  const columns: TableColumnDefinition<TrackEntry>[] = [
    createTableColumn<TrackEntry>({
      columnId: 'source',
      renderHeaderCell: () => '',
      renderCell: item => (
        <Badge
          appearance="tint"
          color={item.source === 'cloud' ? 'informative' : 'subtle'}
          icon={item.source === 'cloud' ? <Cloud24Regular /> : <Laptop24Regular />}
          size="small"
          aria-label={item.source}
        />
      ),
    }),
    createTableColumn<TrackEntry>({
      columnId: 'title',
      renderHeaderCell: () => 'Title',
      renderCell: item => (
        <span style={{
          color: item.linked ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground3,
          fontSize: tokens.fontSizeBase300,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.title}
        </span>
      ),
    }),
    createTableColumn<TrackEntry>({
      columnId: 'memo',
      renderHeaderCell: () => 'Memo',
      renderCell: item => (
        <span style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
          {item.memo}
        </span>
      ),
    }),
    createTableColumn<TrackEntry>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: item => (
        <Button
          appearance="subtle"
          icon={<Delete24Regular />}
          size="small"
          onClick={e => { e.stopPropagation(); onRemove(item.id); }}
          aria-label={`Remove ${item.title}`}
        />
      ),
    }),
  ];

  const selectedItems = new Set<TableRowId>(selectedId ? [selectedId] : []);

  return (
    <DataGrid
      items={visible}
      columns={columns}
      getRowId={item => item.id}
      selectionMode="single"
      selectedItems={selectedItems}
      onSelectionChange={(_, { selectedItems: sel }) => {
        const id = [...sel][0] as string | undefined;
        const t = id ? visible.find(x => x.id === id) : undefined;
        if (t) onSelect(t);
      }}
      style={{ background: 'transparent' }}
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<TrackEntry>>
        {({ item, rowId }) => (
          <DataGridRow<TrackEntry>
            key={rowId}
            style={{
              cursor: 'pointer',
              background: item.id === selectedId ? tokens.colorNeutralBackground1Selected : 'transparent',
            }}
          >
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}
