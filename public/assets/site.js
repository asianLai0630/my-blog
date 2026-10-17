const { categories, posts } = JSON.parse(document.getElementById('article-data').textContent);
let currentFilter='全部';const allSubs=c=>c.groups.flatMap(g=>g.items.map(i=>i[0]));const catById=id=>categories.find(c=>c.id===id);function safe(s){return String(s).replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]))}function card(p){return `<button class="article-card" onclick="location.hash='article/${p.id}'"><div class="placeholder thumb">文章封面圖片預留區</div><div class="tag">${safe(catById(p.cat).title)} ／ ${safe(p.sub)}</div><div class="card-title">${safe(p.title)}</div><p class="excerpt">${safe(p.excerpt)}</p><span class="meta">${p.date}　·　約 ${p.readMinutes} 分鐘閱讀</span></button>`}let carouselIndex=0,carouselTimer=null,carouselAnimationTimer=null;const featured=posts.filter(p=>p.featuredOrder).sort((a,b)=>a.featuredOrder-b.featuredOrder);function heroCarousel(){if(!featured.length)return '';return `<section class="hero-carousel" aria-label="精選文章輪播"><div class="hero-track" id="heroTrack" style="transform:translateX(-${carouselIndex*100}%)">${featured.map((p,i)=>`<div class="hero-slide ${i===carouselIndex?'active':''}" data-slide="${i}" aria-hidden="${i!==carouselIndex}"><div class="hero-text"><span class="eyebrow">FEATURED STORY　/　0${i+1}</span><h1>${safe(p.title)}</h1><p>${safe(p.excerpt)}</p>
<a class="button" href="#article/${p.id}" tabindex="${i===carouselIndex?0:-1}">
  <span class="btn-cn">閱讀文章</span>
  <span class="btn-en">Turn the Page</span>
  <span class="btn-arrow" aria-hidden="true">▸</span>
</a>
</div><div class="hero-art"><div class="hero-picture">${p.cover?`<img class="article-card-image" src="${safe(p.cover)}" alt="${safe(p.coverAlt||p.title)}">`:`精選文章圖片預留區　0${i+1}`}</div></div></div>`).join('')}</div><div class="carousel-controls"><button class="carousel-arrow" data-carousel="prev" aria-label="上一張">‹</button><div class="dots">${featured.map((_,i)=>`<button class="dot ${i===carouselIndex?'active':''}" data-carousel="${i}" aria-label="切換至第 ${i+1} 篇" aria-current="${i===carouselIndex}"></button>`).join('')}</div><button class="carousel-arrow" data-carousel="next" aria-label="下一張">›</button></div></section>`}function latestCard(p,i){return `<a class="latest-card ${i===0?'latest-card-cover':'latest-card-standard'}" href="#article/${p.id}"><div class="latest-image">${p.cover?`<img class="article-card-image" src="${safe(p.cover)}" alt="${safe(p.coverAlt||p.title)}">`:`<span class="latest-image-label">文章圖片預留區</span>`}<span class="latest-pill">${safe(catById(p.cat).title)} · ${safe(p.sub)}</span></div><div class="latest-body"><h3>${safe(p.title)}</h3><p>${safe(p.excerpt)}</p><div class="latest-bottom"><span>閱讀文章</span><span class="latest-arrow" aria-hidden="true">→</span></div></div></a>`}
function scrollLatest(dir){const el=document.getElementById('latestTrack');if(!el)return;const card=el.querySelector('.latest-card');const step=card?card.getBoundingClientRect().width+22:340;el.scrollBy({left:dir*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
let latestOffset=0,latestBusy=false;
function latestSideCards(){const pool=posts;if(pool.length<2)return '';return Array.from({length:Math.min(3,pool.length-1)},(_,i)=>latestCard(pool[(latestOffset+i+1)%pool.length],i+1)).join('')}
function latestMainCard(){return posts.length?latestCard(posts[latestOffset%posts.length],0):'<p>目前沒有文章。</p>'}
function moveLatest(direction){
 const stage=document.getElementById('latestChanging'),pinned=document.getElementById('latestPinned');
 if(!stage||!pinned||latestBusy||!posts.length)return;
 latestBusy=true;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const swap=()=>{latestOffset=(latestOffset+direction+posts.length)%posts.length;pinned.innerHTML=latestMainCard();stage.innerHTML=latestSideCards();rewriteLinks()};
 [stage,pinned].forEach(el=>el.classList.remove('latest-out-to-left','latest-out-to-right','latest-in-from-left','latest-in-from-right','latest-main-out','latest-main-in'));
 if(reduce){swap();latestBusy=false;return}
 // Fixed-position feature card fades; only the three side cards move horizontally.
 pinned.classList.add('latest-main-out');
 stage.classList.add(direction>0?'latest-out-to-left':'latest-out-to-right');
 setTimeout(()=>{
   swap();
   pinned.classList.remove('latest-main-out'); void pinned.offsetWidth; pinned.classList.add('latest-main-in');
   stage.classList.remove('latest-out-to-left','latest-out-to-right'); void stage.offsetWidth;
   stage.classList.add(direction>0?'latest-in-from-right':'latest-in-from-left');
   setTimeout(()=>{pinned.classList.remove('latest-main-in');stage.classList.remove('latest-in-from-left','latest-in-from-right');latestBusy=false},440);
 },300);
}
function homeStats(){const items=[['所有文章',posts.length,'ALL ARTICLES'],['內容分類',categories.length,'CATEGORIES'],['精選文章',featured.length,'FEATURED'],['接案數',0,'PROJECTS']];return `<section class="home-stats" aria-label="網站統計示範數據"><div class="stats-top"><span class="eyebrow">JOURNAL IN NUMBERS</span><small>示範數據・接案數待正式更新</small></div><div class="stats-grid">${items.map(([label,value,en])=>`<div class="stat-item"><strong class="stat-number" data-count="${value}">${value}</strong><span>${label}</span><small>${en}</small></div>`).join('')}</div></section>`}
function initStats(){const nodes=[...document.querySelectorAll('.stat-number')];if(!nodes.length)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const run=el=>{const to=Number(el.dataset.count)||0;if(reduced||to===0){el.textContent=to;return;}const duration=1150;let began=null;const tick=now=>{if(!el.isConnected)return;if(began===null)began=now;const progress=Math.min(1,(now-began)/duration);el.textContent=Math.round(to*(1-Math.pow(1-progress,3)));if(progress<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};if('IntersectionObserver'in window){const ob=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){run(e.target);ob.unobserve(e.target)}}),{threshold:.45});nodes.forEach(n=>ob.observe(n))}else nodes.forEach(run)}
function home(){return `${heroCarousel()}${homeStats()}<div class="ad-slot" aria-label="廣告預留區"><span><small>AD</small>這裡是廣告版位（可放 Google AdSense 等廣告）</span></div><section class="section latest-section"><div class="section-heading"><div><h2>最新文章</h2><span class="eyebrow">LATEST ARTICLES</span></div><div class="latest-actions"><button type="button" class="latest-nav" onclick="moveLatest(-1)" aria-label="上一組最新文章">‹</button><button type="button" class="latest-nav" onclick="moveLatest(1)" aria-label="下一組最新文章">›</button></div></div><div class="latest-fixed-layout"><div class="latest-pinned" id="latestPinned" aria-live="polite">${latestMainCard()}</div><div class="latest-changing" id="latestChanging" aria-live="polite">${latestSideCards()}</div></div><div class="latest-all"><button onclick="currentFilter='全部';location.hash='category/all'">查看所有文章 ↗</button></div></section><section class="quote-band" aria-label="名言佳句"><div class="quote-inner"><span class="eyebrow">A THOUGHT TO KEEP</span><p>宇宙不回應渴望，只回應頻率。</p></div></section><section class="section home-about"><div class="section-heading"><div><h2>關於我</h2><span class="eyebrow">ABOUT ME</span></div></div><div class="home-about-layout"><div class="home-about-photo">個人照片預留區</div><div class="home-about-copy"><span class="eyebrow">HELLO, NICE TO MEET YOU</span><h3>你好，歡迎來到<br>我的文字角落。</h3><p>這裡是一個關於旅行、生活、思考與成長的個人文章空間。</p><p>喜歡在不同的地方散步、探索小店，也喜歡把日常裡的感受慢慢整理成文字。透過這些記錄，收藏沿途的風景與每個階段的自己。</p><a href="#about" class="home-about-link">更多關於我　↗</a></div></div></section><div class="ad-slot featured-ad-slot" aria-label="精選閱讀下方廣告預留區"><span><small>AD</small>這裡是廣告版位（可放 Google AdSense 等廣告）</span></div>`}
function updateCarousel(next){
 if(!featured.length)return;
 const target=(next+featured.length)%featured.length;
 if(target===carouselIndex)return;
 const slides=[...document.querySelectorAll('.hero-slide')];
 if(!slides.length){carouselIndex=target;return}
 clearTimeout(carouselAnimationTimer);
 slides.forEach((el,i)=>{el.classList.remove('leaving','entering');el.classList.toggle('active',i===carouselIndex)});
 const outgoing=slides[carouselIndex],incoming=slides[target];
 outgoing.classList.add('leaving');incoming.classList.add('active','entering');
 carouselIndex=target;
 slides.forEach((el,i)=>{el.setAttribute('aria-hidden',String(i!==carouselIndex));const link=el.querySelector('a');if(link)link.tabIndex=i===carouselIndex?0:-1});
 document.querySelectorAll('.dot').forEach((el,i)=>{el.classList.toggle('active',i===carouselIndex);el.setAttribute('aria-current',String(i===carouselIndex))});
 carouselAnimationTimer=setTimeout(()=>{outgoing.classList.remove('active','leaving');incoming.classList.remove('entering')},900);
}
function initCarousel(){
 clearInterval(carouselTimer);
 if(!document.querySelector('.hero-carousel')||featured.length<2)return;
 document.querySelectorAll('[data-carousel]').forEach(b=>b.onclick=()=>{
  const action=b.dataset.carousel;
  updateCarousel(action==='prev'?carouselIndex-1:action==='next'?carouselIndex+1:Number(action));
  initCarousel();
 });
 carouselTimer=setInterval(()=>{if(document.visibilityState==='visible'&&(!location.hash||location.hash==='#home'))updateCarousel(carouselIndex+1)},5000);
}
let archiveOffsets={},archivePages={};
function catListGroup(id,search=''){return posts.filter(p=>(id==='all'||p.cat===id)&&(currentFilter==='全部'||p.sub===currentFilter)&&(!search||`${p.title} ${p.excerpt} ${p.sub} ${p.searchText}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())))}
function archiveNews(id,arr){const others=arr.length>1?arr.slice(1):arr;return others.map(p=>`<a class="cat-news-item" href="#article/${p.id}"><div class="cat-news-pic">${p.cover?`<img class="article-card-image" src="${safe(p.cover)}" alt="${safe(p.coverAlt||p.title)}" loading="lazy">`:"圖片預留區"}</div><div><small>${safe(p.sub)} · ${p.date}</small><strong>${safe(p.title)}</strong><small>約 ${p.readMinutes} 分鐘閱讀</small></div></a>`).join('')}
function changeArchiveNews(id,dir){const el=document.getElementById('catNewsList');if(!el)return;const arr=catListGroup(id,window.archiveSearch||'');const n=Math.max(1,arr.length-1);archiveOffsets[id]=((archiveOffsets[id]||0)+dir+n)%n;el.innerHTML=archiveNews(id,arr);el.classList.remove('slide-from-left','slide-from-right');void el.offsetWidth;el.classList.add(dir>0?'slide-from-right':'slide-from-left');const count=document.getElementById('catNewsCount');if(count)count.textContent=`${String((archiveOffsets[id]||0)+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`}
function editorCards(arr,page){const per=3;const subset=arr.slice(page*per,(page+1)*per);return subset.length?subset.map(p=>`<a class="cat-editor-card" href="#article/${p.id}"><div class="cat-editor-photo">${p.cover?`<img class="article-card-image" src="${safe(p.cover)}" alt="${safe(p.coverAlt||p.title)}" loading="lazy">`:"文章圖片預留區"}</div><div class="cat-editor-body"><span class="cat-editor-tag">${safe(p.sub)} ／ ${safe(catById(p.cat).title)}</span><h3>${safe(p.title)}</h3><p>${safe(p.excerpt)}</p><small>${p.date}　·　約 ${p.readMinutes} 分鐘閱讀</small></div></a>`).join(''):'<div class="cat-no-articles">此分類尚無更多文章。</div>'}
function changeArchivePage(id,newPage){const arr=catListGroup(id,window.archiveSearch||'');const n=Math.max(1,Math.ceil(arr.length/3));archivePages[id]=Math.max(0,Math.min(newPage,n-1));const grid=document.getElementById('catEditorGrid'),pager=document.getElementById('catPager');if(grid)grid.innerHTML=editorCards(arr,archivePages[id]);if(pager)pager.innerHTML=editorPager(id,n,archivePages[id]);rewriteLinks()}
function editorPager(id,n,current){return `<button class="cat-round-btn" onclick="changeArchivePage('${id}',${current-1})" aria-label="上一頁" ${current===0?'disabled':''}>‹</button><div class="cat-pager-pages">${Array.from({length:n},(_,i)=>`<button class="cat-page-btn ${current===i?'active':''}" onclick="changeArchivePage('${id}',${i})" aria-label="第 ${i+1} 頁" ${current===i?'aria-current="page"':''}>${i+1}</button>`).join('')}</div><button class="cat-round-btn" onclick="changeArchivePage('${id}',${current+1})" aria-label="下一頁" ${current===n-1?'disabled':''}>›</button>`}
function categoryPage(id,search=''){
 const cat=catById(id),subcats=cat?allSubs(cat):[];
 if(!['全部',...subcats].includes(currentFilter))currentFilter='全部';
 const list=catListGroup(id,search),lead=list[0],title=search?'搜尋結果':cat?cat.title:'所有文章';
 const desc=search?`關鍵字：「${safe(search)}」`:cat?cat.desc:'從旅行、日常到思考與成長，所有文章都在這裡。';
 const key=id||'all';window.archiveSearch=search;const page=Math.min(archivePages[key]||0,Math.max(0,Math.ceil(list.length/3)-1));archivePages[key]=page;
 const n=Math.max(1,Math.ceil(list.length/3));const recentN=Math.max(1,list.length-1);
 return `<section class="cat-archive"><div class="cat-header"><div><span class="cat-kicker">${cat?cat.no+' / CATEGORY':'STORY ARCHIVE'}</span><h1>${safe(title)}</h1><p>${desc}</p></div></div>${cat?`<div class="cat-filter">${['全部',...subcats].map(sub=>`<button class="filter ${currentFilter===sub?'active':''}" data-filter="${safe(sub)}">${safe(sub)}</button>`).join('')}</div>`:''}<div class="cat-top"><div class="cat-feature-area">${lead?`<a class="cat-cover ${lead.cover?'has-cover':''}" href="#article/${lead.id}" ${lead.cover?`style="background-image:url('${encodeURI(lead.cover).replaceAll("'", "%27")}')"`:""}><span class="cat-cover-label">精選 / FEATURED</span><div class="cat-cover-copy"><small>${safe(lead.sub)}　·　${lead.date}</small><h2>${safe(lead.title)}</h2><p>${safe(lead.excerpt)}</p></div></a>`:'<div class="cat-no-articles">目前此分類沒有文章。</div>'}</div><div class="cat-news"><h2 class="cat-new-title">最新文章 <span style="color:#aaa;font-weight:400;font-size:12px">LATEST POSTS</span></h2><div class="cat-news-window"><div class="cat-news-list" id="catNewsList">${list.length?archiveNews(key,list):'<div class="cat-no-articles">目前沒有文章。</div>'}</div></div></div></div><section class="cat-editors"><div class="cat-edit-head"><div><span class="eyebrow">EDITOR'S PICKS</span><h2>編輯推薦</h2></div></div><div class="cat-editor-grid" id="catEditorGrid">${editorCards(list,page)}</div><div class="cat-pager" id="catPager">${editorPager(key,n,page)}</div></section><div class="ad-slot extra-ad-slot" aria-label="廣告預留區"><span><small>AD</small>這裡是廣告版位（可放 Google AdSense 等廣告）</span></div></section>`
}
let searchTerm='';
const routeMap={walk:'category-travel.html',life:'category-life.html',think:'category-mind.html',grow:'category-learn.html'};
function routeToPage(route){
 if(!route||route==='home')return 'index.html';
 if(route==='about')return 'about.html';
 if(route==='category/all')return 'search.html';
 if(route.startsWith('category/'))return routeMap[route.split('/')[1]]||'category-travel.html';
 if(route.startsWith('article/'))return 'articles/'+route.split('/')[1]+'.html';
 if(route.startsWith('portfolio/'))return 'portfolio-'+route.split('/')[1]+'.html';
 return 'index.html';
}
function prefix(){return location.pathname.includes('/articles/')?'../':'';}
function currentPageName(){const file=location.pathname.replace(/\/$/,'').split('/').pop()||'index';return file.endsWith('.html')?file:file+'.html';}
function rewriteLinks(){
 document.querySelectorAll('a[href^="#"]').forEach(a=>{const route=a.getAttribute('href').slice(1);if(!/^(home|about|category\/|article\/|portfolio\/)/.test(route))return;a.setAttribute('href',prefix()+routeToPage(route));a.removeAttribute('onclick')});
}
function closeMenus(){document.querySelectorAll('.nav-item.open').forEach(item=>{item.classList.remove('open');const btn=item.querySelector('[data-nav-toggle]');if(btn)btn.setAttribute('aria-expanded','false')})}
function currentCategoryId(){const file=currentPageName();return ({'category-travel.html':'walk','category-life.html':'life','category-mind.html':'think','category-learn.html':'grow'})[file]||'walk';}
function refreshCategory(){
 const file=currentPageName();if(!file.startsWith('category-') && file!=='search.html')return;
 const root=document.getElementById('app');root.innerHTML=categoryPage(file==='search.html'?'all':currentCategoryId(),file==='search.html'?searchTerm:'');
 rewriteLinks();bindCategory();
}
function bindCategory(){
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{currentFilter=b.dataset.filter;const cat=currentCategoryId();archivePages[cat]=0;archiveOffsets[cat]=0;refreshCategory()}));
}
function bindNav(){
 document.querySelectorAll('.nav-item').forEach(item=>{
  const btn=item.querySelector('[data-nav-toggle]');
  item.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;closeMenus();item.classList.add('open');btn?.setAttribute('aria-expanded','true')});
  item.addEventListener('pointerleave',e=>{if(e.pointerType==='touch')return;item.classList.remove('open');btn?.setAttribute('aria-expanded','false')});
  btn?.addEventListener('focus',()=>{closeMenus();item.classList.add('open');btn.setAttribute('aria-expanded','true')});
 });
 document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>{location.href=prefix()+routeToPage('category/'+b.dataset.goto)+'?sub='+encodeURIComponent(b.dataset.sub)}));
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.nav-item'))closeMenus()});
 document.getElementById('menuToggle')?.addEventListener('click',()=>document.getElementById('mobilePanel').classList.toggle('show'));
}
function setupSearch(){
 const slot=document.getElementById('searchSlot'),toggle=document.getElementById('searchToggle'),input=document.getElementById('searchInput');
 const open=v=>{slot.classList.toggle('open',v);toggle.setAttribute('aria-expanded',String(v))};
 slot.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')open(true)});
 slot.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&!slot.contains(document.activeElement))open(false)});
 slot.addEventListener('focusin',()=>open(true));
 slot.addEventListener('focusout',e=>{if(!slot.contains(e.relatedTarget)&&!slot.matches(':hover'))open(false)});
 toggle.addEventListener('click',()=>{open(true);input.focus()});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();location.href=prefix()+'search.html?q='+encodeURIComponent(input.value.trim())}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){open(false);input.blur();closeMenus()}});
}
function initSite(){
 const params=new URLSearchParams(location.search);
 const sub=params.get('sub');const q=params.get('q');
 if(sub)currentFilter=sub;
 if(q)searchTerm=q;
 const pageName=currentPageName();
 if(pageName==='index.html')document.getElementById('app').innerHTML=home();
 if(pageName.startsWith('category-')||pageName==='search.html')refreshCategory();
 rewriteLinks();bindNav();setupSearch();initCarousel();initStats();
 document.addEventListener('click',e=>{const btn=e.target.closest('button[onclick]');if(!btn)return;});
 window.addEventListener('hashchange',()=>{const route=decodeURIComponent(location.hash.slice(1));if(route && /^(home|about|category\/|article\/|portfolio\/)/.test(route))location.replace(prefix()+routeToPage(route))});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initSite);else initSite();
