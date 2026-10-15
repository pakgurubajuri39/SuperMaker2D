import React, { useState } from 'react';
import { WorldData, LevelData, STAGE_COLS, STAGE_ROWS } from '../types';
import { Copy, Download, Upload, Check, AlertCircle, X, Code, FileCode } from 'lucide-react';

interface DataModalProps {
  world: WorldData;
  activeLevel: LevelData;
  isOpen: boolean;
  onClose: () => void;
  onImportWorld: (imported: WorldData) => void;
}

export const DataModal: React.FC<DataModalProps> = ({
  world,
  activeLevel,
  isOpen,
  onClose,
  onImportWorld,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState<boolean>(false);
  const [importJson, setImportJson] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentExportData = JSON.stringify(world, null, 2);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentExportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([currentExportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super_maker_world_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON validation & application
  const handleImportSubmit = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (!importJson.trim()) {
        setErrorMsg('Please enter or paste JSON data.');
        return;
      }
      const parsed = JSON.parse(importJson) as Partial<WorldData>;

      // Validate required keys
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        throw new Error('Invalid World format: missing "nodes" array.');
      }
      if (!parsed.levels || typeof parsed.levels !== 'object') {
        throw new Error('Invalid World format: missing "levels" object.');
      }

      // Validate at least one level
      const levelKeys = Object.keys(parsed.levels);
      if (levelKeys.length === 0) {
        throw new Error('World contains no stages in "levels".');
      }

      const sampleLvl = parsed.levels[levelKeys[0]];
      if (!sampleLvl.grid || !Array.isArray(sampleLvl.grid)) {
        throw new Error('Stage missing valid 2D grid array.');
      }

      // Valid! Import
      onImportWorld(parsed as WorldData);
      setSuccessMsg(`Successfully imported "${parsed.title || 'Custom World'}" with ${levelKeys.length} stage(s)!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to parse JSON.');
      }
    }
  };

  // File upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setImportJson(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Export & Import World Data</h3>
              <p className="text-xs text-slate-400">Port levels, stages, and overworld progression</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setTab('export')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'export'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export World JSON
          </button>
          <button
            onClick={() => setTab('import')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'import'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Import JSON Data
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {tab === 'export' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Formatted JSON representation:</span>
                <span className="font-mono-num">{world.nodes.length} Stages · {STAGE_COLS}x{STAGE_ROWS} Grid</span>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={currentExportData}
                  rows={12}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 resize-none focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 rounded-xl text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-amber-400/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Paste JSON code or upload a file:</span>
                <label className="cursor-pointer text-amber-400 hover:underline flex items-center gap-1 font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .json</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste valid World JSON here..."
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 resize-none focus:outline-none focus:border-amber-400"
              />

              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleImportSubmit}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-amber-400/20"
                >
                  Validate &amp; Load World
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
