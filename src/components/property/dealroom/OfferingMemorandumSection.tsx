import React, { useState, useEffect } from 'react';
import { AtlasProperty } from '@/types/property';
import { 
  Lock, Unlock, FileText, ShieldAlert, CheckCircle2, 
  Building2, Users, Download, ArrowRight, X, FileSpreadsheet 
} from 'lucide-react';
import { recordEngagement } from '@/services/commercialService';

interface OfferingMemorandumSectionProps {
  property: AtlasProperty;
  isOpenModalRequested?: boolean;
  onCloseModalRequest?: () => void;
}

export const OfferingMemorandumSection: React.FC<OfferingMemorandumSectionProps> = ({
  property,
  isOpenModalRequested = false,
  onCloseModalRequest
}) => {
  const storageKey = `atlas_nda_unlocked_${property.id}`;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [signerName, setSignerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [investorCategory, setInvestorCategory] = useState<'family_office' | 'private_equity' | 'reit' | 'high_net_worth' | 'commercial_broker'>('family_office');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'true') {
      setIsUnlocked(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isOpenModalRequested && !isUnlocked) {
      setIsModalOpen(true);
    }
  }, [isOpenModalRequested, isUnlocked]);

  const handleSignNDA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || !signerName || !signerEmail) return;

    setSubmitting(true);
    try {
      // Log engagement to Atlas analytics
      await recordEngagement(property.id, 'property_view', {
        action: 'nda_signed',
        signer_name: signerName,
        firm_name: firmName,
        signer_email: signerEmail,
        signer_phone: signerPhone,
        investor_category: investorCategory,
        timestamp: new Date().toISOString()
      });

      // Save local unlock state
      localStorage.setItem(storageKey, 'true');
      setIsUnlocked(true);
      setIsModalOpen(false);
      onCloseModalRequest?.();
    } catch (err) {
      console.warn('Failed to log NDA execution:', err);
      // Still unlock locally for seamless UX
      localStorage.setItem(storageKey, 'true');
      setIsUnlocked(true);
      setIsModalOpen(false);
      onCloseModalRequest?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetLock = () => {
    localStorage.removeItem(storageKey);
    setIsUnlocked(false);
  };

  // Mock Rent Roll Data dynamically derived from property dimensions
  const rentRoll = [
    { tenant: 'Aura Capital Partners', unit: 'Floor 1-4', sqft: Math.round((property.areaSqft || 24000) * 0.35), leaseType: 'NNN', exp: '2031-12', baseRent: '$42,500' },
    { tenant: 'Kensington Global Health', unit: 'Floor 5-8', sqft: Math.round((property.areaSqft || 24000) * 0.30), leaseType: 'NNN', exp: '2029-08', baseRent: '$38,200' },
    { tenant: 'Vanguard Tech Labs', unit: 'Floor 9-11', sqft: Math.round((property.areaSqft || 24000) * 0.20), leaseType: 'Modified Gross', exp: '2028-04', baseRent: '$26,400' },
    { tenant: 'Skyline Penthouse Club', unit: 'Rooftop Lounge', sqft: Math.round((property.areaSqft || 24000) * 0.15), leaseType: 'Percentage + Base', exp: '2034-01', baseRent: '$21,000' },
  ];

  return (
    <div id="deal-room-section" className="space-y-6">
      {/* Section Container */}
      <div className="p-6 sm:p-8 rounded-sm bg-[#111116] border border-white/[0.08] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a880]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              {isUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#c5a880]" />
              )}
              <span>Digital Offering Memorandum & Virtual Deal Room</span>
            </div>
            <h2 className="font-editorial text-2xl text-[#f4f2ec]">
              {isUnlocked ? 'Confidential Asset Dossier (Unlocked)' : 'Institutional Offering Memorandum'}
            </h2>
            <p className="text-xs text-[#8e8d93] font-light">
              {isUnlocked 
                ? 'Authorized Access: Full audited rent roll, lease expirations, and sponsor loan documents.'
                : 'Sensitive underwriting documentation, audited rent rolls, and debt terms are confidential.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isUnlocked ? (
              <button
                type="button"
                onClick={handleResetLock}
                className="px-3 py-1.5 rounded text-[10px] font-mono-luxury uppercase tracking-wider text-[#8e8d93] hover:text-[#f4f2ec] border border-white/10 transition-colors"
              >
                Re-Lock Dossier
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider transition-all shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Execute NDA to Unlock</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Gated vs Unlocked */}
        {!isUnlocked ? (
          /* GATED STATE WITH REDACTED TEASER */
          <div className="pt-6 space-y-6 relative">
            {/* Redacted blurred preview layer */}
            <div className="relative filter blur-[4px] select-none opacity-40 pointer-events-none space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-black/40 border border-white/10">
                <div>
                  <div className="text-[10px] text-[#8e8d93]">Master In-Place NOI</div>
                  <div className="font-mono-luxury text-lg text-[#f4f2ec]">$1,842,000 / yr</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8e8d93]">WALT (Weighted Avg Lease)</div>
                  <div className="font-mono-luxury text-lg text-[#f4f2ec]">6.4 Years</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8e8d93]">Current Physical Occupancy</div>
                  <div className="font-mono-luxury text-lg text-[#f4f2ec]">96.8%</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8e8d93]">Assumable Debt Balance</div>
                  <div className="font-mono-luxury text-lg text-[#f4f2ec]">$6,250,000 (3.85%)</div>
                </div>
              </div>

              <div className="h-32 rounded bg-black/40 border border-white/10 p-4 space-y-2">
                <div className="h-4 bg-white/20 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-3 bg-white/10 rounded w-5/6" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            </div>

            {/* Overlay Banner */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] shadow-lg shadow-[#c5a880]/5">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-editorial text-xl text-[#f4f2ec]">
                  Confidential Offering Memorandum Protected
                </h3>
                <p className="text-xs text-[#8e8d93] font-light">
                  Direct institutional principals and verified buyers may review the complete tenant schedule, operating statements, and environmental survey by signing our electronic Non-Disclosure Agreement.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 rounded bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
              >
                <span>Execute Digital NDA & Enter Deal Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 text-[10px] font-mono-luxury text-[#8e8d93]">
                <ShieldAlert className="w-3 h-3 text-[#c5a880]" />
                <span>Instant 30-Second Access · 24-Month Non-Circumvention</span>
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED DEAL ROOM VIEW */
          <div className="pt-6 space-y-8 animate-fadeIn">
            {/* Top metrics bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-black/40 border border-emerald-500/20">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Audited In-Place NOI</div>
                <div className="font-mono-luxury text-lg font-bold text-emerald-400">
                  ${Math.round(property.price * 0.068 || 840000).toLocaleString()}/yr
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">WALT (Weighted Lease)</div>
                <div className="font-mono-luxury text-lg font-bold text-[#f4f2ec]">6.4 Years</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Physical Occupancy</div>
                <div className="font-mono-luxury text-lg font-bold text-[#f4f2ec]">96.8%</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">Assumable Debt</div>
                <div className="font-mono-luxury text-lg font-bold text-[#c5a880]">Fixed @ 4.15%</div>
              </div>
            </div>

            {/* Master Rent Roll Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-editorial text-lg text-[#f4f2ec]">Audited Master Rent Roll</h3>
                <span className="text-[10px] font-mono-luxury uppercase text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Active Leases
                </span>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded">
                <table className="w-full text-xs font-mono-luxury text-left border-collapse bg-black/20">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8e8d93] bg-white/[0.02]">
                      <th className="py-2.5 px-4 font-normal">Tenant Entity</th>
                      <th className="py-2.5 px-4 font-normal">Premises / Floor</th>
                      <th className="py-2.5 px-4 font-normal">Leased Area</th>
                      <th className="py-2.5 px-4 font-normal">Lease Structure</th>
                      <th className="py-2.5 px-4 font-normal">Expiration</th>
                      <th className="py-2.5 px-4 font-normal text-right">Monthly Rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-[#f4f2ec]">
                    {rentRoll.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#c5a880]">{row.tenant}</td>
                        <td className="py-3 px-4">{row.unit}</td>
                        <td className="py-3 px-4">{row.sqft.toLocaleString()} sq ft</td>
                        <td className="py-3 px-4">{row.leaseType}</td>
                        <td className="py-3 px-4">{row.exp}</td>
                        <td className="py-3 px-4 text-right font-semibold">{row.baseRent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Downloadable Package Assets */}
            <div className="space-y-3 pt-2">
              <h3 className="font-editorial text-lg text-[#f4f2ec]">Confidential Diligence Vault</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="#download-om"
                  onClick={(e) => { e.preventDefault(); alert('Downloading Executive Offering Memorandum (Confidential PDF)...'); }}
                  className="p-3.5 rounded bg-black/40 border border-white/10 hover:border-[#c5a880] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#c5a880]" />
                    <div>
                      <div className="text-xs font-mono-luxury text-[#f4f2ec] group-hover:text-[#c5a880]">
                        Full Offering Memo.pdf
                      </div>
                      <div className="text-[10px] text-[#8e8d93]">48 Pages · Audited Q4</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[#8e8d93] group-hover:text-[#c5a880]" />
                </a>

                <a
                  href="#download-excel"
                  onClick={(e) => { e.preventDefault(); alert('Downloading 10-Year Pro-Forma Underwriting Model (.xlsx)...'); }}
                  className="p-3.5 rounded bg-black/40 border border-white/10 hover:border-[#c5a880] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-mono-luxury text-[#f4f2ec] group-hover:text-[#c5a880]">
                        Underwriting_Model.xlsx
                      </div>
                      <div className="text-[10px] text-[#8e8d93]">Dynamic 10-Yr Cashflow</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[#8e8d93] group-hover:text-[#c5a880]" />
                </a>

                <a
                  href="#download-cad"
                  onClick={(e) => { e.preventDefault(); alert('Downloading Architectural CAD & BIM Floorplates (.dwg)...'); }}
                  className="p-3.5 rounded bg-black/40 border border-white/10 hover:border-[#c5a880] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-sky-400" />
                    <div>
                      <div className="text-xs font-mono-luxury text-[#f4f2ec] group-hover:text-[#c5a880]">
                        BIM_Floorplates.dwg
                      </div>
                      <div className="text-[10px] text-[#8e8d93]">Structural Schematics</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-[#8e8d93] group-hover:text-[#c5a880]" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NDA EXECUTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#111116] border border-white/15 rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                onCloseModalRequest?.();
              }}
              className="absolute top-5 right-5 text-[#8e8d93] hover:text-[#f4f2ec]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CONFIDENTIALITY & NON-CIRCUMVENTION AGREEMENT</span>
              </div>
              <h2 className="font-editorial text-2xl text-[#f4f2ec]">Execute Deal Room NDA</h2>
              <p className="text-xs text-[#8e8d93] font-light">
                Property: <strong className="text-[#f4f2ec]">{property.title}</strong>
              </p>
            </div>

            {/* Legal terms brief */}
            <div className="p-3.5 rounded bg-black/50 border border-white/[0.08] text-[11px] text-[#8e8d93] space-y-2 max-h-36 overflow-y-auto font-light leading-relaxed">
              <p>
                <strong>1. Confidentiality:</strong> The Receiving Party agrees that all financial records, tenant lease agreements, debt notes, and pro-forma projections shared via this Atlas Deal Room are strictly confidential.
              </p>
              <p>
                <strong>2. Non-Circumvention:</strong> The Receiving Party agrees for a period of twenty-four (24) months not to circumvent the listing broker or directly solicit the property owner, master tenants, or lenders.
              </p>
              <p>
                <strong>3. Governing Law:</strong> This electronic execution carries legal validity under the Electronic Signatures in Global and National Commerce Act (ESIGN) and UETA.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignNDA} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">
                    Authorized Signer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Alexander Wright"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-xs text-[#f4f2ec] focus:border-[#c5a880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">
                    Investment Firm / Principal Entity *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Kensington Family Office"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-xs text-[#f4f2ec] focus:border-[#c5a880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">
                    Corporate / Professional Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@kensington-cap.com"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-xs text-[#f4f2ec] focus:border-[#c5a880] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">
                    Direct Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (212) 555-0198"
                    value={signerPhone}
                    onChange={(e) => setSignerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-xs text-[#f4f2ec] focus:border-[#c5a880] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono-luxury uppercase text-[#8e8d93]">
                  Investor Classification
                </label>
                <select
                  value={investorCategory}
                  onChange={(e) => setInvestorCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-xs text-[#f4f2ec] focus:border-[#c5a880] focus:outline-none"
                >
                  <option value="family_office">Single / Multi-Family Office</option>
                  <option value="private_equity">Private Equity Real Estate (PERE)</option>
                  <option value="reit">Institutional REIT / Sovereign Wealth</option>
                  <option value="high_net_worth">Accredited Ultra-High-Net-Worth Principal</option>
                  <option value="commercial_broker">Licensed Commercial Broker (Advisory)</option>
                </select>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 accent-[#c5a880]"
                />
                <span className="text-[11px] text-[#8e8d93] leading-relaxed">
                  I confirm that I am an authorized representative of the entity stated above. I agree to the non-disclosure & non-circumvention terms and consent to digital execution.
                </span>
              </label>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting || !agreedToTerms || !signerName || !signerEmail}
                  className="w-full py-2.5 rounded bg-[#c5a880] hover:bg-[#e2c295] disabled:opacity-50 disabled:cursor-not-allowed text-[#08080a] text-xs font-mono-luxury font-semibold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span>Verifying Electronic Signature...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execute NDA & Access Full Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
