/**
 * Data provider: either in-code mock data or static JSON from server/resources/demo-data/.
 * Set DATA_SOURCE=static to use JSON files; otherwise re-exports from mock/data.
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  Part,
  Assembly,
  Change,
  MBOMMapping,
  ProductionOrder,
  InventoryRecord,
  ChangeClosureTracker,
  Relationship,
} from '../../types/canonical';

const DATA_SOURCE = process.env.DATA_SOURCE;
const USE_STATIC = DATA_SOURCE === 'static';

function getDemoDataDir(): string {
  // When running from server/ (e.g. tsx src/index.ts), __dirname is server/src/adapters/data
  const fromSrc = path.join(__dirname, '..', '..', '..', 'resources', 'demo-data');
  if (fs.existsSync(fromSrc)) return fromSrc;
  // When running from repo root, cwd may be root
  const fromCwd = path.join(process.cwd(), 'resources', 'demo-data');
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromCwdServer = path.join(process.cwd(), 'server', 'resources', 'demo-data');
  if (fs.existsSync(fromCwdServer)) return fromCwdServer;
  return fromSrc; // throw on first read if missing
}

function loadStaticData(): {
  PARTS: Record<string, Part>;
  ASSEMBLIES: Record<string, Assembly>;
  CHANGES: Record<string, Change>;
  MBOM_MAPPINGS: Record<string, MBOMMapping>;
  PRODUCTION_ORDERS: Record<string, ProductionOrder>;
  INVENTORY: Record<string, InventoryRecord>;
  CLOSURE_TRACKERS: Record<string, ChangeClosureTracker>;
  RELATIONSHIPS: Relationship[];
} {
  const dir = getDemoDataDir();

  const readJson = <T>(filename: string): T => {
    const raw = fs.readFileSync(path.join(dir, filename), 'utf-8');
    return JSON.parse(raw) as T;
  };

  const toRecord = <T>(obj: Record<string, T>): Record<string, T> =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.toUpperCase(), v])
    ) as Record<string, T>;

  const parts = toRecord(readJson<Record<string, Part>>('parts.json'));
  const assemblies = toRecord(readJson<Record<string, Assembly>>('assemblies.json'));
  const changes = toRecord(readJson<Record<string, Change>>('changes.json'));
  const mbomMappings = toRecord(readJson<Record<string, MBOMMapping>>('mbom_mappings.json'));
  const productionOrders = toRecord(
    readJson<Record<string, ProductionOrder>>('production_orders.json')
  );
  const inventory = toRecord(readJson<Record<string, InventoryRecord>>('inventory.json'));
  const closureTrackers = toRecord(
    readJson<Record<string, ChangeClosureTracker>>('closure_trackers.json')
  );
  const relationships = readJson<Relationship[]>('relationships.json');

  return {
    PARTS: parts,
    ASSEMBLIES: assemblies,
    CHANGES: changes,
    MBOM_MAPPINGS: mbomMappings,
    PRODUCTION_ORDERS: productionOrders,
    INVENTORY: inventory,
    CLOSURE_TRACKERS: closureTrackers,
    RELATIONSHIPS: relationships,
  };
}

type DataShape = {
  PARTS: Record<string, Part>;
  ASSEMBLIES: Record<string, Assembly>;
  CHANGES: Record<string, Change>;
  MBOM_MAPPINGS: Record<string, MBOMMapping>;
  PRODUCTION_ORDERS: Record<string, ProductionOrder>;
  INVENTORY: Record<string, InventoryRecord>;
  CLOSURE_TRACKERS: Record<string, ChangeClosureTracker>;
  RELATIONSHIPS: Relationship[];
};

const data: DataShape = USE_STATIC
  ? loadStaticData()
  : (require('../mock/data') as DataShape);

export const PARTS = data.PARTS;
export const ASSEMBLIES = data.ASSEMBLIES;
export const CHANGES = data.CHANGES;
export const MBOM_MAPPINGS = data.MBOM_MAPPINGS;
export const PRODUCTION_ORDERS = data.PRODUCTION_ORDERS;
export const INVENTORY = data.INVENTORY;
export const CLOSURE_TRACKERS = data.CLOSURE_TRACKERS;
export const RELATIONSHIPS = data.RELATIONSHIPS;
