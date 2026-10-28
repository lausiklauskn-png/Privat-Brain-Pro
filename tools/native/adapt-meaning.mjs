// Pro-Umbau 5 (Klaus 2026-10-28): the app's own search may use a second, larger meaning model (native-meaning.js,
// ProMeaning). The shared index.html stays as it is; the native build adds four narrow hooks:
//  1. ecoOf()/ecoPair(): a query vector from the second model carries `pbMeaning` (record → its own vector of the
//     same model, or null). Then only those vectors are compared — never a 768/1024 vector with a 384 one.
//  2. search() and multiHopSearch() use them instead of reading r.evec directly.
//  3. embedQueryCached() asks native-meaning.js first; it answers only when the second model is loaded, running and
//     every catalogue entry has its vector. Otherwise everything stays on Modul 03 exactly as before.
//  4. renderResults() also asks for a query vector when only the second model is ready.
export function adaptMeaning(source) {
  let html = source;
  function replace(before, after, label) {
    if (html.split(before).length !== 2) throw new Error('Review native meaning adaptation: ' + label);
    html = html.replace(before, after);
  }
  const cosine = 'function cosineE(a,b){ let s=0; const n=Math.min(a.length,b.length); for(let i=0;i<n;i++) s+=a[i]*b[i]; return s; } // 384-dim e5-Vektoren';
  replace(cosine, cosine + '\n'
    + '// Pro-Umbau 5: zweites Bedeutungs-Modell (native-meaning.js). Seine Frage trägt pbMeaning (Eintrag → eigener Vektor oder null).\n'
    + 'function ecoVec(qe, r){ return qe && typeof qe.pbMeaning === "function" ? qe.pbMeaning(r) : (r && r.evec); }\n'
    + 'function ecoOf(qe, r){ const v = qe ? ecoVec(qe, r) : null; return v ? cosineE(qe, v) : 0; }', 'helpers');
  replace('    const eco = (qe && r.evec) ? cosineE(qe, r.evec) : 0;   // echte Bedeutung (Modell)',
    '    const eco = ecoOf(qe, r);   // echte Bedeutung (Modell; zweites Modell, wenn vollständig eingeordnet)', 'search score');
  replace('    let eco=0; if(r.evec){ for(const s of seeds){ if(s.evec){ const e=cosineE(r.evec,s.evec); if(e>eco) eco=e; } } }',
    '    let eco=0; const rv=ecoVec(qe, r); if(rv){ for(const s of seeds){ const sv=ecoVec(qe, s); if(sv){ const e=cosineE(rv,sv); if(e>eco) eco=e; } } }', 'related score');
  replace('async function embedQueryCached(q){',
    'async function embedQueryCached(q){\n  if(window.PBMeaning){ try{ const zweit = await window.PBMeaning.frage(q); if(zweit) return zweit; }catch{} }', 'query vector');
  replace('  if(hasQ && MODE==="mean" && embedder()){',
    '  if(hasQ && MODE==="mean" && (embedder() || (window.PBMeaning && window.PBMeaning.bereit()))){', 'query condition');
  return html;
}
