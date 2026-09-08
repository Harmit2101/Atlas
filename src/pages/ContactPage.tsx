import React, { useState } from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Check, Compass } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    territory: 'Dubai',
    inquiryType: 'Acquisition Search',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
          DISCREET CORRESPONDENCE
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec]">
          Private Advisory & Concierge
        </h1>
        <p className="text-xs sm:text-sm text-[#8e8d93] leading-relaxed">
          For family offices, sovereign principals, and private clients seeking bespoke acquisition advisory or confidential off-market dispositions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Contact Form */}
        <div className="lg:col-span-7 bg-[#111116] border border-white/[0.08] p-8 rounded-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#c5a880] text-[#08080a] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-3xl text-[#f4f2ec]">Inquiry Dossier Prepared</h3>
              <p className="text-xs text-[#8e8d93] max-w-md mx-auto leading-relaxed">
                Your acquisition inquiry parameters have been validated. To maintain confidential end-to-end encryption without third-party form storage, please dispatch directly to our advisory desk.
              </p>
              <div className="pt-2">
                <a
                  href={`mailto:advisory@hmcoding.com?subject=${encodeURIComponent(`[ATLAS ADVISORY] ${formData.inquiryType} - ${formData.territory}`)}&body=${encodeURIComponent(`Principal: ${formData.name}\nOffice: ${formData.title}\nContact: ${formData.phone}\nTerritory: ${formData.territory}\n\nRequirements:\n${formData.message}`)}`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-sm bg-[#c5a880] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold hover:bg-[#e2c295] transition-colors"
                >
                  <span>Dispatch Secure Email (advisory@hmcoding.com)</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                    Principal / Representative Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Full legal name or representative..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                    Affiliation / Office
                  </label>
                  <input
                    type="text"
                    placeholder="Family Office / Trustee / Self"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                    Confidential Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="contact@entity.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                    Telephone / Secure Messaging
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (000) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                    Primary Territory of Interest
                  </label>
                  <select
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                  >
                    <option value="Dubai">Dubai & Middle East</option>
                    <option value="London">London & United Kingdom</option>
                    <option value="New York">New York City & Hamptons</option>
                    <option value="Amalfi Coast">Italian Riviera & Amalfi</option>
                    <option value="Swiss Alps">Switzerland & Alpine Regions</option>
                    <option value="Tokyo">Tokyo & Kyoto</option>
                    <option value="Singapore">Singapore & Southeast Asia</option>
                    <option value="Multi">Global Multi-Territory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                    Nature of Inquiry
                  </label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                  >
                    <option value="Acquisition Search">Private Acquisition Search</option>
                    <option value="Off-Market Disposition">Off-Market Property Representation</option>
                    <option value="Portfolio Assessment">Family Office Real Estate Audit</option>
                    <option value="Architectural Commission">Architectural Commission Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                  Specific Requirements or Parameters
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail preferred asset classes, budget scope, residency objectives, or architectural preferences..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 text-[#f4f2ec] focus:border-[#c5a880] outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-colors shadow-lg"
                >
                  TRANSMIT CONFIDENTIAL INQUIRY
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-mono-luxury text-[#8e8d93]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Encrypted Transmission · Non-Disclosure Agreement Governed</span>
              </div>
            </form>
          )}
        </div>

        {/* Right Advisory Centers */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#c5a880]">
              GLOBAL PRESENCE
            </span>
            <h2 className="font-editorial text-3xl text-[#f4f2ec]">Advisory Hubs</h2>
            <p className="text-xs text-[#8e8d93] leading-relaxed">
              ATLAS operates discreet representation through key wealth centers across four continents.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-sm bg-[#111116] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono-luxury uppercase text-[#c5a880]">London Desk</div>
              <div className="text-sm font-editorial text-[#f4f2ec]">Mayfair & St. James’s</div>
              <div className="text-[11px] text-[#8e8d93]">Berkeley Square, Mayfair, London W1J 6BD</div>
            </div>

            <div className="p-4 rounded-sm bg-[#111116] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono-luxury uppercase text-[#c5a880]">Dubai Desk</div>
              <div className="text-sm font-editorial text-[#f4f2ec]">DIFC Financial District</div>
              <div className="text-[11px] text-[#8e8d93]">Gate Precinct 4, DIFC, Dubai, UAE</div>
            </div>

            <div className="p-4 rounded-sm bg-[#111116] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono-luxury uppercase text-[#c5a880]">New York Desk</div>
              <div className="text-sm font-editorial text-[#f4f2ec]">Manhattan Midtown</div>
              <div className="text-[11px] text-[#8e8d93]">Plaza District, Fifth Avenue, NY 10019</div>
            </div>

            <div className="p-4 rounded-sm bg-[#111116] border border-white/[0.06] space-y-1">
              <div className="text-xs font-mono-luxury uppercase text-[#c5a880]">Singapore Desk</div>
              <div className="text-sm font-editorial text-[#f4f2ec]">Marina Bay Financial Centre</div>
              <div className="text-[11px] text-[#8e8d93]">Tower 2, Marina Boulevard, Singapore 018983</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
