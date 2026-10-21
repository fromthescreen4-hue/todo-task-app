import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F6F6F7] p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-4">
          <div className="flex items-center gap-2.5">
            <img src="/core-fit-logo.png" alt="CORE FIT" className="w-8 h-8 object-contain" />
            <span className="font-extrabold uppercase tracking-tight text-sm text-[#15171A]">CORE <span className="text-[#FFAE00]">FIT</span></span>
          </div>
          <a href="#/" className="btn btn-secondary text-xs flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to App</span>
          </a>
        </div>

        <div className="ui-card p-6 sm:p-8 bg-[#FFFFFF] space-y-5">
          <div className="flex items-center gap-2 text-[#15171A]">
            <FileText className="w-5 h-5 text-[#FFAE00]" />
            <h1 className="text-xl font-black text-[#15171A]">Terms of Service & Medical Disclaimer</h1>
          </div>
          <div className="text-[11px] text-[#555B63] font-mono">Effective: October 2026</div>

          <div className="space-y-4 text-xs text-[#555B63] leading-relaxed">
            <section className="space-y-1">
              <h2 className="text-sm font-bold text-[#15171A]">1. Fitness Tracking & Not Medical Advice</h2>
              <p>
                CORE FIT provides mathematical estimations, progressive overload logging tools, and nutritional information sourced from documented repositories (ICMR-NIN). The application does not provide personalized medical diagnoses, prescriptions, or injury rehabilitation protocols. Always consult a qualified medical physician before undertaking strenuous resistance training.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="text-sm font-bold text-[#15171A]">2. User Responsibility & Biomechanical Safety</h2>
              <p>
                Users assume full responsibility for lifting form, load selection, warmup protocols, and equipment inspection. The animated cues and form checklists provided in the Exercise Library are educational references and do not replace certified human coaching or personal discretion.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
