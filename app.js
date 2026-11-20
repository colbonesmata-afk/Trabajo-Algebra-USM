'use strict';
// CÁLCULOS DEL PROYECTO — modificar solo si se comprenden las ecuaciones.
// Para cambiar textos, datos de referencia o parámetros internos, usa config.js.
const config = window.SIM_CONFIG;
const p = config.parametrosInternos;
const $ = id => document.getElementById(id);
const fmt = n => new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(n);
const fixed2 = n => (Math.round(n * 100) / 100).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});

// Modelo hídrico simplificado: 1 mm sobre 1 m² equivale a 1 litro.
// aef NO es una medida real de la cobertura ni de la infiltración.
function calcHydro(v){
  const ETc = v.eto * v.kc;
  const net = Math.max(0, ETc - v.pe);
  const netPerPlant = net * p.areaHidricaPorPlanta;
  const grossPerPlant = netPerPlant / p.eficiencia;
  const gross = v.plants * grossPerPlant;
  const Q = v.plants * p.goterosPorPlanta * v.flow;
  const current = Q * v.hours;
  const time = gross / Q;
  return {ETc, net, netPerPlant, grossPerPlant, gross, Q, current, time};
}
// Modelo cuadrático A(x) = x(P/2 - x).
// El perímetro es una delimitación conceptual, NO incluye líneas de goteo internas.
function calcSector(v, grossPerPlant){
  const length = v.perimeter/2 - v.width;
  const area = v.width * length;
  const optimalWidth = v.perimeter / 4;
  const maxArea = v.perimeter**2 / 16;
  const delta = (v.perimeter/2)**2 - 4*v.target;
  const roots = delta < 0 ? null : [((v.perimeter/2)-Math.sqrt(delta))/2, ((v.perimeter/2)+Math.sqrt(delta))/2];
  // Centros de plantas en celdas de espaciamiento fijo: borde >= medio espaciamiento.
  const capacityRows = Math.floor(v.width/p.separacionMetros);
  const capacityCols = Math.floor(length/p.separacionMetros);
  const capacity = capacityRows*capacityCols;
  const sectorPlants = Math.min(v.plants, capacity);
  const sectorGross = sectorPlants*grossPerPlant;
  const sectorFlow = sectorPlants*p.goterosPorPlanta*v.flow;
  const sectorHours = sectorFlow ? sectorGross/sectorFlow : 0;
  return {length,area,optimalWidth,maxArea,delta,roots,capacityRows,capacityCols,capacity,sectorPlants,sectorGross,sectorFlow,sectorHours};
}
const inputIds=['plants','flow','hours','eto','pe','kc','perimeter','width','target'];
function readInputs(){let o={};for(const id of inputIds)o[id]=Number($(id).value);return o;}
function validate(v){
  const errors=[];
  for (const id of inputIds){if(!$(id).value.trim() || !Number.isFinite(v[id])) errors.push(`El campo ${id} debe contener un número`);}
  if(errors.length)return errors;
  if(!Number.isInteger(v.plants)||v.plants<1||v.plants>100000)errors.push('El número de plantas debe ser un entero positivo (máx. 100.000)');
  if(v.flow<=0||v.flow>1000)errors.push('El caudal debe ser positivo y no superar 1000 L/h');
  if(v.hours<0||v.hours>24)errors.push('Las horas deben estar entre 0 y 24');
  if(v.eto<0||v.eto>20)errors.push('ETo debe estar entre 0 y 20 mm/día');
  if(v.pe<0||v.pe>100)errors.push('Pe debe estar entre 0 y 100 mm/día');
  if(v.kc<=0||v.kc>2)errors.push('Kc debe ser mayor que 0 y no superar 2');
  if(v.perimeter<=0||v.perimeter>100000)errors.push('El perímetro debe ser positivo y no superar 100.000 m');
  if(v.width<=0||v.width>=v.perimeter/2)errors.push('El ancho debe ser mayor que 0 y menor que P/2');
  if(v.target<0||v.target>1e10)errors.push('El área objetivo debe ser no negativa');
  return errors;
}
function show(id,value){$(id).textContent=value;}
function svgText(x,y,t,opts=''){return `<text x="${x}" y="${y}" ${opts}>${t}</text>`;}
function drawSector(v,s){
  const width=300, h=170, maxSide=Math.max(v.width,s.length), wRect=230*v.width/maxSide,hRect=150*s.length/maxSide;
  const x=45+(230-wRect)/2,y=16+(150-hRect)/2;
  let html=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${wRect.toFixed(1)}" height="${hRect.toFixed(1)}" fill="#d9edda" stroke="#33865b" stroke-width="3" rx="3"/>`;
  // 5 representative drip lateral lines (not a literal construction drawing)
  for(let i=1;i<=4;i++){let xx=x+wRect*i/5;html+=`<path d="M${xx.toFixed(1)} ${y} V${(y+hRect).toFixed(1)}" fill="none" stroke="#9bbf9b" stroke-dasharray="4 4"/>`;}
  html+=svgText(160,198,`x = ${fmt(v.width)} m  ·  largo = ${fmt(s.length)} m`,'text-anchor="middle" font-size="12" fill="#285b3d"');
  html+=svgText(160,212,`área = ${fmt(s.area)} m²`,'text-anchor="middle" font-size="11" fill="#526e5c"');
  $('sectorDraw').innerHTML=html;
}
function drawParabola(v,s){
  const left=37,top=19,bottom=177,chartw=385,chartH=150;
  let points=[];for(let i=0;i<=110;i++){const xx=(v.perimeter/2)*i/110;const aa=xx*(v.perimeter/2-xx);points.push(`${i?'L':'M'}${(left+chartw*i/110).toFixed(2)},${(bottom-chartH*aa/s.maxArea).toFixed(2)}`);}
  const cx=left+chartw*v.width/(v.perimeter/2),cy=bottom-chartH*s.area/s.maxArea;
  $('parabola').innerHTML=`<path d="M${left} ${top} V${bottom} H${left+chartw}" fill="none" stroke="#8da596" stroke-width="1.3"/><path d="${points.join(' ')}" fill="none" stroke="#33865b" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="5" fill="#d89938" stroke="#fff" stroke-width="1"/><circle cx="${left+chartw/2}" cy="${bottom-chartH}" r="4.5" fill="#176f4a"/><text x="${left+chartw/2+6}" y="16" font-size="12" fill="#176f4a">Máximo ${fmt(s.maxArea)} m²</text><text x="${left}" y="195" font-size="11">0</text><text x="${left+chartw-58}" y="195" font-size="11">${fmt(v.perimeter/2)} m</text><text x="${left+chartw/2}" y="212" font-size="11" text-anchor="middle">Ancho x (m)</text><text x="8" y="25" font-size="11">A</text>`;
}
function render(){
  const v=readInputs();const errors=validate(v);
  $('validation').classList.toggle('hidden',errors.length===0);
  $('validation').textContent=errors.length?'Revisa estos valores: '+errors.join('; ')+'.':'';
  if(errors.length){for(const id of ['rFlow','rCurrent','rNeed','rPerPlant','rTime'])show(id,'—');return;}
  const h=calcHydro(v),s=calcSector(v,h.grossPerPlant);
  show('rFlow',fmt(h.Q));show('rCurrent',fmt(h.current));show('rNeed',fmt(h.gross));show('rPerPlant',fmt(h.grossPerPlant));show('rTime',fmt(h.time));
  const top=Math.max(h.current,h.gross,1);
  $('barCurrent').style.width=100*h.current/top+'%';$('barNeed').style.width=100*h.gross/top+'%';
  show('txtCurrent',fmt(h.current)+' L');show('txtNeed',fmt(h.gross)+' L');
  const diff=h.gross-h.current;
  $('diagnosis').textContent=h.gross===0?'Con estos supuestos, la lluvia efectiva cubre la demanda calculada. No implica que la planta no necesite riego en condiciones reales.':diff>0?`En el escenario el riego actual es ${fmt(diff)} L/día menor que la demanda calculada. NO se ha verificado un déficit real.`:`En el escenario el riego actual supera o iguala la demanda calculada por ${fmt(-diff)} L/día. NO demuestra exceso real.`;
  if(h.time>24)$('diagnosis').textContent+=' El tiempo simulado supera 24 horas; el caudal no podría cubrir este escenario en un día.';
  const formulas=[
    `ETc = Kc × ETo = ${fmt(v.kc)} × ${fmt(v.eto)} = <b>${fmt(h.ETc)} mm/día</b>`,
    `Lámina neta = máx(0, ETc − Pe) = <b>${fmt(h.net)} mm/día</b>`,
    `Demanda neta/planta = ${fmt(h.net)} × ${fmt(p.areaHidricaPorPlanta)} = <b>${fmt(h.netPerPlant)} L/planta/día</b>`,
    `Demanda bruta/planta = ${fmt(h.netPerPlant)} / ${fmt(p.eficiencia)} = <b>${fmt(h.grossPerPlant)} L/planta/día</b>`,
    `Caudal total = ${fmt(v.plants)} × ${fmt(p.goterosPorPlanta)} × ${fmt(v.flow)} = <b>${fmt(h.Q)} L/h</b>`,
    `Volumen actual = ${fmt(h.Q)} × ${fmt(v.hours)} = <b>${fmt(h.current)} L/día</b>`,
    `Volumen estimado = ${fmt(v.plants)} × ${fmt(h.grossPerPlant)} = <b>${fmt(h.gross)} L/día</b>`,
    `Tiempo estimado = ${fmt(h.gross)} / ${fmt(h.Q)} = <b>${fmt(h.time)} h/día</b>`
  ];
  $('formulae').innerHTML=formulas.map(x=>`<div class="formula">${x}</div>`).join('');
  const targetMessage=s.delta>=0?`Δ = ${fmt(s.delta)} ≥ 0: área objetivo alcanzable. Anchos posibles: ${fmt(s.roots[0])} m y ${fmt(s.roots[1])} m.`:`Δ = ${fmt(s.delta)} &lt; 0: el área objetivo no se puede delimitar con ese perímetro.`;
  $('quadInfo').innerHTML=[
    `Perímetro fijo: P = 2x + 2l  →  l = P/2 − x = <b>${fmt(s.length)} m</b>`,
    `Área: A(x) = x(P/2 − x) = −x² + ${fmt(v.perimeter/2)}x = <b>${fmt(s.area)} m²</b>`,
    `Vértice: xᵥ = P/4 = <b>${fmt(s.optimalWidth)} m</b>; área máxima P²/16 = <b>${fmt(s.maxArea)} m²</b>`,
    `Área objetivo = ${fmt(v.target)} m². Discriminante Δ = (P/2)² − 4A objetivo. <b>${targetMessage}</b>`
  ].map(x=>`<div class="formula">${x}</div>`).join('');
  $('sectorInfo').textContent=`Con ${fmt(p.separacionMetros)} m de separación, el rectángulo propuesto admite teóricamente hasta ${fmt(s.capacity)} posiciones de planta (${s.capacityRows} × ${s.capacityCols}). Asignando como máximo ${fmt(v.plants)} plantas del caso, se consideran ${fmt(s.sectorPlants)} plantas en el sector: volumen de escenario ${fmt(s.sectorGross)} L/día; caudal ${fmt(s.sectorFlow)} L/h; tiempo teórico ${fmt(s.sectorHours)} h/día.`;
  drawSector(v,s);drawParabola(v,s);
}
function approx(a,b){return Number.isFinite(a) && Math.abs(a-b)<1e-6*Math.max(1,Math.abs(b));}
function tests(){
  const base={plants:100,flow:4,hours:2,eto:4.5,pe:0,kc:1.1,perimeter:200,width:25,target:2000};
  const hbase=calcHydro(base);const checks=[
    ['Caudal y riego actual', hbase.Q+' L/h · '+hbase.current+' L', '400 L/h · 800 L',approx(hbase.Q,400)&&approx(hbase.current,800)],
    ['Kc editable (0,8)', calcHydro({...base,kc:0.8}).ETc+' mm/día','3,6 mm/día',approx(calcHydro({...base,kc:0.8}).ETc,3.6)],
    ['Caudal doble (8 L/h)',calcHydro({...base,flow:8}).current+' L','1600 L',approx(calcHydro({...base,flow:8}).current,1600)],
    ['Pe = 5 mm/día',calcHydro({...base,pe:5}).gross+' L','0 L',approx(calcHydro({...base,pe:5}).gross,0)],
    ['Demanda inicial',fixed2(hbase.gross)+' L',fixed2(100*4.95*5.05/0.9)+' L',approx(hbase.gross,2777.5)],
    ['Área cuadrática (P=200,x=25)',calcSector(base,hbase.grossPerPlant).area+' m²','1875 m²',approx(calcSector(base,hbase.grossPerPlant).area,1875)],
    ['Área máxima (P=200)',calcSector(base,hbase.grossPerPlant).maxArea+' m²','2500 m²',approx(calcSector(base,hbase.grossPerPlant).maxArea,2500)],
    ['Discriminante (A=2000)',calcSector(base,hbase.grossPerPlant).delta+'','2000',approx(calcSector(base,hbase.grossPerPlant).delta,2000)],
    ['Sector 80 plantas',calcSector(base,hbase.grossPerPlant).sectorPlants+' plantas','80 plantas',calcSector(base,hbase.grossPerPlant).sectorPlants===80]
  ];
  let good=0;$('testRows').innerHTML=checks.map(([name,result,expected,pass])=>{if(pass)good++;return `<tr><td>${name}</td><td>${expected}</td><td>${result}</td><td>${pass?'✓ Coincide':'✗ Revisar'}</td></tr>`;}).join('');
  show('testStatus',`${good} de ${checks.length} comprobaciones correctas`);
}
function boot(){
  show('projectTitle',config.titulo);show('projectLocation',config.ubicacion);show('projectDesc',config.descripcion);show('projectVersion',config.version);
  for(const [key,val] of Object.entries(config.valoresIniciales)) $(key).value=String(val);
  for(const key of inputIds)$(key).addEventListener('input',render);
  $('loadRain').addEventListener('click',()=>{
    const rec=config.lluviaRegional.find(x=>x.id===$('month').value);if(!rec)return;
    $('pe').value=(rec.mm/rec.dias*p.fraccionLluviaEfectiva).toFixed(4);render();
  });
  $('reset').addEventListener('click',()=>{for(const [key,val] of Object.entries(config.valoresIniciales))$(key).value=String(val);$('month').value='01';render();});
  tests();render();
}
boot();
