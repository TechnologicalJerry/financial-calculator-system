'use client';

import React from 'react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Document Vault</h1>
        <p className="text-sm text-slate-400">Secure document storage, tax receipt uploads, and folder organization.</p>
      </div>

      <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">Document Vault & Drag-and-Drop Uploader</p>
        <p className="text-xs text-slate-500">Placeholder for folder hierarchy view, file preview modals, and download actions.</p>
      </div>
    </div>
  );
}
