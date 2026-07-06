import { forwardRef } from "react";

const TextField = forwardRef(
  ({ label, error, className = "", ...rest }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-ink-900 mb-1.5">{label}</label>
        <input
          ref={ref}
          className={`w-full rounded-md border px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition
            focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500
            ${error ? "border-red-400" : "border-gray-300"} ${className}`}
          {...rest}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

TextField.displayName = "TextField";
export default TextField;