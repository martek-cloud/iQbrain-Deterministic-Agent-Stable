import type { IPLMAdapter, IERPAdapter, IMESAdapter } from './interfaces';
import { MockPLMAdapter } from './mock/plm';
import { MockERPAdapter } from './mock/erp';
import { MockMESAdapter } from './mock/mes';

// Singleton instances — created once per process
let plm: IPLMAdapter | null = null;
let erp: IERPAdapter | null = null;
let mes: IMESAdapter | null = null;

function createPLM(): IPLMAdapter {
  const adapterType = process.env.PLM_ADAPTER ?? 'mock';
  switch (adapterType) {
    case 'mock':
      return new MockPLMAdapter();
    default:
      console.warn(`[toolRouter] Unknown PLM_ADAPTER "${adapterType}", falling back to mock`);
      return new MockPLMAdapter();
  }
}

function createERP(): IERPAdapter {
  const adapterType = process.env.ERP_ADAPTER ?? 'mock';
  switch (adapterType) {
    case 'mock':
      return new MockERPAdapter();
    default:
      console.warn(`[toolRouter] Unknown ERP_ADAPTER "${adapterType}", falling back to mock`);
      return new MockERPAdapter();
  }
}

function createMES(): IMESAdapter {
  const adapterType = process.env.MES_ADAPTER ?? 'mock';
  switch (adapterType) {
    case 'mock':
      return new MockMESAdapter();
    default:
      console.warn(`[toolRouter] Unknown MES_ADAPTER "${adapterType}", falling back to mock`);
      return new MockMESAdapter();
  }
}

export const toolRouter = {
  getPLM(): IPLMAdapter {
    if (!plm) plm = createPLM();
    return plm;
  },
  getERP(): IERPAdapter {
    if (!erp) erp = createERP();
    return erp;
  },
  getMES(): IMESAdapter {
    if (!mes) mes = createMES();
    return mes;
  },
  reset(): void {
    plm = null;
    erp = null;
    mes = null;
  },
};
