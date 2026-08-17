const $ = (s, root = document) => root.querySelector(s);
const fmt = (v, digits = 0) => Number(v).toLocaleString('ru-RU', {maximumFractionDigits: digits, minimumFractionDigits: digits});

const angle = $('#angleRange');
function updateAngle(){
  const a = Number(angle.value), rad = a * Math.PI / 180;
  $('#angleOut').textContent = `${a}°`;
  $('#chipRatio').textContent = fmt(Math.cos(rad), 2);
  $('#forceRatio').textContent = fmt(Math.pow(Math.cos(rad), .6), 2);
  const xs=[0,15,30,35,48,54,70], ys=[1.56,1.56,1.21,.81,.62,.54,.25];
  let j=1; while(j<xs.length-1 && a>xs[j]) j++;
  const k=(a-xs[j-1])/(xs[j]-xs[j-1] || 1);
  $('#angleCost').textContent = `${fmt(ys[j-1]+(ys[j]-ys[j-1])*k,2)} ₽/м`;
}
angle.addEventListener('input', updateAngle); updateAngle();

let cutters = [
  {name:'Базовая 30°', angle:30, price:120000, sharpens:4, sharpenPrice:4500, reserve:120000, mileage:231},
  {name:'DIAREX 48°', angle:48, price:320000, sharpens:8, sharpenPrice:8000, reserve:320000, mileage:1147},
  {name:'p-System 70°', angle:70, price:320000, sharpens:4, sharpenPrice:25000, reserve:320000, mileage:2730}
];
const fields = ['name','angle','price','sharpens','sharpenPrice','reserve','mileage'];
const rows = $('#cutterRows');
function unitCost(c){ return (c.price + c.sharpens*c.sharpenPrice + c.reserve) / (c.mileage*1000); }
function renderRows(){
  rows.innerHTML = cutters.map((c,i)=>`<tr>${fields.map(f=>`<td><input data-i="${i}" data-field="${f}" type="${f==='name'?'text':'number'}" value="${c[f]}"></td>`).join('')}<td class="unit-cost">${fmt(unitCost(c),2)} ₽</td></tr>`).join('');
  renderCosts();
}
rows.addEventListener('input', e=>{ const t=e.target; if(!t.dataset.field)return; cutters[+t.dataset.i][t.dataset.field]=t.type==='number'?Number(t.value):t.value; renderCosts(); rows.children[+t.dataset.i].lastElementChild.textContent=`${fmt(unitCost(cutters[+t.dataset.i]),2)} ₽`; });
$('#addCutter').addEventListener('click',()=>{cutters.push({name:'Новая фреза',angle:35,price:150000,sharpens:4,sharpenPrice:6000,reserve:150000,mileage:500});renderRows()});
const volume = $('#volumeRange');
function scaleAdvice(v){if(v<4000)return 'около 30°';if(v<18000)return '30–35°';if(v<60000)return '35–54°';if(v<250000)return '48–70°';return 'высокопроизводительные системы, включая 70°'}
function renderCosts(){
  const v=Number(volume.value); $('#volumeOut').textContent=`${fmt(v)} пог. м`;
  const costs=cutters.map(c=>unitCost(c)*v), max=Math.max(...costs,1);
  $('#costBars').innerHTML=cutters.map((c,i)=>`<div class="cost-row"><b>${c.name||'Без названия'}</b><div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,costs[i]/max*100)}%"></div></div><strong>${fmt(costs[i])} ₽/мес</strong></div>`).join('');
  $('#scaleRecommendation').textContent=scaleAdvice(v);
}
volume.addEventListener('input',renderCosts); renderRows();

addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.progress i').style.width=`${max?scrollY/max*100:0}%`},{passive:true});

// Research stage switch: separates completed modelling from planned experiments.
const stageData={
  masters:{title:'Когда инвестиция экономически оправдана?',items:['TCO и ресурс','NPV, IRR, DPP','Точка безубыточности','Влияние масштаба']},
  phd:{title:'Когда инвестиция превращается в более качественную мебель?',items:['Сила и мощность','Ra/Rz и микрорельеф','PUR/laser-шов','Прочность и вода 24/72 ч']}
};
function setStage(key){const d=stageData[key];$('#stageContent').innerHTML=`<h3>${d.title}</h3><ul>${d.items.map(x=>`<li>${x}</li>`).join('')}</ul>`;document.querySelectorAll('.stage-switch button').forEach(b=>b.classList.toggle('active',b.dataset.stage===key))}
document.querySelectorAll('.stage-switch button').forEach(b=>b.addEventListener('click',()=>setStage(b.dataset.stage)));setStage('masters');

