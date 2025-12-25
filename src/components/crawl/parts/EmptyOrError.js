import React from 'react';

export default function EmptyOrError({ state }) {
  return (
    <div className="info-card">
      <div className="card-header"><div className="card-title">Crawl</div></div>
      {state==='loading' && <p className="muted">Laddar…</p>}
      {state==='error'   && <p className="muted">Ett fel uppstod. <button onClick={()=>location.reload()}>Försök igen</button></p>}
      {state==='empty'   && <p className="muted">Crawl-data saknas eller är tom.</p>}
      {!state && <p className="muted">Inte analyserad ännu.</p>}
    </div>
  );
}