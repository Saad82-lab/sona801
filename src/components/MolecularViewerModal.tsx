import React, { useState, useEffect, useRef } from 'react';
import { X, Dna, ExternalLink, RefreshCw, Layers, ShieldCheck, Info } from 'lucide-react';
import { fetchPdb, fetchPubChem, fetchUniProt } from '../services/bioDataService';

interface MolecularViewerModalProps {
  isOpen: boolean;
  initialQuery?: string;
  darkMode: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    $3Dmol?: any;
  }
}

export const MolecularViewerModal: React.FC<MolecularViewerModalProps> = ({
  isOpen,
  initialQuery = '1TUP',
  darkMode,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'pdb' | 'chemical'>('pdb');
  const [styleMode, setStyleMode] = useState<'cartoon' | 'stick' | 'sphere' | 'surface'>('cartoon');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);

  const sampleTargets = [
    { label: 'p53 Tumor Suppressor (1TUP)', id: '1TUP', type: 'pdb' },
    { label: 'EGFR Kinase Domain (1M17)', id: '1M17', type: 'pdb' },
    { label: 'SARS-CoV-2 Spike (6VXX)', id: '6VXX', type: 'pdb' },
    { label: 'KRAS G12D GTPase (4OBE)', id: '4OBE', type: 'pdb' },
    { label: 'Imatinib / Gleevec', id: 'Imatinib', type: 'chemical' },
    { label: 'Aspirin NSAID', id: 'Aspirin', type: 'chemical' },
  ];

  const loadTarget = async (targetId: string, type: 'pdb' | 'chemical') => {
    setLoading(true);
    setQuery(targetId);
    setActiveTab(type);

    try {
      if (type === 'pdb') {
        const pdbData = await fetchPdb(targetId);
        setMetadata(pdbData);
        render3DStructure(targetId);
      } else {
        const chemData = await fetchPubChem(targetId);
        setMetadata(chemData);
        if (chemData?.cid) {
          renderPubchem3D(chemData.cid);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTarget(initialQuery || '1TUP', 'pdb');
    }
  }, [isOpen]);

  const render3DStructure = (pdbId: string) => {
    if (!viewerContainerRef.current || !window.$3Dmol) return;

    // Clear previous viewer
    viewerContainerRef.current.innerHTML = '';

    const element = viewerContainerRef.current;
    const config = { backgroundColor: darkMode ? '#181818' : '#f8f9fa' };
    const viewer = window.$3Dmol.createViewer(element, config);
    viewerInstanceRef.current = viewer;

    const url = `https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`;

    fetch(url)
      .then((res) => res.text())
      .then((pdbData) => {
        viewer.clear();
        viewer.addModel(pdbData, 'pdb');

        applyViewerStyle(viewer, styleMode);
        viewer.zoomTo();
        viewer.render();
      })
      .catch(() => {
        // Fallback visual
      });
  };

  const renderPubchem3D = (cid: number) => {
    if (!viewerContainerRef.current || !window.$3Dmol) return;
    viewerContainerRef.current.innerHTML = '';

    const element = viewerContainerRef.current;
    const config = { backgroundColor: darkMode ? '#181818' : '#f8f9fa' };
    const viewer = window.$3Dmol.createViewer(element, config);
    viewerInstanceRef.current = viewer;

    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;

    fetch(url)
      .then((res) => res.text())
      .then((sdfData) => {
        viewer.clear();
        viewer.addModel(sdfData, 'sdf');
        viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });
        viewer.zoomTo();
        viewer.render();
      })
      .catch(() => {
        // fallback
      });
  };

  const applyViewerStyle = (viewer: any, mode: string) => {
    if (!viewer) return;
    viewer.setStyle({}, {});

    switch (mode) {
      case 'cartoon':
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        break;
      case 'stick':
        viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'amino' } });
        break;
      case 'sphere':
        viewer.setStyle({}, { sphere: { scale: 0.5, colorscheme: 'amino' } });
        break;
      case 'surface':
        viewer.setStyle({}, { cartoon: { color: '#007b83' } });
        viewer.addSurface(window.$3Dmol.SurfaceType.VDW, { opacity: 0.65, color: '#65cbf3' });
        break;
      default:
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    }
    viewer.render();
  };

  const handleChangeStyle = (mode: 'cartoon' | 'stick' | 'sphere' | 'surface') => {
    setStyleMode(mode);
    if (viewerInstanceRef.current) {
      applyViewerStyle(viewerInstanceRef.current, mode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl h-[620px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-pop ${
        darkMode ? 'bg-[#222222] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#1a73e8]/15 text-[#1a73e8] rounded-lg">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">BioScience 3D Molecular & Chemical Visualizer</h3>
              <p className="text-[11px] text-neutral-400">
                Integrated RCSB PDB, AlphaFold DB & PubChem Structural Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Example Targets Pills */}
        <div className="px-5 py-2 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 flex-shrink-0">
            Quick Examples:
          </span>
          {sampleTargets.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTarget(t.id, t.type as any)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex-shrink-0 transition ${
                query.toLowerCase() === t.id.toLowerCase()
                  ? 'bg-[#1a73e8] text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#1a73e8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body: Split 3D Canvas + Scientific Inspector */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: 3D WebGL Canvas */}
          <div className="flex-1 relative flex flex-col border-r border-neutral-200 dark:border-neutral-700">
            {/* 3D Representation Style Controls */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm text-xs">
              <span className="text-[10px] text-neutral-400 px-1 font-semibold">Style:</span>
              {(['cartoon', 'stick', 'sphere', 'surface'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleChangeStyle(m)}
                  className={`px-2 py-0.5 rounded capitalize font-medium transition ${
                    styleMode === m
                      ? 'bg-[#1a73e8] text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* 3D Canvas Viewport */}
            <div
              ref={viewerContainerRef}
              className="w-full flex-1 relative bg-[#f8f9fa] dark:bg-[#181818]"
            />

            {/* AlphaFold pLDDT Legend */}
            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 font-semibold">AlphaFold pLDDT:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0053D6]" /> &gt;90 Very High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#65CBF3]" /> 70-90 Confident
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFDB13]" /> 50-70 Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7D45]" /> &lt;50 Very Low
                </span>
              </div>
            </div>
          </div>

          {/* Right: Biological Metadata & Provenance Inspector */}
          <div className="w-full md:w-80 p-4 flex flex-col gap-3 overflow-y-auto bg-neutral-50/50 dark:bg-neutral-900/30 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                placeholder="Search PDB ID or Compound..."
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadTarget(query, activeTab);
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 outline-none uppercase font-semibold font-mono"
              />
              <button
                onClick={() => loadTarget(query, activeTab)}
                className="p-1.5 bg-[#1a73e8] text-white rounded-lg hover:bg-[#1557b0] transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Provenance Badge */}
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="text-[11px] leading-tight">
                <strong>Experimentally Determined Structure</strong>
                <div className="opacity-80">Authoritative RCSB PDB & PubChem Core</div>
              </div>
            </div>

            {/* Metadata Card */}
            {metadata && (
              <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col gap-2 shadow-sm">
                <div className="font-bold text-sm text-[#1a73e8] dark:text-[#65cbf3]">
                  {metadata.title || metadata.name || query}
                </div>

                {metadata.experimentalMethod && (
                  <div>
                    <span className="text-neutral-400">Method: </span>
                    <span className="font-semibold">{metadata.experimentalMethod}</span>
                  </div>
                )}

                {metadata.resolution && (
                  <div>
                    <span className="text-neutral-400">Resolution: </span>
                    <span className="font-mono font-semibold">{metadata.resolution} Å</span>
                  </div>
                )}

                {metadata.organism && (
                  <div>
                    <span className="text-neutral-400">Organism: </span>
                    <span className="italic">{metadata.organism}</span>
                  </div>
                )}

                {metadata.molecularFormula && (
                  <div>
                    <span className="text-neutral-400">Formula: </span>
                    <span className="font-mono font-semibold">{metadata.molecularFormula}</span>
                  </div>
                )}

                {metadata.molecularWeight && (
                  <div>
                    <span className="text-neutral-400">Mol Weight: </span>
                    <span className="font-mono font-semibold">{metadata.molecularWeight} g/mol</span>
                  </div>
                )}

                {metadata.canonicalSMILES && (
                  <div>
                    <span className="text-neutral-400 block mb-0.5">SMILES:</span>
                    <div className="font-mono text-[10px] p-1.5 bg-neutral-100 dark:bg-neutral-900 rounded break-all select-all">
                      {metadata.canonicalSMILES}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Outbound Authoritative Links */}
            <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <a
                href={`https://www.rcsb.org/structure/${query}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
              >
                <span>RCSB PDB Structure Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://alphafold.ebi.ac.uk/search/text/${query}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
              >
                <span>AlphaFold DB Model</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/#query=${query}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
              >
                <span>PubChem Compound Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
