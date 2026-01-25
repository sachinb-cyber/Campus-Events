import { useLocation } from 'react-router-dom';

export default function AuthDebug() {
  const location = useLocation();
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Auth Debug</h2>
      <div className="mb-2">
        <strong>Location.pathname:</strong> {location.pathname}
      </div>
      <div className="mb-2">
        <strong>Location.search:</strong> {location.search}
      </div>
      <div className="mb-2">
        <strong>Location.hash:</strong> {location.hash}</div>
      <p className="mt-4 text-sm text-slate-600">Open this page after your OAuth provider redirects back to inspect query and hash values.</p>
    </div>
  );
}
