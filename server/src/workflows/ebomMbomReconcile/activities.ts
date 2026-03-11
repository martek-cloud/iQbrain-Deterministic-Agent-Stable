import { ASSEMBLIES, MBOM_MAPPINGS, RELATIONSHIPS } from '../../adapters/data';
import type { BOMNode } from '../../types/canonical';
import type { ReconcileLine, ReconcileCategory } from '../../types/intents';

export function fetchEBOM(assemblyId: string): BOMNode[] | null {
  const assembly = ASSEMBLIES[assemblyId.toUpperCase()];
  return assembly ? assembly.ebom : null;
}

export function fetchMBOM(assemblyId: string): BOMNode[] | null {
  const mbom = Object.values(MBOM_MAPPINGS).find((m) => m.assemblyId === assemblyId.toUpperCase());
  return mbom ? mbom.lines : null;
}

export function hasApprovedSubstitute(partNumber: string): boolean {
  const canonicalId = `iqb:part:${partNumber.toLowerCase()}`;
  return RELATIONSHIPS.some(
    (r) => r.fromId === canonicalId && r.type === 'APPROVED_SUBSTITUTE'
  );
}

export function reconcile(
  _assemblyId: string,
  ebom: BOMNode[],
  mbom: BOMNode[]
): ReconcileLine[] {
  const lines: ReconcileLine[] = [];
  const mbomMap = new Map(mbom.map((b) => [b.partNumber.toUpperCase(), b]));
  const ebomMap = new Map(ebom.map((b) => [b.partNumber.toUpperCase(), b]));

  // Check each EBOM line against MBOM
  for (const ebomLine of ebom) {
    const key = ebomLine.partNumber.toUpperCase();
    const mbomLine = mbomMap.get(key);

    if (!mbomLine) {
      lines.push({
        partNumber: ebomLine.partNumber,
        partName: ebomLine.partNumber,
        ebomQty: ebomLine.quantity,
        mbomQty: undefined,
        category: 'MISSING_FROM_MBOM',
        explanation: 'Part present in EBOM but absent from MBOM with no approved substitute',
      });
      continue;
    }

    if (ebomLine.bomRevision && mbomLine.bomRevision && ebomLine.bomRevision !== mbomLine.bomRevision) {
      lines.push({
        partNumber: ebomLine.partNumber,
        partName: ebomLine.partNumber,
        ebomQty: ebomLine.quantity,
        mbomQty: mbomLine.quantity,
        ebomRevision: ebomLine.bomRevision,
        mbomRevision: mbomLine.bomRevision,
        category: 'REVISION_MISMATCH',
      });
      continue;
    }

    if (ebomLine.quantity !== mbomLine.quantity) {
      const scrapFactor = mbomLine.scrapFactor ?? ebomLine.scrapFactor ?? 0;
      // A positive scrapFactor is metadata proof that over-ordering is planned — classify as EXPECTED
      const isExpected = scrapFactor > 0 && mbomLine.quantity > ebomLine.quantity;
      const category: ReconcileCategory = isExpected ? 'QTY_MISMATCH_EXPECTED' : 'QTY_MISMATCH_UNEXPECTED';
      lines.push({
        partNumber: ebomLine.partNumber,
        partName: ebomLine.partNumber,
        ebomQty: ebomLine.quantity,
        mbomQty: mbomLine.quantity,
        category,
        explanation: isExpected
          ? `scrapFactor: ${scrapFactor} accounts for +${mbomLine.quantity - ebomLine.quantity} quantity`
          : `Quantity mismatch: EBOM=${ebomLine.quantity}, MBOM=${mbomLine.quantity}, no scrap factor`,
      });
      continue;
    }

    lines.push({
      partNumber: ebomLine.partNumber,
      partName: ebomLine.partNumber,
      ebomQty: ebomLine.quantity,
      mbomQty: mbomLine.quantity,
      category: 'ALIGNED',
    });
  }

  // Check MBOM-only lines
  for (const mbomLine of mbom) {
    const key = mbomLine.partNumber.toUpperCase();
    if (!ebomMap.has(key)) {
      const isApprovedSub = hasApprovedSubstitute(mbomLine.partNumber);
      lines.push({
        partNumber: mbomLine.partNumber,
        partName: mbomLine.partNumber,
        ebomQty: undefined,
        mbomQty: mbomLine.quantity,
        category: isApprovedSub ? 'MBOM_ONLY_EXPECTED' : 'MBOM_ONLY_UNEXPECTED',
        explanation: isApprovedSub
          ? 'Approved substitute relationship found'
          : 'No approved substitute relationship found',
      });
    }
  }

  return lines;
}
