function Card({ children, className = "" }) {
  return <div className={`rounded border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export default Card;
