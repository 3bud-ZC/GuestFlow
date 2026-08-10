"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function Drawer({
  trigger,
  title,
  children,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpenState, setIsOpenState] = useState(false);
  const isOpen = open !== undefined ? open : isOpenState;

  const handleOpen = () => {
    setIsOpenState(true);
    if (onOpenChange) onOpenChange(true);
  };

  const handleClose = () => {
    setIsOpenState(false);
    if (onOpenChange) onOpenChange(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {trigger && (
        <div onClick={handleOpen} className="inline-block">
          {trigger}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
