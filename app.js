(() => {
  'use strict';
  const {places, days} = window.TRIP;
  const byId = Object.fromEntries(places.map(p => [p.id, p]));
  let selected = 0, ditanDay = 2, map, pins = {}, layers, zones, callouts;
  const nav = document.querySelector('#day-nav');
  const content = document.querySelector('#schedule-content');
  const index = document.querySelector('#place-index');
  const dayOf = p => p.id === 'ditan' ? ditanDay : p.day;
  const colorOf = p => days[dayOf(p) - 1].color;
  const areaOf = day => ditanDay===4 && day.id===2 ? '天坛 · 城南' : ditanDay===4 && day.id===4 ? '雍和宫 · 国子监 · 地坛' : day.area;
  const mapLink = p => `https://uri.amap.com/search?keyword=${encodeURIComponent(p.entry)}&city=110000&view=map`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function getItems(day) {
    const items = day.items.map(item => ({...item})).filter(item => item.place !== 'ditan' || ditanDay === 2);
    if (day.id === 2 && ditanDay === 4) items.unshift({time:'上午',title:'睡到自然醒',text:'地坛已移到 10/4 傍晚。慢慢吃早饭，准备下午去天坛。',rest:true});
    if (day.id === 4 && ditanDay === 4) {
      items.find(item => item.place === 'wudaoying').time = '14:30–15:30';
      items.push({time:'16:00–17:00',place:'ditan',optional:true});
    }
    return items;
  }
  function routePlaces(day) { return getItems(day).filter(i => i.place).map(i => byId[i.place]); }
  function renderNav() {
    nav.innerHTML = `<button class="day-tab" style="--day:#293e3b" data-day="0" aria-pressed="${selected===0}"><strong>全程总览</strong><small>12 景点 · 6 天</small></button>` + days.map(d => `<button class="day-tab" style="--day:${d.color}" data-day="${d.id}" aria-pressed="${selected===d.id}"><strong><span class="day-dot"></span>${d.date}</strong><small>${d.short}</small></button>`).join('');
  }
  function renderIndex() {
    index.innerHTML = places.map(p => `<button class="place-link ${selected && selected!==dayOf(p)?'dim':''}" style="--day:${colorOf(p)}" data-place="${p.id}" aria-label="在地图上查看${p.name}"><span class="num">${p.n}</span>${p.name}</button>`).join('');
  }
  function overview() {
    content.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">YOUR ITINERARY</p><h2 id="itinerary-title">六天，慢慢逛北京</h2><p>先选一天，地图和日程一起展开。</p></div><span class="count">3 个已定时段</span></div><p class="overview-note">10/1 中午抵京 · 10/3 下午留白<br>每天留出午饭和休息，景点之间不赶场。</p>` + days.map(d => `<button class="day-card" style="--day:${d.color}" data-day="${d.id}"><div class="day-card-top"><span class="date-badge">${d.date}</span><strong>${d.short}</strong>${d.id<=3?'<span class="fixed">有已定安排</span>':''}<span class="arrow">↗</span></div><div class="card-stops">${routePlaces(d).map(p=>`<span>${p.name}${p.id==='ditan'?'（机动）':''}</span>`).join('')}</div><p>${d.id===2&&ditanDay===4?'上午睡到自然醒，下午约 3 小时游览。':d.summary}</p></button>`).join('');
  }
  function detail(day) {
    const steps = getItems(day).map(item => {
      if (item.rest) return `<div class="stop rest"><time>${item.time}</time><h3>${item.title}</h3><p>${item.text}</p></div>`;
      const p = byId[item.place];
      const transit = p.id==='ditan' && ditanDay===4 ? window.TRIP.transit.ditanAfterWudaoying : p.id==='tiantan' && ditanDay===4 ? window.TRIP.transit.tiantanOnly : window.TRIP.transit.incoming[p.id];
      return `${transitCard(transit)}<div class="stop"><time>${item.time}${item.optional?' · 可调整':''}</time><article class="stop-card"><h3>${p.name}${p.fixed?'<span class="fixed">已定时段</span>':''}</h3><p>${p.note}</p><div class="stop-actions"><button class="text-button" data-place="${p.id}">地图定位</button><a href="${mapLink(p)}" target="_blank" rel="noopener">高德找入口 ↗</a></div></article></div>`;
    }).join('');
    content.innerHTML = `<div style="--day:${day.color}"><div class="day-detail-top"><p class="eyebrow">DAY 0${day.id} / ${day.date} ${day.week}</p><h2 id="itinerary-title">${day.title}</h2><p>${day.id===2&&ditanDay===4?'上午留白，下午完整游览天坛。':day.summary}</p><div class="detail-pills"><span>${areaOf(day)}</span><span>${routePlaces(day).length} 个景点</span><span>${day.pace}</span></div></div><p class="transit-intro">公共交通已按当天顺序标注。住宿位置未定，首段从推荐地铁站起算；步行与接驳耗时为规划估算，国庆限流另留余量。</p><div class="timeline">${steps}${transitCard(day.id===4 && ditanDay===4 ? window.TRIP.transit.ditanDeparture : window.TRIP.transit.departures[day.id])}</div><section class="travel-tip"><h3>怎么走更顺</h3><p>${day.id===2&&ditanDay===4?'上午从住处出发前往天坛，具体交通按住宿位置选择。建议约 14:00 到天坛东门。':day.transport}</p></section><section class="travel-tip"><h3>出发前记住这一点</h3><p>${day.tips}</p></section><details class="transit-sources"><summary>交通信息来源与实时查询</summary><p>线路核对：2026.09.28。乘车方向、出口开放和临时绕行以当天运营信息为准。路线未包含未知的酒店往返。</p>${window.TRIP.transit.sources.map(source=>`<a href="${source.url}" target="_blank" rel="noopener">${source.title} ↗</a>`).join('')}</details><div class="prev-next"><button data-day="${day.id===1?0:day.id-1}">${day.id===1?'← 全程总览':'← 前一天'}</button><button data-day="${day.id===6?0:day.id+1}">${day.id===6?'回到总览 ↗':'后一天 →'}</button></div></div>`;
  }
  function transitCard(leg) {
    return `<section class="transit-leg" aria-label="${esc(leg.label)}交通路线"><div class="transit-heading"><span class="transit-icon" aria-hidden="true">↳</span><h3>${esc(leg.label)}</h3></div><div class="transit-modes">${leg.modes.map(mode=>`<span>${esc(mode)}</span>`).join('')}</div><p class="transit-route">${esc(leg.route)}</p><p class="transit-estimate">${esc(leg.estimate)}</p><details><summary>查看乘车与步行提醒</summary><p>${esc(leg.note)}</p></details></section>`;
  }
  function popup(p) {
    return `<div class="popup-meta">${esc(p.area)} · ${days[dayOf(p)-1].date}</div><h3>${esc(p.name)}</h3>${p.fixed?`<span class="fixed">${esc(p.fixed)}</span>`:''}<p>${esc(p.note)}</p><div class="popup-meta">建议停留 ${esc(p.duration)} · 标记非精确入口</div><div class="popup-links"><button data-day="${dayOf(p)}">查看当日日程</button><a href="${mapLink(p)}" target="_blank" rel="noopener">高德找入口 ↗</a></div>${p.source?`<div class="popup-links"><a href="${p.source}" target="_blank" rel="noopener">参观信息 ↗</a></div>`:''}`;
  }
  function updateMap(fit=true) {
    if (!map) return;
    layers.clearLayers(); zones.clearLayers(); pins={};
    if (!selected) {
      const groups = [
        {bounds:[[39.991,116.279],[40.021,116.342]],color:'#327c78',label:'海淀 · 园林与校园'},
        {bounds:[[39.9425,116.4005],[39.957,116.4165]],color:'#5267a8',label:'雍和宫片区'},
        {bounds:[[39.9325,116.376],[39.943,116.400]],color:'#81548e',label:'鼓楼 · 胡同与湖'},
        {bounds:[[39.918,116.374],[39.930,116.396]],color:'#367393',label:'北海 · 景山'}
      ];
      groups.forEach(g=>L.rectangle(g.bounds,{color:g.color,weight:1.5,dashArray:'6 6',fillOpacity:.05,interactive:false,className:'zone-area'}).addTo(zones));
    }
    const routeDays = selected ? [days[selected-1]] : days;
    routeDays.forEach(d=>{const pts=routePlaces(d);if(pts.length>1)L.polyline(pts.map(p=>[p.lat,p.lng]),{color:d.color,weight:selected?3:2,opacity:.7,dashArray:'5 9',interactive:false}).addTo(layers);});
    // Draw inactive destinations first so active destinations remain easy to tap.
    [...places].sort((a,b)=>Number(dayOf(a)===selected)-Number(dayOf(b)===selected)).forEach(p=>{
      const inactive=selected && selected!==dayOf(p);
      const marker=L.marker([p.lat,p.lng],{icon:L.divIcon({className:`map-pin${inactive?' muted-pin':''}${!selected?' overview-pin':''}`,html:`<span class="pin-body" style="--pin:${colorOf(p)}">${p.n}</span>`,iconSize:[32,32],iconAnchor:[16,16]}),title:`${p.name} · 10 月 ${dayOf(p)} 日`,alt:p.name,zIndexOffset:inactive?0:200,keyboard:true}).addTo(layers);
      marker.bindPopup(popup(p),{maxWidth:290,minWidth:210});
      const direction=['guozijian','shichahai','beihai','yuanmingyuan','wudaoying'].includes(p.id)?'left':'right';
      marker.bindTooltip(p.name,{permanent:!inactive && !!selected,direction,offset:[direction==='left'?-13:13,0],className:'place-label',opacity:1});
      pins[p.id]=marker;
    });
    if (fit) fitCurrent();
    renderCallouts();
  }
  function renderCallouts(){
    if(!map||!callouts)return;
    callouts.clearLayers();
    if(selected||map.getZoom()>13.5)return;
    const size=map.getSize();
    const cityCenter=map.latLngToContainerPoint([39.943,116.395]);
    const left=['wudaoying','gulou','shichahai','beihai'];
    const right=['ditan','yonghe','guozijian','nanluo','jingshan'];
    const labelWidth=size.x<420?99:112;
    const addLabel=(p,x,y)=>{
      x=Math.max(8,Math.min(size.x-labelWidth-8,x));y=Math.max(8,Math.min(size.y-60,y));
      if(y<72&&x<48)x=48;
      const target=map.containerPointToLatLng([x+labelWidth/2,y+13]);
      L.polyline([[p.lat,p.lng],target],{color:colorOf(p),weight:1,opacity:.7,interactive:false}).addTo(callouts);
      L.marker(map.containerPointToLatLng([x,y]),{icon:L.divIcon({className:'overview-label',html:`<button data-place="${p.id}" style="--pin:${colorOf(p)}"><b>${p.n}</b>${p.name}</button>`,iconSize:[labelWidth,26],iconAnchor:[0,0]}),interactive:false,keyboard:false,zIndexOffset:400}).addTo(callouts);
    };
    left.forEach((id,i)=>addLabel(byId[id],cityCenter.x-labelWidth-38,cityCenter.y-63+i*32));
    right.forEach((id,i)=>addLabel(byId[id],cityCenter.x+42,cityCenter.y-87+i*32));
    ['yuanmingyuan','tsinghua','tiantan'].forEach(id=>{const p=byId[id],point=map.latLngToContainerPoint([p.lat,p.lng]);addLabel(p,point.x-labelWidth/2,point.y+(id==='yuanmingyuan'?-38:17));});
  }
  function fitCurrent() {
    if (!map) return;
    const shown=selected?routePlaces(days[selected-1]):places;
    if(shown.length===1)map.setView([shown[0].lat,shown[0].lng],14,{animate:false});
    else map.fitBounds(shown.map(p=>[p.lat,p.lng]),{paddingTopLeft:[55,45],paddingBottomRight:[75,50],maxZoom:15,animate:false});
  }
  function showDay(day, updateHash=true) {
    selected=Number.isInteger(day)&&day>=0&&day<=6?day:0;
    renderNav();renderIndex();selected?detail(days[selected-1]):overview();
    document.querySelector('#map-title').textContent=selected?`${days[selected-1].date} · ${areaOf(days[selected-1])}`:'十二处风景，一眼看清';
    updateMap();
    if(updateHash)history.replaceState(null,'',selected?`#day-${selected}`:'#all');
    nav.querySelector('[aria-pressed=true]')?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  }
  function focusPlace(id) {
    const p=byId[id];if(!p)return;
    if(selected!==dayOf(p))showDay(dayOf(p));
    if(map){map.setView([p.lat,p.lng],15,{animate:false});pins[id]?.openPopup();}
    document.querySelector('.map-section').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function initMap(){
    if(!window.L){document.querySelector('#map-error').hidden=false;document.querySelector('#retry-map').textContent='刷新页面';document.querySelector('#retry-map').addEventListener('click',()=>location.reload());return;}
    map=L.map('map',{zoomControl:false,scrollWheelZoom:false,minZoom:9,maxZoom:18,zoomSnap:.25,zoomDelta:.5});
    L.control.zoom({position:'topright'}).addTo(map);
    L.control.scale({position:'bottomleft',imperial:false}).addTo(map);
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
    let loaded=0,failed=0;
    tiles.on('tileload',()=>{loaded++;if(loaded>failed)document.querySelector('#map-error').hidden=true;});
    tiles.on('tileerror',()=>{failed++;if(failed>2&&failed>=loaded)document.querySelector('#map-error').hidden=false;});
    document.querySelector('#retry-map').addEventListener('click',()=>{loaded=0;failed=0;tiles.redraw();});
    layers=L.layerGroup().addTo(map);zones=L.layerGroup().addTo(map);callouts=L.layerGroup().addTo(map);
    map.on('zoomend moveend resize',renderCallouts);
    new ResizeObserver(()=>{map.invalidateSize({pan:false});}).observe(document.querySelector('#map'));
  }
  document.addEventListener('click',event=>{
    const dayButton=event.target.closest('[data-day]');
    if(dayButton){showDay(Number(dayButton.dataset.day));return;}
    const placeButton=event.target.closest('[data-place]');if(placeButton)focusPlace(placeButton.dataset.place);
  });
  document.querySelector('#fit-map').addEventListener('click',()=>{showDay(0);});
  document.querySelector('#ditan-day').addEventListener('change',event=>{ditanDay=Number(event.target.value);showDay(selected);});
  window.addEventListener('hashchange',()=>showDay(Number(location.hash.match(/^#day-([1-6])$/)?.[1]||0),false));
  initMap();showDay(Number(location.hash.match(/^#day-([1-6])$/)?.[1]||0),false);
})();
