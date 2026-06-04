function LoadingState({ label = "Loading" }) {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center rounded-3xl border-0 bg-white/70 p-8 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-4 text-base font-medium tracking-tight text-[#86868b]">
        <span className="size-8 animate-spin rounded-full border-[3px] border-[#0066B3]/20 border-t-[#0066B3]" />
        {label}
      </div>
    </div>
  );
}

export default LoadingState;
