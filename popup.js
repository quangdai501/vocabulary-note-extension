import{a as s,s as v,p as b,d as E}from"./dictionary-B9yxRIhQ.js";let r=[],l=0,i=[],m=[];const I=document.querySelectorAll(".tab"),D=document.querySelectorAll(".tab-panel"),P=document.getElementById("totalWords"),M=document.getElementById("dueWords"),$=document.getElementById("settingsBtn"),f=document.getElementById("emptyReview"),w=document.getElementById("reviewCard"),S=document.getElementById("reviewWord"),W=document.getElementById("reviewIPA"),A=document.getElementById("reviewMeaning"),V=document.getElementById("reviewExample"),N=document.getElementById("youglishLink"),T=document.getElementById("playBtn"),U=document.querySelectorAll(".review-btn"),F=document.getElementById("reviewProgress"),j=document.getElementById("hardInterval"),q=document.getElementById("goodInterval"),z=document.getElementById("easyInterval"),H=document.getElementById("searchInput"),g=document.getElementById("vocabularyList"),x=document.getElementById("addWordForm"),k=document.getElementById("wordInput"),B=document.getElementById("meaningInput"),L=document.getElementById("exampleInput"),u=document.getElementById("fetchBtn"),G=document.getElementById("exportBtn"),Y=document.getElementById("importBtn"),p=document.getElementById("importFile"),O=document.getElementById("resetProgressBtn");Q();async function Q(){await c(),K(),y()}async function c(){i=await s.getAllVocabulary(),r=await s.getDueWords(),m=[...i],J()}function J(){P.textContent=i.length,M.textContent=r.length}function K(){$.addEventListener("click",()=>chrome.tabs.create({url:chrome.runtime.getURL("options.html")})),I.forEach(t=>{t.addEventListener("click",()=>X(t.dataset.tab))}),U.forEach(t=>{t.addEventListener("click",()=>Z(t.dataset.quality))}),T.addEventListener("click",_),H.addEventListener("input",te),x.addEventListener("submit",ce),u.addEventListener("click",de),G.addEventListener("click",ue),Y.addEventListener("click",()=>p.click()),p.addEventListener("change",me),O.addEventListener("click",ve)}function X(t){I.forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),D.forEach(e=>{e.classList.toggle("active",e.id===`${t}-panel`)}),t==="review"?y():t==="vocabulary"&&ee()}function y(){if(r.length===0){f.style.display="flex",w.style.display="none";return}f.style.display="none",w.style.display="block";const t=r[l];C(t)}function C(t){S.textContent=t.word,W.textContent=t.ipa||"No IPA available",A.textContent=t.meaning||"No meaning available";const e=t.examples&&t.examples.length>0?t.examples[0]:"No example available";V.textContent=e,N.href=t.youglishLink,F.textContent=`${l+1} / ${r.length}`;const n=v.getPredictedIntervals(t);j.textContent=n.hard,q.textContent=n.good,z.textContent=n.easy}async function Z(t){const e=r[l],n=v.getQualityScore(t),o=v.calculateNextReview(e,n);await s.updateWordSRS(e.id,o),l++,l>=r.length?(await c(),l=0,y()):C(r[l])}async function _(){const t=r[l];await b.playPronunciation(t.word,t.audioUrl)}function ee(){d()}function d(){if(m.length===0){g.innerHTML=`
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M16 16h32v32H16z" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M24 28h16M24 36h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>${i.length===0?"No vocabulary yet":"No matches found"}</p>
        <small>${i.length===0?"Start saving words to build your vocabulary!":"Try a different search term"}</small>
      </div>
    `;return}const t=m.map(e=>{const n=v.isDue(e),o=e.nextReview?new Date(e.nextReview).toLocaleDateString():"Not reviewed yet";return`
      <div class="vocab-item" data-id="${e.id}">
        <div class="vocab-item-header">
          <div>
            <div class="vocab-item-word">${e.word}</div>
            <div class="vocab-item-ipa">${e.ipa||"No IPA"}</div>
          </div>
          ${n?'<span class="due-badge">DUE</span>':""}
        </div>
        <div class="vocab-item-meaning">${e.meaning||"No meaning"}</div>
        <div class="vocab-item-footer">
          <span>Next review: ${o}</span>
          <div class="vocab-item-actions">
            <button class="vocab-action-btn" data-action="play" data-id="${e.id}" title="Play">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3l8 5-8 5V3z" fill="currentColor"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="youglish" data-id="${e.id}" title="YouGlish">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M6 8l4-2.5v5L6 8z" fill="currentColor"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="cambridge" data-id="${e.id}" title="Cambridge Dictionary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="translate" data-id="${e.id}" title="Google Translate">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </button>
            <button class="vocab-action-btn" data-action="edit" data-id="${e.id}" title="Edit next review">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 3.5l1 1L7 12.5l-1-1L11.5 3.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 6l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
             <button class="vocab-action-btn" data-action="delete" data-id="${e.id}" title="Delete">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `}).join("");g.innerHTML=t,g.querySelectorAll(".vocab-action-btn").forEach(e=>{e.addEventListener("click",n=>{n.stopPropagation();const o=e.dataset.action,a=e.dataset.id;o==="play"?ne(a):o==="youglish"?oe(a):o==="cambridge"?ae(a):o==="translate"?ie(a):o==="edit"?re(a):o==="delete"&&le(a)})})}function te(t){const e=t.target.value.toLowerCase().trim();e===""?m=[...i]:m=i.filter(n=>n.word.toLowerCase().includes(e)||n.meaning&&n.meaning.toLowerCase().includes(e)),d()}async function ne(t){const e=i.find(n=>n.id===t);e&&await b.playPronunciation(e.word,e.audioUrl)}function oe(t){const e=i.find(n=>n.id===t);if(e){const n=e.youglishLink||`https://youglish.com/pronounce/${encodeURIComponent(e.word)}/english`;chrome.tabs.create({url:n})}}function ae(t){const e=i.find(n=>n.id===t);if(e){const n=`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(e.word)}`;chrome.tabs.create({url:n})}}function ie(t){const e=i.find(n=>n.id===t);if(e){const n=`https://translate.google.com/?hl=vi&sl=en&tl=vi&text=${encodeURIComponent(e.word)}&op=translate`;chrome.tabs.create({url:n})}}async function re(t){const e=i.find(o=>o.id===t);if(!e)return;const n=e.nextReview?Math.max(0,Math.ceil((e.nextReview-Date.now())/(1e3*60*60*24))):0;se(e,n)}function se(t,e){const n=document.createElement("div");n.className="modal-overlay",n.innerHTML=`
    <div class="modal-content">
      <h3>Edit Next Review Time</h3>
      <div class="modal-body">
        <p><strong>Word:</strong> ${t.word}</p>
        <p><strong>Current next review:</strong> ${t.nextReview?new Date(t.nextReview).toLocaleDateString():"Not scheduled"}</p>
        <div class="form-group">
          <label>Days from now:</label>
          <input type="number" id="editDaysInput" min="0" value="${e}" placeholder="Enter number of days">
          <small>Enter 0 to make it due immediately</small>
        </div>
      </div>
      <div class="modal-actions">
        <button id="cancelEdit" class="btn btn-secondary">Cancel</button>
        <button id="saveEdit" class="btn btn-primary">Save</button>
      </div>
    </div>
  `,document.body.appendChild(n),setTimeout(()=>{document.getElementById("editDaysInput").focus(),document.getElementById("editDaysInput").select()},100),document.getElementById("cancelEdit").addEventListener("click",()=>{document.body.removeChild(n)}),document.getElementById("saveEdit").addEventListener("click",async()=>{const o=document.getElementById("editDaysInput"),a=parseInt(o.value);if(isNaN(a)||a<0){alert("Please enter a valid number of days (0 or more)"),o.focus();return}const h=a===0?Date.now():Date.now()+a*24*60*60*1e3;t.nextReview=h,t.updatedAt=Date.now(),await s.updateWord(t),await c(),d(),document.body.removeChild(n)}),n.addEventListener("click",o=>{o.target===n&&document.body.removeChild(n)}),document.addEventListener("keydown",function o(a){a.key==="Escape"&&(document.body.removeChild(n),document.removeEventListener("keydown",o))})}async function le(t){confirm("Are you sure you want to delete this word?")&&(await s.deleteWord(t),await c(),d())}async function ce(t){t.preventDefault();const e=k.value.trim(),n=B.value.trim(),o=L.value.trim();if(!e){alert("Please enter a word");return}if(i.some(R=>R.word.toLowerCase()===e.toLowerCase())){alert("This word already exists in your vocabulary!");return}const h=E.createManualEntry(e,n,o?[o]:[]);await s.saveWord(h)?(alert(`"${e}" added successfully!`),x.reset(),await c()):alert("Failed to add word. Please try again.")}async function de(){const t=k.value.trim();if(!t){alert("Please enter a word first");return}u.textContent="Fetching...",u.disabled=!0;try{const e=await E.fetchWordData(t);e?(B.value=e.meaning,L.value=e.examples[0]||"",alert("Word data fetched successfully!")):alert("Word not found in dictionary. You can still add it manually.")}catch{alert("Failed to fetch word data. Please try again.")}finally{u.textContent="Auto-fetch from Dictionary",u.disabled=!1}}async function ue(){const t=await s.exportVocabulary(),e=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(e),o=document.createElement("a");o.href=n,o.download=`vocabulary-${Date.now()}.json`,o.click(),URL.revokeObjectURL(n),alert("Vocabulary exported successfully!")}async function me(t){const e=t.target.files[0];if(e){try{const n=await e.text();await s.importVocabulary(n)?(alert("Vocabulary imported successfully!"),await c(),d()):alert("Failed to import vocabulary. Please check the file format.")}catch{alert("Error reading file. Please try again.")}p.value=""}}async function ve(){if(confirm(`⚠️ WARNING: This will reset ALL SRS progress for every word in your vocabulary!

• All words will be marked as "new" again
• Review intervals will be reset to 1 day
• Ease factors will be reset to default
• This action cannot be undone

Are you sure you want to continue?`))try{await s.resetProgress()?(alert("All SRS progress has been reset successfully!"),await c(),d(),y()):alert("Failed to reset progress. Please try again.")}catch{alert("Error resetting progress. Please try again.")}}console.log("Vocabulary Note popup loaded");
