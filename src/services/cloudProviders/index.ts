/**
 * cloudProviders/index.ts — Strategy registry.
 *
 * Maps each CloudProviderId to its PickStrategy instance.
 * Import this in cloudStorage.ts to replace the switch dispatcher.
 */

import type { CloudProviderId } from '../cloudStorage';
import type { PickStrategy } from './PickStrategy';
import { OneDrivePersonalStrategy, OneDriveBusinessStrategy } from './OneDriveStrategy';
import { DropboxStrategy } from './DropboxStrategy';
import { BoxStrategy } from './BoxStrategy';
import { GDriveStrategy } from './GDriveStrategy';

export const strategies: Record<CloudProviderId, PickStrategy> = {
  'onedrive':          new OneDrivePersonalStrategy(),
  'onedrive-business': new OneDriveBusinessStrategy(),
  'dropbox':           new DropboxStrategy(),
  'box':               new BoxStrategy(),
  'gdrive':            new GDriveStrategy(),
};

export type { PickStrategy };
