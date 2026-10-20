// Adapt the native bundle only. The independent PWA and cryptographic module stay byte-identical.
export function adaptRecovery(html) {
  function replace(before, after) {
    if (html.split(before).length !== 2) throw new Error('Review native recovery adaptation after source changes');
    html = html.replace(before, after);
  }
  replace('var pendingShares=null;', `var pendingShares=null, pendingPassword=null, sharesSaved=false, sharesBusy=false, setupEpoch=0;
  function recoveryBusy(busy){
    sharesBusy=busy;
    ['tzPw','tzPw2','tzMk','tzDl'].forEach(function(id){if(el(id))el(id).disabled=busy;});
    if(el('tzSaved'))el('tzSaved').disabled=busy || !sharesSaved;
    if(el('tzFinish'))el('tzFinish').disabled=busy || !sharesSaved || !el('tzSaved').checked;
  }`);
  replace('pendingShares=null;\n    openModal(', 'setupEpoch++; pendingShares=null; pendingPassword=null; sharesSaved=false; sharesBusy=false;\n    openModal(');
  replace('function closeModal(){ var bg=el("tresorModalBg"); if(bg) bg.classList.remove("on"); }', `function closeModal(){
    setupEpoch++;pendingShares=null;pendingPassword=null;sharesSaved=false;sharesBusy=false;
    ['tzPw','tzPw2'].forEach(function(id){if(el(id))el(id).value='';});
    var bg=el('tresorModalBg');if(bg)bg.classList.remove('on');
  }`);
  replace('tx("sharesHint")', 'tx("sharesHint")+" "+window.PBRecoveryExport.text("scope")');
  replace('    el("tzMk").addEventListener("click", async function(){', `    ['tzPw','tzPw2'].forEach(function(id){el(id).addEventListener('input',function(){
      var had=!!pendingShares;
      pendingShares=null;pendingPassword=null;sharesSaved=false;
      el('tzSaved').checked=false;el('tzDl').style.display='none';el('tzSaveWrap').style.display='none';
      recoveryBusy(false);
      if(had)el('tzErr').textContent=window.PBRecoveryExport.text('changed');
    });});
    el('tzSaved').disabled=true;
    el("tzMk").addEventListener("click", async function(){
      if(sharesBusy)return;var epoch=setupEpoch;`);
  replace(`      try{ var sp=await J().splitSecret(pw); pendingShares=sp.shares; }
      catch(e){ err.textContent=String(e&&e.message||e); return; }
      el("tzDl").style.display=""; el("tzSaveWrap").style.display="";`, `      recoveryBusy(true);sharesSaved=false;el('tzSaved').checked=false;
      try{
        var sp=await J().splitSecret(pw); if(epoch!==setupEpoch)return; pendingShares=sp.shares; pendingPassword=pw;
        el('tzDl').style.display='';el('tzSaveWrap').style.display='';
        await downloadShares(pendingShares);
      }catch(e){if(epoch===setupEpoch)err.textContent=window.PBRecoveryExport.text('failed');}
      finally{if(epoch===setupEpoch)recoveryBusy(false);}`);
  replace('el("tzFinish").disabled=!sv.checked;', 'el("tzFinish").disabled=sharesBusy || !sharesSaved || !sv.checked;');
  replace('if(!pendingShares || !el("tzSaved").checked)', 'if(sharesBusy || !sharesSaved || pendingPassword!==pw || !pendingShares || !el("tzSaved").checked)');
  const start=html.indexOf('  function downloadShares(shares){');
  const end=html.indexOf('  function openUnlock(){', start);
  if(start<0 || end<0)throw new Error('Review native recovery export boundary');
  html=html.slice(0,start)+`  async function downloadShares(shares){
    if(!shares || shares!==pendingShares)return;var epoch=setupEpoch;
    recoveryBusy(true);sharesSaved=false;el('tzSaved').checked=false;
    el('tzErr').textContent=window.PBRecoveryExport.text('saving');
    try{
      var result=await window.PBRecoveryExport.save(shares,tx('sharesFile'),tx('sharesHead'));
      if(shares!==pendingShares)return;
      sharesSaved=result.saved===true;
      el('tzErr').textContent=window.PBRecoveryExport.text(sharesSaved?'saved':'cancelled');
    }catch(e){if(epoch===setupEpoch)el('tzErr').textContent=window.PBRecoveryExport.text('failed');}
    finally{if(epoch===setupEpoch)recoveryBusy(false);}
  }

`+html.slice(end);
  return html;
}
