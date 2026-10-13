/**
 * BioScience and Bioinformatics calculations for BioCalc 11
 * Integrated according to the Science Skill
 */

// Standard genetic codon table (DNA to Single-Letter Amino Acid)
const CODON_TABLE: Record<string, string> = {
  'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
  'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
  'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
  'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
  'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
  'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
  'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
  'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};

// Monoisotopic & average amino acid residue weights (Da - H2O loss)
const AA_WEIGHTS: Record<string, number> = {
  'A': 71.08, 'R': 156.20, 'N': 114.11, 'D': 115.09, 'C': 103.14,
  'E': 129.12, 'Q': 128.13, 'G': 57.05, 'H': 137.14, 'I': 113.17,
  'L': 113.17, 'K': 128.18, 'M': 131.21, 'F': 147.18, 'P': 97.12,
  'S': 87.08, 'T': 101.11, 'W': 186.21, 'Y': 163.18, 'V': 99.13
};

// DNA nucleotide base molecular weights (monophosphate dNMP average Da)
const NT_WEIGHTS: Record<string, number> = {
  'A': 313.21,
  'T': 304.20,
  'G': 329.21,
  'C': 289.18
};

/**
 * Calculates GC% content of a nucleotide sequence (DNA/RNA)
 */
export function calculateGCContent(sequence: string): number {
  if (!sequence || typeof sequence !== 'string') return 0;
  const clean = sequence.toUpperCase().replace(/[^ATGCU]/g, '');
  if (!clean.length) return 0;
  let gcCount = 0;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === 'G' || clean[i] === 'C') gcCount++;
  }
  return parseFloat(((gcCount / clean.length) * 100).toFixed(2));
}

/**
 * Generates reverse complement for a DNA sequence
 */
export function reverseComplement(sequence: string): string {
  if (!sequence || typeof sequence !== 'string') return '';
  const clean = sequence.toUpperCase();
  const compMap: Record<string, string> = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'U': 'A', 'N': 'N'
  };
  return clean
    .split('')
    .reverse()
    .map(c => compMap[c] || c)
    .join('');
}

/**
 * Translates DNA/RNA sequence to protein amino acid string
 */
export function translateDNA(sequence: string): string {
  if (!sequence || typeof sequence !== 'string') return '';
  const dna = sequence.toUpperCase().replace(/U/g, 'T').replace(/[^ATGC]/g, '');
  let protein = '';
  for (let i = 0; i + 2 < dna.length; i += 3) {
    const codon = dna.substring(i, i + 3);
    protein += CODON_TABLE[codon] || '?';
  }
  return protein;
}

/**
 * Computes estimated molecular weight in Daltons
 */
export function calculateMolecularWeight(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  const str = input.toUpperCase().trim();

  // If looks like DNA (A, T, G, C only)
  if (/^[ATGC]+$/.test(str) && str.length > 6) {
    let mw = 0;
    for (const char of str) {
      mw += NT_WEIGHTS[char] || 310;
    }
    return parseFloat((mw + 61.96).toFixed(2)); // add terminal water & phosphates
  }

  // Peptide / Protein
  let peptideMw = 0;
  for (const char of str) {
    if (AA_WEIGHTS[char]) {
      peptideMw += AA_WEIGHTS[char];
    }
  }
  if (peptideMw > 0) {
    return parseFloat((peptideMw + 18.015).toFixed(2)); // add H2O for N/C-terminus
  }

  return 0;
}

/**
 * Curated knowledge base for instant offline spreadsheet formulas
 */
