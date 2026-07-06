const Button = ({ loading, variant = "primary", children, className = "", disabled, ...rest }) => {
  const base = "w-full rounded-md py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-navy-900 hover:bg-navy-800 text-white",
    ghost: "bg-transparent hover:bg-gray-100 text-ink-900 border border-gray-200",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
};

export default Button;