import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <div className="flex items-center gap-2 text-[#FFAE00]">
            <Shield className="w-5 h-5" />
            <h1 className="text-xl font-black text-[#15171A]">Privacy Policy & Data Sovereignty</h1>
          </div>
          <div className="text-[11px] text-[#555B63] font-mono">Last Updated: October 2026</div>

          <div className="space-y-4 text-xs text-[#555B63] leading-relaxed">
            <section className="space-y-1">
              <h2 className="text-sm font-bold text-[#15171A]">1. Private Data Storage</h2>
              <p>
                CORE FIT is engineered under strict privacy-first principles. All workout sessions, body weigh-ins, measurements, nutrition logs, and progress photos are stored privately and securely on your device.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="text-sm font-bold text-[#15171A]">2. No Unsolicited Cloud Sync</h2>
              <p>
                We do not sell, scrape, or synchronize your private biometric data with third-party advertising networks. Data export files generated via the Settings menu remain strictly under your control.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="text-sm font-bold text-[#15171A]">3. Data Deletion Guarantee</h2>
              <p>
                You can permanently delete all stored data at any moment by clicking "Wipe All Local Data" in Settings or clearing your browser site data.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
