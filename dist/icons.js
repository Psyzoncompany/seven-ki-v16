const cells={left:0,right:1,fist:2,up:3,dash:4,launch:5,charge:6,shield:7,blast:8,star:9,sun:10,orb:11,pause:12,close:13,expand:14,controls:15};
export function icon(name){const n=cells[name]??15;return `<span class="raster-icon" aria-hidden="true" style="background-position:${n%4*100/3}% ${Math.floor(n/4)*100/3}%"></span>`;}
export function hydrateIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
