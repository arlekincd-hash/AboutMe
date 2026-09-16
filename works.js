/* ============================================================
   ТВОИ РАБОТЫ — редактируй ТОЛЬКО этот файл!
   ------------------------------------------------------------
   Как добавить работу:
   1. Скопируй один блок { ... } вместе с запятой
   2. Вставь его в список
   3. Поменяй поля под себя

   ПОЛЯ:
   type   — "photo" (картинка, откроется на весь экран)
            или "video" (откроется ссылка в новой вкладке)
   img    — путь к картинке (лежит в той же папке) или ссылка
   title  — заголовок работы
   text   — короткое описание
   badge  — маленькая плашка в углу (например "AI-фото", "Видео")
   link   — ТОЛЬКО для видео: ссылка, куда ведёт клик
   ============================================================ */

const WORKS = [

  {
    type:  "photo",
    img:   "slide.jpg",
    title: "Слайды",
    text:  "Пример оформления слада для продуктовой презентации",
    badge: "AI-слайд"
  },

  {
    type:  "video",
    img:   "dog.jpg",
    title: "Реклама",
    text:  "Рекламное видео, собранное с помощью ИИ-инструментов.",
    badge: "Видео",
    link:  "https://asix.space/videos/1261?ref=jkwtxsd2"     // ← сюда вставь ссылку на своё видео
  },

  {
    type:  "video",
    img:   "factory.jpg",
    title: "Музыкальный клип",
    text:  "Музыкальный клип, собранный с помощью ИИ-инструментов.",
    badge: "Клип",
    link:  "https://asix.space/videos/973?ref=jkwtxsd2"     // ← сюда вставь ссылку на своё видео
  },
 {
    type:  "video",
    img:   "temple.jpg",
    title: "UGC",
    text:  "UGC видео для соц сетей, собранный с помощью ИИ-инструментов.",
    badge: "UGC",
    link:  "https://asix.space/videos/2503?ref=jkwtxsd2"     // ← сюда вставь ссылку на своё видео
  },

{
    type:  "video",
    img:   "winterography.jpg",
    title: "Видео",
    text:  "Видео собранное с помощью ИИ-инструментов.",
    badge: "Видео",
    link:  "https://asix.space/videos/971?ref=jkwtxsd2"     // ← сюда вставь ссылку на своё видео
  },

  {
    type:  "video",
    img:   "profile.jpg",
    title: "Видео",
    text:  "Видео собранное с помощью ИИ-инструментов.",
    badge: "Видео",
    link:  "https://asix.space/videos/971?ref=jkwtxsd2"     // ← сюда вставь ссылку на своё видео
  }

  // ← чтобы добавить ещё — поставь запятую после } выше
  //   и вставь новый блок { ... } здесь

];

/* ============================================================
   Рендер карточек работ
   ============================================================ */
function renderWorks(track){
  if(!track || !Array.isArray(WORKS)) return;
  
  track.innerHTML = WORKS.map(w=>{
    const isVideo = w.type === 'video';
    const badgeClass = isVideo ? 'badge-video' : 'badge-photo';
    const badge = w.badge ? `<span class="work-badge ${badgeClass}">${w.badge}</span>` : '';
    
    const media = isVideo
      ? `<div class="work-media"><img src="${w.img}" alt="${w.title||''}"></div>
         <div class="work-play"><span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></div>`
      : `<div class="work-media"><img src="${w.img}" alt="${w.title||''}"></div>`;
    
    return `
      <article class="work-card" data-type="${w.type}"
               ${!isVideo ? `data-full="${w.img}"` : ''}
               ${w.link   ? `data-link="${w.link}"` : ''}
               data-title="${w.title||''}">
        <div class="work-inner">
          ${badge}
          ${media}
          <div class="work-body">
            <h3>${w.title||''}</h3>
            <p>${w.text||''}</p>
          </div>
        </div>
      </article>`;
  }).join('');
}