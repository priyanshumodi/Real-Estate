import SkylineSignature from "../brand/SkylineSignature";

const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex bg-paper">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-navy-900">
        <div className="absolute inset-0">
          <SkylineSignature />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="text-white font-display text-xl tracking-wide">Estately</div>
          <div className="text-white/90 max-w-xs">
            <p className="font-display text-3xl leading-snug mb-3">
              Every lead, listing, and deal — in one ledger.
            </p>
            <p className="text-sm text-white/60">
              Built for agencies running real inventory, real installments, and real
              follow-ups — not another spreadsheet.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold tracking-wider text-gold-600 uppercase mb-2">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl text-ink-900 mb-1.5">{title}</h1>
          <p className="text-sm text-ink-600 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;