document.querySelectorAll('.edge-anatomy button').forEach(b=>b.addEventListener('click',()=>{$('#edgeExplain').textContent=b.dataset.edge;document.querySelectorAll('.edge-anatomy button').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));

function mapRecommendation(){
  const v=Number($('#mapVolume').value), cap=Number($('#mapCapex').value), tech=$('#mapTech').value;
  $('#mapVolumeOut').textContent=`${fmt(v)} м/мес`;$('#mapCapexOut').textContent=`${fmt(cap)} тыс. ₽`;
  let rec=scaleAdvice(v), note=`Для ${tech} нужно экспериментально уточнить требования к торцу.`;
  if(cap<220)rec='базовая 30° или поэтапное внедрение';else if(cap<340&&v>=18000)rec='35° или сменно-ножевая система';else if(cap<1200&&rec.includes('70'))rec='48–54°; 70° ограничен CAPEX';
  if(tech.startsWith('Laser'))note='Перед рекомендацией нужна валидация на доступной laser-линии.';
  $('#mapResult').textContent=rec;$('#mapNote').textContent=note;
}
['mapVolume','mapCapex','mapTech'].forEach(id=>$('#'+id).addEventListener('input',mapRecommendation));mapRecommendation();

function matrix(){const vals=[['Сила','предстоит измерить'],['Ra / Rz','предстоит измерить'],['Сколы','предстоит оценить'],['Прочность','предстоит испытать'],['Вода 24/72 ч','предстоит испытать']];$('#matrixResult').innerHTML=vals.map(x=>`<div><b>${x[0]}</b><small>${x[1]}</small></div>`).join('')+`<p class="data-status">Выбрано: ${$('#mxAngle').value}, ${$('#mxMaterial').value}, ${$('#mxWear').value}, ${$('#mxGlue').value}. Результаты не подменяются прогнозом.</p>`}
['mxAngle','mxMaterial','mxWear','mxGlue'].forEach(id=>$('#'+id).addEventListener('change',matrix));matrix();

function npv(capex,cash,years,rate){let n=-capex;for(let y=1;y<=years;y++)n+=cash/Math.pow(1+rate,y);return n}
function investment(){const c=+$(`#invCapex`).value,cf=+$(`#invCash`).value,y=+$(`#invYears`).value,r=+$(`#invRate`).value/100;$('#invNpv').textContent=`${fmt(npv(c,cf,y,r))} ₽`;let lo=0,hi=10;for(let z=0;z<80;z++){let m=(lo+hi)/2;if(npv(c,cf,y,m)>0)lo=m;else hi=m}$('#invIrr').textContent=`${fmt((lo+hi)/2*100,1)}%`;let cum=-c,dpp='более горизонта';for(let i=1;i<=y;i++){const pv=cf/Math.pow(1+r,i);if(cum+pv>=0){dpp=`${fmt(i-1+(-cum/pv),2)} года`;break}cum+=pv}$('#invDpp').textContent=dpp}
['invCapex','invCash','invYears','invRate'].forEach(id=>$('#'+id).addEventListener('input',investment));$('#invRisk').addEventListener('input',()=>$('#invRiskOut').textContent=$('#invRisk').value+'%');investment();
function rngNormal(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function runMonte(){const c=+$('#invCapex').value,cf=+$('#invCash').value,y=+$('#invYears').value,r=+$('#invRate').value/100,s=+$('#invRisk').value/100,arr=[];for(let i=0;i<10000;i++)arr.push(npv(c,Math.max(0,cf*(1+rngNormal()*s)),y,r));arr.sort((a,b)=>a-b);$('#invProb').textContent=`${fmt(arr.filter(x=>x>0).length/100,1)}%`;drawHistogram(arr)}
function drawHistogram(arr){const cv=$('#monteChart'),ctx=cv.getContext('2d'),w=cv.width,h=cv.height,bins=40,min=arr[0],max=arr.at(-1),counts=Array(bins).fill(0);arr.forEach(x=>counts[Math.min(bins-1,Math.floor((x-min)/(max-min||1)*bins))]++);const peak=Math.max(...counts);ctx.clearRect(0,0,w,h);ctx.strokeStyle='#185a40';ctx.beginPath();ctx.moveTo(35,h-30);ctx.lineTo(w-15,h-30);ctx.stroke();counts.forEach((n,i)=>{const bh=n/peak*(h-65);ctx.fillStyle='#32d68b';ctx.fillRect(36+i*(w-55)/bins,h-31-bh,(w-55)/bins-2,bh)});const zero=(0-min)/(max-min||1)*(w-55)+35;if(zero>35&&zero<w-15){ctx.strokeStyle='#d7b567';ctx.beginPath();ctx.moveTo(zero,20);ctx.lineTo(zero,h-30);ctx.stroke()}}
$('#runMonte').addEventListener('click',runMonte);runMonte();
$('#printReport').addEventListener('click',()=>window.print());
document.querySelectorAll('.section').forEach(s=>s.classList.add('js-reveal'));
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in-view')}),{threshold:.08});
document.querySelectorAll('.js-reveal').forEach(s=>reveal.observe(s));