export const BIO_KNOWLEDGE_BASE: Record<string, {
  name: string;
  gene?: string;
  uniprot?: string;
  pdb?: string;
  organism?: string;
  length?: number;
  mw?: string;
  formula?: string;
  smiles?: string;
  functionDesc?: string;
  logP?: number;
  ic50?: string;
}> = {
  'TP53': {
    name: 'Cellular tumor antigen p53',
    gene: 'TP53',
    uniprot: 'P04637',
    pdb: '1TUP',
    organism: 'Homo sapiens',
    length: 393,
    mw: '43.7 kDa',
    functionDesc: 'Master tumor suppressor; regulates cell cycle arrest, apoptosis, and DNA repair.'
  },
  'P04637': {
    name: 'Cellular tumor antigen p53',
    gene: 'TP53',
    uniprot: 'P04637',
    pdb: '1TUP',
    organism: 'Homo sapiens',
    length: 393,
    mw: '43.7 kDa',
    functionDesc: 'Master tumor suppressor.'
  },
  'EGFR': {
    name: 'Epidermal growth factor receptor',
    gene: 'EGFR',
    uniprot: 'P00533',
    pdb: '1M17',
    organism: 'Homo sapiens',
    length: 1210,
    mw: '134.3 kDa',
    functionDesc: 'Receptor tyrosine kinase binding EGF; involved in proliferation and survival.'
  },
  'P00533': {
    name: 'Epidermal growth factor receptor',
    gene: 'EGFR',
    uniprot: 'P00533',
    pdb: '1M17',
    organism: 'Homo sapiens',
    length: 1210,
    mw: '134.3 kDa',
    functionDesc: 'Receptor tyrosine kinase.'
  },
  'BRCA1': {
    name: 'Breast cancer type 1 susceptibility protein',
    gene: 'BRCA1',
    uniprot: 'P38398',
    pdb: '1JM7',
    organism: 'Homo sapiens',
    length: 1863,
    mw: '207.7 kDa',
    functionDesc: 'E3 ubiquitin-protein ligase involved in DNA double-strand break repair via homologous recombination.'
  },
  'KRAS': {
    name: 'GTPase KRas',
    gene: 'KRAS',
    uniprot: 'P01116',
    pdb: '4OBE',
    organism: 'Homo sapiens',
    length: 188,
    mw: '21.6 kDa',
    functionDesc: 'Ras family small GTPase; acts as an on/off molecular switch in MAPK signaling.'
  },
  'INSULIN': {
    name: 'Insulin',
    gene: 'INS',
    uniprot: 'P01308',
    pdb: '4INS',
    organism: 'Homo sapiens',
    length: 110,
    mw: '5.8 kDa',
    functionDesc: 'Key metabolic hormone regulating blood glucose homeostasis.'
  },
  'IMATINIB': {
    name: 'Imatinib (Gleevec)',
    formula: 'C29H31N7O',
    mw: '493.6 g/mol',
    smiles: 'Cc1ccc(cc1Nc2nccc(n2)c3cccnc3)NC(=O)c4ccc(cc4)CN5CCN(CC5)C',
    logP: 3.5,
    ic50: '0.6 uM (BCR-ABL)',
    functionDesc: 'First-line tyrosine kinase inhibitor targeting BCR-ABL, KIT, and PDGFR.'
  },
  'ASPIRIN': {
    name: 'Acetylsalicylic acid',
    formula: 'C9H8O4',
    mw: '180.16 g/mol',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    logP: 1.19,
    ic50: '1.67 uM (COX-1)',
    functionDesc: 'Nonsteroidal anti-inflammatory drug (NSAID) and irreversible COX inhibitor.'
  },
  'METFORMIN': {
    name: 'Metformin',
    formula: 'C4H11N5',
    mw: '129.16 g/mol',
    smiles: 'CN(C)C(=N)NC(=N)N',
    logP: -1.43,
    ic50: 'AMPK activator',
    functionDesc: 'Biguanide antihyperglycemic agent; first-line medication for type 2 diabetes.'
  },
  'REMDESIVIR': {
    name: 'Remdesivir (Veklury)',
    formula: 'C27H35N6O8P',
    mw: '602.58 g/mol',
    smiles: 'CCC(CC)COC(=O)C(C)NP(=O)(OCC1C(C(C(O1)(C#N)c2ccc3c(n2)ncn3)O)O)Oc4ccccc4',
    logP: 1.9,
    ic50: '0.77 uM (RdRp)',
    functionDesc: 'Broad-spectrum antiviral nucleotide analog prodrug targeting RNA-dependent RNA polymerase.'
  }
};
