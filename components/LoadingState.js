export default function LoadingState({ label = "Loading RedChain..." }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <div>{label}</div>
    </div>
  );
}
