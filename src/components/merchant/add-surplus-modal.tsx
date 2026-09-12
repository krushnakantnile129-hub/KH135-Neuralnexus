"use client";

import React, { useEffect } from 'react';
import { FastCatalogForm } from './fast-catalog-form';
import { PlusCircle, X } from 'lucide-react';

interface AddSurplusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: () => void;
}

export function AddSurplusModal({ isOpen, onClose, onItemAdded }: AddSurplusModalProps) {
  // Keydown event listener for Escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll on mount when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-50 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-6 py-4 border-b border-zinc-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
              <PlusCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 leading-tight">Add Surplus Food Item</h2>
              <p className="text-xs text-zinc-500 font-medium">
                Catalog surplus items with real-time multi-factor clearance price recommendations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors border border-zinc-200"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <FastCatalogForm
            onSuccess={() => {
              if (onItemAdded) {
                onItemAdded();
              }
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
