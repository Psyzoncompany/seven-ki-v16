import {ACTIONS,DEFAULTS,sanitizePrefs,controlPosition} from './controls-config.js?v=7';
const $=id=>document.getElementById(id),STORE='sevenki-controls-v3';
export class TouchLayout {
  constructor(container,callbacks){
    this.container=container;this.callbacks=callbacks;this.editing=false;this.draft=null;this.powers=false;
    try{this.prefs=sanitizePrefs(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{this.prefs=sanitizePrefs(null);}
    this.buttons=Array.from(container.querySelectorAll('[data-action]'));
    $('touch-powers').addEventListener('click',()=>{this.callbacks.clear?.();this.powers=!this.powers;container.classList.toggle('powers-open',this.powers);$('touch-powers').setAttribute('aria-expanded',String(this.powers));$('touch-powers').textContent=this.powers?'− PODERES':'+ PODERES';});
    for(const id of ['layout-button'])$(id).addEventListener('click',()=>this.open());
    $('layout-save').addEventListener('click',()=>this.save());$('layout-cancel').addEventListener('click',()=>this.close());
    $('layout-size').addEventListener('input',e=>{this.draft.size=Number(e.target.value)/100;this.renderPreview();});
    $('layout-opacity').addEventListener('input',e=>{this.draft.opacity=Number(e.target.value)/100;this.renderPreview();});
    $('layout-mode').addEventListener('change',()=>this.renderPreview());
    $('layout-reset').addEventListener('click',()=>{const mode=$('layout-mode').value;for(const key of ACTIONS)this.draft[mode][key]=[...DEFAULTS[mode][key]];this.draft.size=1;this.renderPreview();});
    $('layout-mirror').addEventListener('click',()=>{const mode=$('layout-mode').value;for(const key of ACTIONS)this.draft[mode][key][0]=100-this.draft[mode][key][0];this.renderPreview();});
    this.previewButtons=this.buttons.map(button=>{const b=button.cloneNode(true);b.removeAttribute('id');b.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));b.classList.remove('held');b.classList.add('preview-control');b.title='Arraste para reposicionar';$('layout-preview').append(b);let drag=null;
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);drag=e.pointerId;b.classList.add('dragging');});
      b.addEventListener('pointermove',e=>{if(drag!==e.pointerId)return;const r=$('layout-preview').getBoundingClientRect();this.draft[$('layout-mode').value][b.dataset.action]=[Math.max(2,Math.min(98,(e.clientX-r.left)/r.width*100)),Math.max(2,Math.min(98,(e.clientY-r.top)/r.height*100))];this.renderPreview();});
      const up=()=>{drag=null;b.classList.remove('dragging');};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);return b;});
    new ResizeObserver(()=>{this.apply();if(this.editing)this.renderPreview();}).observe(container);
    this.apply();
  }
  mode(){return matchMedia('(orientation: landscape)').matches?'landscape':'portrait';}
  paint(buttons,area,prefs,mode){
    const width=area.clientWidth,height=area.clientHeight;if(!width||!height)return;
    for(const b of buttons){const p=controlPosition(b.dataset.action,prefs,mode,width,height);Object.assign(b.style,{left:p.x+'px',top:p.y+'px',width:p.size+'px',height:p.size+'px',opacity:String(prefs.opacity)});}
  }
  apply(){this.paint(this.buttons,this.container,this.prefs,this.mode());}
  open(){this.callbacks.pause();$('controls-modal').hidden=true;this.draft=sanitizePrefs(this.prefs);this.editing=true;$('layout-modal').hidden=false;$('layout-mode').value=this.mode();this.renderPreview();$('layout-save').focus();}
  renderPreview(){
    if(!this.draft)return;const mode=$('layout-mode').value;$('layout-preview').dataset.orientation=mode;
    $('layout-size').value=Math.round(this.draft.size*100);$('layout-size-value').textContent=Math.round(this.draft.size*100)+'%';
    $('layout-opacity').value=Math.round(this.draft.opacity*100);$('layout-opacity-value').textContent=Math.round(this.draft.opacity*100)+'%';
    this.paint(this.previewButtons,$('layout-preview'),this.draft,mode);
  }
  save(){this.prefs=sanitizePrefs(this.draft);try{localStorage.setItem(STORE,JSON.stringify(this.prefs));$('layout-status').textContent='Controles salvos neste dispositivo.';}catch{$('layout-status').textContent='Controles aplicados nesta sessão.';}this.apply();this.close();}
  close(){this.editing=false;this.draft=null;$('layout-modal').hidden=true;this.callbacks.onClose();}
}
