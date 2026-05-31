function Button({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
