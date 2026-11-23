/* Chrono landing page: reveal on scroll, feature list, quick start. */
/* Landing page: sticky nav, reveal on scroll, feature list, quick start. */
(function(){
 const els=document.querySelectorAll('.rv');
 if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.1});
  els.forEach(el=>io.observe(el))}
 else els.forEach(el=>el.classList.add('in'));
 const SV=[
  ['Count anything you can put a number on: pages read, money saved, kilometres run. Pick a category, set a goal and log entries as you go.','Start with one subject and add more any time.','chart','feature-track'],
  ['Move to any date to see where you were then, or where you are heading. Compare plans side by side on the same day.','Rewind without losing a single entry.','travel','feature-time'],
  ['Save a what-if as its own plan and see what a change of pace does to the result, up to 15 years ahead.','Plans sit next to each other, so comparing is easy.','wand','feature-whatif'],
  ['Generate a report for any period and download it as CSV or HTML, or print it as a PDF. Export a backup file whenever you like.','Everything stays on your device.','report','feature-reports']];
 const lst=document.getElementById('svclist'),sp=document.getElementById('svcp'),sc=document.getElementById('svcc'),si=document.querySelector('.l-svc-img use');
 function svc(i){if(!lst)return;const d=SV[i];if(!d)return;sp.textContent=d[0];sc.textContent=d[1];if(si)si.setAttribute('href','#i-'+d[2]);const im=document.getElementById('svcimg');if(im){im.hidden=false;im.src='images/'+d[3]+'.jpg'}
  lst.querySelectorAll('.l-svc-b').forEach(b=>b.classList.toggle('on',+b.dataset.svc===i))}
 if(lst){svc(0);
  lst.addEventListener('mouseover',e=>{const b=e.target.closest('.l-svc-b');if(b)svc(+b.dataset.svc)});
  lst.addEventListener('focusin',e=>{const b=e.target.closest('.l-svc-b');if(b)svc(+b.dataset.svc)});
  lst.addEventListener('click',e=>{const b=e.target.closest('.l-svc-b');if(b)svc(+b.dataset.svc)})}
 function start(){
  const inp=document.getElementById('l-name'),name=inp?inp.value.trim():'';
  location.href='app.html?do=newsubj'+(name?'&name='+encodeURIComponent(name):'');
 }
 const go=document.getElementById('l-go');if(go)go.addEventListener('click',start);
 const li=document.getElementById('l-name');if(li)li.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();start()}});
})();
