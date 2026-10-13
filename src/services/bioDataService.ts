/**
 * BioScience Data Service
 * Provides live querying against UniProtKB, PubChem, and RCSB PDB,
 * with in-memory caching and preloaded scientific datasets.
 */

export interface UniProtRecord {
  primaryAccession: string;
  uniProtkbId: string;
  proteinDescription?: {
    recommendedName?: {
      fullName?: { value: string };
    };
  };
  organism?: {
    scientificName?: string;
    commonName?: string;
  };
  sequence?: {
    value: string;
    length: number;
    molWeight: number;
  };
  comments?: Array<{
    commentType: string;
    texts?: Array<{ value: string }>;
  }>;
}

export interface PubChemRecord {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSMILES: string;
  xlogp?: number;
  iupacName?: string;
}

export interface PdbRecord {
  pdbId: string;
  title: string;
  resolution?: number;
  experimentalMethod?: string;
  releaseDate?: string;
  organism?: string;
}

// In-memory cache for fast spreadsheet cell evaluations
const uniprotCache = new Map<string, UniProtRecord>();
const pubchemCache = new Map<string, PubChemRecord>();
const pdbCache = new Map<string, PdbRecord>();

/**
 * Fetches UniProt protein metadata
 */
export async function fetchUniProt(accession: string): Promise<UniProtRecord | null> {
  const acc = accession.trim().toUpperCase();
  if (uniprotCache.has(acc)) {
    return uniprotCache.get(acc)!;
  }

  try {
    const res = await fetch(`https://rest.uniprot.org/uniprotkb/${encodeURIComponent(acc)}.json`);
    if (!res.ok) return null;
    const data: UniProtRecord = await res.json();
    uniprotCache.set(acc, data);
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetches PubChem compound metadata by name or CID
 */
export async function fetchPubChem(query: string): Promise<PubChemRecord | null> {
  const q = query.trim();
  if (pubchemCache.has(q.toLowerCase())) {
    return pubchemCache.get(q.toLowerCase())!;
  }

  try {
    const isCid = /^\d+$/.test(q);
    const url = isCid
      ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${q}/property/MolecularWeight,MolecularFormula,CanonicalSMILES,XLogP,IUPACName/JSON`
      : `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/property/MolecularWeight,MolecularFormula,CanonicalSMILES,XLogP,IUPACName/JSON`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const props = json?.PropertyTable?.Properties?.[0];
    if (!props) return null;

    const record: PubChemRecord = {
      cid: props.CID,
      name: q,
      molecularFormula: props.MolecularFormula || '',
      molecularWeight: parseFloat(props.MolecularWeight) || 0,
      canonicalSMILES: props.CanonicalSMILES || '',
      xlogp: props.XLogP !== undefined ? parseFloat(props.XLogP) : undefined,
      iupacName: props.IUPACName || ''
    };

    pubchemCache.set(q.toLowerCase(), record);
    return record;
  } catch {
    return null;
  }
}

/**
 * Fetches RCSB PDB structure metadata
 */
export async function fetchPdb(pdbId: string): Promise<PdbRecord | null> {
  const id = pdbId.trim().toUpperCase();
  if (pdbCache.has(id)) {
    return pdbCache.get(id)!;
  }

  try {
    const res = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();

    const record: PdbRecord = {
      pdbId: id,
      title: json?.struct?.title || 'Unknown structure',
      resolution: json?.rcsb_entry_info?.resolution_combined?.[0] || undefined,
      experimentalMethod: json?.exptl?.[0]?.method || 'X-RAY DIFFRACTION',
      releaseDate: json?.rcsb_accession_info?.initial_release_date?.substring(0, 10) || '',
      organism: json?.rcsb_entry_container_identifiers?.polymer_entity_ids_and_taxonomies?.[0]?.taxonomy_name || 'Homo sapiens'
    };

    pdbCache.set(id, record);
    return record;
  } catch {
    return null;
  }
}

/**
 * Pre-packaged scientific dataset templates ready to inject into sheets
 */
export const BIO_TEMPLATES = {
  genomics: {
    title: 'Oncology_Target_Matrix.xlsx',
    sheetName: 'Cancer_Genomics',
    headers: ['Gene', 'UniProt ID', 'PDB ID', 'Chromosome', 'Log2 Fold Change', 'p-value', 'Pathogenicity', 'Target Classification'],
    rows: [
      ['TP53', 'P04637', '1TUP', '17p13.1', -3.42, 0.0001, 'Pathogenic', 'Tumor Suppressor'],
      ['EGFR', 'P00533', '1M17', '7p11.2', 4.15, 0.00002, 'Oncogenic Driver', 'Receptor Kinase'],
      ['BRCA1', 'P38398', '1JM7', '17q21.31', -2.85, 0.0004, 'Pathogenic (VUS)', 'DNA Repair'],
      ['KRAS', 'P01116', '4OBE', '12p12.1', 3.88, 0.00005, 'Activating G12D', 'Small GTPase'],
      ['PTEN', 'P60484', '1D5R', '10q23.31', -4.10, 0.00001, 'Loss of Function', 'Lipid Phosphatase'],
      ['BRAF', 'P15056', '4MNE', '7q34', 2.94, 0.0008, 'Activating V600E', 'Ser/Thr Kinase'],
      ['PIK3CA', 'P42336', '4JPS', '3q26.32', 3.20, 0.00015, 'Gain of Function', 'Lipid Kinase'],
      ['MYC', 'P01106', '1NKP', '8q24.21', 5.62, 0.000005, 'Amplification', 'Transcription Factor']
    ]
  },
  drugScreen: {
    title: 'Kinase_Inhibitor_Screen.xlsx',
    sheetName: 'Drug_Screen',
    headers: ['Compound Name', 'Formula', 'Mol Weight (g/mol)', 'LogP', 'Target Kinase', 'IC50 (nM)', 'Lipinski Ro5', 'Clinical Phase'],
    rows: [
      ['Imatinib', 'C29H31N7O', 493.60, 3.50, 'BCR-ABL1', 25.4, 'Pass', 'FDA Approved'],
      ['Erlotinib', 'C22H23N3O4', 393.44, 2.70, 'EGFR', 2.0, 'Pass', 'FDA Approved'],
      ['Gefitinib', 'C22H24ClFN4O3', 446.90, 3.20, 'EGFR', 3.3, 'Pass', 'FDA Approved'],
      ['Sunitinib', 'C22H27FN4O2', 398.47, 1.60, 'VEGFR2 / KIT', 4.0, 'Pass', 'FDA Approved'],
      ['Dasatinib', 'C22H26ClN7O2S', 488.01, 2.80, 'BCR-ABL1 / SRC', 0.6, 'Pass', 'FDA Approved'],
      ['Sorafenib', 'C21H16ClF3N4O3', 464.82, 3.80, 'RAF1 / BRAF', 6.0, 'Pass', 'FDA Approved'],
      ['Osimertinib', 'C28H33N7O2', 499.61, 2.90, 'EGFR T790M', 1.2, 'Pass', 'FDA Approved'],
      ['Alectinib', 'C30H34N4O2', 482.62, 4.30, 'ALK', 1.9, 'Pass', 'FDA Approved']
    ]
  },
  clinicalTrial: {
    title: 'Immunotherapy_Cohort_Trials.xlsx',
    sheetName: 'Biomarker_Cohort',
    headers: ['Cohort ID', 'Patients (N)', 'Biomarker Positivity (%)', 'ORR (%)', 'Median PFS (mo)', 'Median OS (mo)', 'Hazard Ratio', 'p-value'],
    rows: [
      ['Cohort-A (High PD-L1)', 120, 85.5, 62.5, 14.2, 28.4, 0.48, 0.0002],
      ['Cohort-B (Low PD-L1)', 115, 22.0, 31.3, 7.8, 16.1, 0.72, 0.0150],
      ['Cohort-C (TMB High)', 98, 76.4, 58.2, 12.6, 25.9, 0.54, 0.0008],
      ['Cohort-D (MSI-High)', 45, 100.0, 71.1, 19.5, 34.0, 0.35, 0.00005],
      ['Cohort-E (Control Standard)', 130, 0.0, 18.5, 5.2, 11.3, 1.00, 1.0000]
    ]
  }
};
