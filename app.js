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
function unitCost(c){
  const values=[c.price,c.sharpens,c.sharpenPrice,c.reserve,c.mileage].map(Number);
  if(values.some(v=>!Number.isFinite(v)||v<0)||values[4]<=0)return NaN;
  return (values[0]+values[1]*values[2]+values[3])/(values[4]*1000);
}
function costLabel(value,digits=0,suffix=' ₽'){return Number.isFinite(value)?`${fmt(value,digits)}${suffix}`:'—'}
function renderRows(){
  rows.innerHTML = cutters.map((c,i)=>`<tr>${fields.map(f=>`<td><input data-i="${i}" data-field="${f}" type="${f==='name'?'text':'number'}"${f==='name'?'':' min="0"'} value="${c[f]}"></td>`).join('')}<td class="unit-cost">${costLabel(unitCost(c),2)}</td></tr>`).join('');
  renderCosts();
}
rows.addEventListener('input', e=>{ const t=e.target; if(!t.dataset.field)return; cutters[+t.dataset.i][t.dataset.field]=t.type==='number'?Number(t.value):t.value; renderCosts(); rows.children[+t.dataset.i].lastElementChild.textContent=costLabel(unitCost(cutters[+t.dataset.i]),2); });
$('#addCutter').addEventListener('click',()=>{cutters.push({name:'Новая фреза',angle:35,price:150000,sharpens:4,sharpenPrice:6000,reserve:150000,mileage:500});renderRows()});
const volume = $('#volumeRange');
function scaleAdvice(v){if(v<4000)return 'около 30°';if(v<18000)return '30–35°';if(v<60000)return '35–54°';if(v<250000)return '48–70°';return 'высокопроизводительные системы, включая 70°'}
function renderCosts(){
  const v=Number(volume.value); $('#volumeOut').textContent=`${fmt(v)} пог. м`;
  const costs=cutters.map(c=>unitCost(c)*v);
  const referenceVolume=Math.max(100000,v);
  const validScaleValues=cutters.map(c=>unitCost(c)*referenceVolume).filter(Number.isFinite);
  const scaleMax=Math.max(...validScaleValues,1);
  $('#costBars').innerHTML=cutters.map((c,i)=>`<div class="cost-row"><b>${c.name||'Без названия'}</b><div class="bar-track"><div class="bar-fill" style="width:${Number.isFinite(costs[i])?Math.max(2,Math.min(100,costs[i]/scaleMax*100)):0}%"></div></div><strong>${Number.isFinite(costs[i])?`${fmt(costs[i])} ₽/мес`:'—'}</strong></div>`).join('');
  $('#costScaleNote').textContent=`Длина полосы — абсолютные затраты. Правая граница шкалы: ${fmt(scaleMax)} ₽/мес.`;
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

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function reportNumber(value, digits = 0){
  return `${fmt(value, digits)}`;
}

function buildCalculationReport(){
  // Recalculate every dependent value immediately before capturing the report.
  mapRecommendation();
  investment();
  runMonte();

  const monthlyVolume = Number(volume.value);
  const cutterRows = cutters.map(c => {
    const perMeter = unitCost(c);
    const monthlyCost = perMeter * monthlyVolume;
    return `<tr>
      <td>${escapeHtml(c.name || 'Без названия')}</td>
      <td>${reportNumber(c.angle)}°</td>
      <td>${reportNumber(c.price)} ₽</td>
      <td>${reportNumber(c.sharpens)}</td>
      <td>${reportNumber(c.sharpenPrice)} ₽</td>
      <td>${reportNumber(c.reserve)} ₽</td>
      <td>${reportNumber(c.mileage)} тыс. м</td>
      <td><b>${costLabel(perMeter,2)}</b></td>
      <td><b>${costLabel(monthlyCost)}</b></td>
    </tr>`;
  }).join('');

  const validCutters = cutters.filter(c=>Number.isFinite(unitCost(c)));
  const cheapest = validCutters.reduce((best,cutter)=>!best||unitCost(cutter)<unitCost(best)?cutter:best,null);
  const cheapestSummary = cheapest
    ? `${escapeHtml(cheapest.name)} — ${costLabel(unitCost(cheapest),2,' ₽/пог. м')}`
    : 'нет корректно заполненных вариантов';
  const reportDate = new Intl.DateTimeFormat('ru-RU', {dateStyle:'long', timeStyle:'short'}).format(new Date());
  const mapVolume = Number($('#mapVolume').value);
  const mapCapex = Number($('#mapCapex').value);
  const capex = Number($('#invCapex').value);
  const annualEffect = Number($('#invCash').value);
  const years = Number($('#invYears').value);
  const rate = Number($('#invRate').value);
  const risk = Number($('#invRisk').value);

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
    <title>Расчётный отчёт — сравнение фрез</title>
    <style>
      :root{--ink:#17251f;--muted:#617169;--green:#147a50;--pale:#edf6f1;--gold:#9b7628;--line:#cad9d1}
      *{box-sizing:border-box}body{margin:0;background:#eef3f0;color:var(--ink);font:14px/1.45 Arial,sans-serif}
      main{width:min(1120px,calc(100% - 32px));margin:24px auto;padding:42px;background:#fff;box-shadow:0 8px 35px #183b2b1a}
      header{display:flex;justify-content:space-between;gap:24px;padding-bottom:22px;border-bottom:3px solid var(--green)}
      h1{margin:0;font-size:28px}h2{margin:28px 0 12px;font-size:19px;color:var(--green)}p{margin:7px 0}.meta{text-align:right;color:var(--muted)}
      .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.metric{padding:15px;border:1px solid var(--line);border-radius:8px;background:var(--pale)}
      .metric small,.metric strong{display:block}.metric small{color:var(--muted)}.metric strong{margin-top:5px;font-size:19px;color:var(--green)}
      table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:9px 7px;border:1px solid var(--line);text-align:right}th{background:var(--pale);color:#395348}th:first-child,td:first-child{text-align:left}
      .result{padding:15px 18px;border-left:4px solid var(--gold);background:#fbf7eb}.result b{color:var(--gold)}
      .formula,.note{color:var(--muted);font-size:12px}.formula{padding:10px 13px;background:#f5f7f6}
      footer{margin-top:30px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:11px}
      .print{position:fixed;right:20px;bottom:20px;padding:12px 18px;border:0;border-radius:7px;background:var(--green);color:#fff;font-weight:bold;cursor:pointer}
      @page{size:A4 landscape;margin:12mm}@media print{body{background:#fff}main{width:auto;margin:0;padding:0;box-shadow:none}.print{display:none}h2{break-after:avoid}table,.summary,.result{break-inside:avoid}}
      @media(max-width:700px){main{padding:22px}.summary{grid-template-columns:1fr}header{display:block}.meta{text-align:left;margin-top:12px}table{display:block;overflow:auto}}
    </style></head><body><main>
      <header><div><h1>Расчётный отчёт</h1><p>Сравнение алмазных фуговальных фрез</p></div><div class="meta">Наиль Мурзакаев<br>${escapeHtml(reportDate)}</div></header>

      <h2>1. Введённые условия выбора</h2>
      <div class="summary">
        <div class="metric"><small>Объём производства</small><strong>${reportNumber(mapVolume)} м/мес</strong></div>
        <div class="metric"><small>Допустимый CAPEX</small><strong>${reportNumber(mapCapex)} тыс. ₽</strong></div>
        <div class="metric"><small>Технология кромки</small><strong>${escapeHtml($('#mapTech').value)}</strong></div>
      </div>
      <div class="result"><span>Предварительная область: </span><b>${escapeHtml($('#mapResult').textContent)}</b><p>${escapeHtml($('#mapNote').textContent)}</p></div>

      <h2>2. Сравнение стоимости владения</h2>
      <p>Расчётный объём: <b>${reportNumber(monthlyVolume)} пог. м/мес</b>.</p>
      <table><thead><tr><th>Фреза</th><th>Угол</th><th>Цена</th><th>Переточек</th><th>Цена переточки</th><th>Резерв</th><th>Пробег</th><th>Стоимость 1 м</th><th>В месяц</th></tr></thead><tbody>${cutterRows}</tbody></table>
      <p class="formula">TCO на 1 пог. м = (цена фрезы + количество переточек × цена переточки + резерв) ÷ полный пробег.</p>
      <div class="result">Минимальная расчётная стоимость владения: <b>${cheapestSummary}</b>.<br>Область по масштабу: <b>${escapeHtml($('#scaleRecommendation').textContent)}</b>.</div>

      <h2>3. Инвестиционный расчёт</h2>
      <div class="summary">
        <div class="metric"><small>CAPEX</small><strong>${reportNumber(capex)} ₽</strong></div>
        <div class="metric"><small>Годовой эффект</small><strong>${reportNumber(annualEffect)} ₽</strong></div>
        <div class="metric"><small>Горизонт / ставка</small><strong>${reportNumber(years)} лет / ${reportNumber(rate,1)}%</strong></div>
        <div class="metric"><small>NPV</small><strong>${escapeHtml($('#invNpv').textContent)}</strong></div>
        <div class="metric"><small>IRR</small><strong>${escapeHtml($('#invIrr').textContent)}</strong></div>
        <div class="metric"><small>DPP</small><strong>${escapeHtml($('#invDpp').textContent)}</strong></div>
        <div class="metric"><small>Неопределённость</small><strong>${reportNumber(risk)}%</strong></div>
        <div class="metric"><small>P(NPV &gt; 0), 10 000 сценариев</small><strong>${escapeHtml($('#invProb').textContent)}</strong></div>
      </div>

      <p class="note">Отчёт сформирован только по введённым параметрам и расчётным результатам. Он не доказывает технологическое преимущество геометрии: связь «угол → торец → шов» подлежит экспериментальной проверке.</p>
      <footer>Цифровой прототип методики выбора фрезы для мебельного производства.</footer>
    </main><button class="print" onclick="window.print()">Сохранить как PDF</button></body></html>`;
}

function openCalculationReport(){
  const reportWindow = window.open('', '_blank');
  if(!reportWindow){
    alert('Браузер заблокировал окно отчёта. Разрешите всплывающие окна для этого сайта.');
    return;
  }
  reportWindow.document.open();
  reportWindow.document.write(buildCalculationReport());
  reportWindow.document.close();
}

$('#printReport').addEventListener('click',openCalculationReport);
document.querySelectorAll('.section').forEach(s=>s.classList.add('js-reveal'));
const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in-view')}),{threshold:.08});
document.querySelectorAll('.js-reveal').forEach(s=>reveal.observe(s));
