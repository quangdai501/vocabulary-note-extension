console.log("🔵 Vocabulary Note: Content script loading...");let c="",n=null;document.addEventListener("mouseup",k);document.addEventListener("keyup",k);console.log("🔵 Vocabulary Note: Event listeners attached");chrome.runtime.onMessage.addListener((e,t,a)=>{if(e.action==="saveSelectedWord"){const r=window.getSelection().toString().trim();r&&w(r),a({success:!0})}else e.action==="saveWord"&&(w(e.word),a({success:!0}))});function k(e){if(e&&e.target&&e.target.closest(".Vocabulary-popup"))return;v();const t=window.getSelection(),a=t.toString().trim();if(!a||a.split(/\s+/).length>3){console.log("Skipping - empty or too many words");return}const i=t.getRangeAt(0).getBoundingClientRect();c=a,x(i)}function x(e){n=document.createElement("div"),n.className="Vocabulary-popup";const t=e.top+window.scrollY+e.height+10,a=e.left+window.scrollX+e.width/2;n.style.top=`${t}px`,n.style.left=`${a}px`,n.innerHTML=`
    <div class="Vocabulary-popup-content">
      <div class="Vocabulary-popup-header">
        <div class="Vocabulary-word-display">
          <span class="Vocabulary-word-icon">📚</span>
          <span class="Vocabulary-word-text">${c}</span>
        </div>
      </div>
      <div class="Vocabulary-translation-section">
        <div class="Vocabulary-translation-loading">
          <span class="Vocabulary-spinner"></span>
          <span>Translating...</span>
        </div>
        <div class="Vocabulary-translation-content" style="display: none;">
          <div class="Vocabulary-translation-text"></div>
        </div>
      </div>
      <div class="Vocabulary-popup-actions">
        <button class="Vocabulary-btn Vocabulary-btn-save" title="Save to Vocabulary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Save</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-play" title="Play Pronunciation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
          </svg>
          <span>Pronounce</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-cambridge" title="Open Cambridge Dictionary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 6h7M9 10h7M9 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>Cambridge</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-translate" title="Open Google Translate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 8h6m-6 4h6m4-4h3m-4.5 0L18 3m-3 5l-4.5 13M19 21l-2-5.5M21 16l-2 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Translate</span>
        </button>
        <button class="Vocabulary-btn Vocabulary-btn-youglish" title="See examples on YouGlish">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M8 8l8 4-8 4V8z" fill="currentColor"/>
          </svg>
          <span>Examples</span>
        </button>
      </div>
    </div>
  `,document.body.appendChild(n),M(c);const r=n.querySelector(".Vocabulary-btn-save"),i=n.querySelector(".Vocabulary-btn-play"),d=n.querySelector(".Vocabulary-btn-cambridge"),s=n.querySelector(".Vocabulary-btn-translate"),u=n.querySelector(".Vocabulary-btn-youglish");r?(r.onmouseenter=()=>console.log("🔵 Mouse entered Save button"),r.onmouseleave=()=>console.log("🔵 Mouse left Save button"),r.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation()},!0),r.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation(),console.log("✅ Save button clicked for word:",c),w(c)},!0)):console.error("❌ Save button not found!"),i?(i.onmouseenter=()=>console.log("🔵 Mouse entered Play button"),i.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation()},!0),i.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation(),console.log("✅ Play button clicked for word:",c),S(c)},!0)):console.error("❌ Play button not found!"),u?(u.onmouseenter=()=>console.log("🔵 Mouse entered YouGlish button"),u.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation()},!0),u.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation(),console.log("✅ YouGlish button clicked for word:",c),L(c)},!0)):console.error("❌ YouGlish button not found!"),d&&(d.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation()},!0),d.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation(),console.log("✅ Cambridge button clicked for word:",c),D(c)},!0)),s&&(s.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation()},!0),s.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation(),console.log("✅ Translate button clicked for word:",c),E(c)},!0)),setTimeout(()=>{document.addEventListener("click",V,!1)},300)}function v(){n&&(n.remove(),n=null,document.removeEventListener("click",V))}function V(e){console.log("🔴 Outside click detected, target:",e.target),n&&!n.contains(e.target)?(console.log("🔴 Removing popup"),v()):console.log("🔴 Click was inside popup, keeping it")}async function w(e){console.log("saveWord function called with:",e);try{p("Loading...","info");const t=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(e)}`);let a;if(t.ok){const s=await t.json();a=C(s,e)}else a=P(e);const i=(await chrome.storage.local.get("vocabulary")).vocabulary||[];if(i.findIndex(s=>s.word.toLowerCase()===e.toLowerCase())!==-1){p("Word already exists!","warning"),v();return}i.push({...a,id:I(),createdAt:Date.now(),updatedAt:Date.now()}),await chrome.storage.local.set({vocabulary:i}),p(`"${e}" saved successfully!`,"success"),v()}catch(t){console.error("Error saving word:",t),console.error("Error details:",t.message,t.stack),p("Failed to save word: "+t.message,"error")}}function C(e,t){const a=e[0],r=a.phonetics||[],i=a.meanings||[];let d="";for(const l of r)if(l.text){d=l.text;break}let s="";for(const l of r)if(l.audio){s=l.audio;break}let u="",o=[];if(i.length>0){const l=i[0];if(l.definitions&&l.definitions.length>0){const b=l.definitions[0];u=`(${l.partOfSpeech}) ${b.definition}`;for(let g=0;g<Math.min(3,l.definitions.length);g++){const y=l.definitions[g];y.example&&o.push(y.example)}}}return o.length===0&&(o=["No example available"]),{word:a.word||t,meaning:u,examples:o,ipa:d,audioUrl:s,youglishLink:`https://youglish.com/pronounce/${encodeURIComponent(t)}/english`,interval:0,repetition:0,easeFactor:2.5,nextReview:null,lastReview:null}}function P(e){return{word:e,meaning:"User-defined word",examples:["No example available"],ipa:"",audioUrl:"",youglishLink:`https://youglish.com/pronounce/${encodeURIComponent(e)}/english`,interval:0,repetition:0,easeFactor:2.5,nextReview:null,lastReview:null,isManual:!0}}function S(e){console.log("playPronunciation called for:",e);try{const t=new SpeechSynthesisUtterance(e);t.lang="en-US",t.rate=.9,speechSynthesis.speak(t),console.log("Pronunciation started"),p("Playing pronunciation...","info")}catch(t){console.error("Error playing pronunciation:",t),p("Failed to play pronunciation","error")}}function L(e){console.log("openYouGlish called for:",e);try{const t=`https://youglish.com/pronounce/${encodeURIComponent(e)}/english/us`;console.log("Opening URL:",t),window.open(t,"_blank"),v()}catch(t){console.error("Error opening YouGlish:",t),p("Failed to open YouGlish","error")}}function D(e){console.log("openCambridge called for:",e);try{const t=`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(e)}`;console.log("Opening URL:",t),window.open(t,"_blank"),v()}catch(t){console.error("Error opening Cambridge:",t),p("Failed to open Cambridge Dictionary","error")}}function E(e){console.log("openGoogleTranslate called for:",e);try{const t=`https://translate.google.com/?hl=vi&sl=en&tl=vi&text=${encodeURIComponent(e)}&op=translate`;console.log("Opening URL:",t),window.open(t,"_blank"),v()}catch(t){console.error("Error opening Google Translate:",t),p("Failed to open Google Translate","error")}}async function M(e){var u,o,l,b;const t=n==null?void 0:n.querySelector(".Vocabulary-translation-loading"),a=n==null?void 0:n.querySelector(".Vocabulary-translation-content"),r=n==null?void 0:n.querySelector(".Vocabulary-translation-text");if(!t||!a||!r)return;let i=null,d=null,s=null;try{const[g,y]=await Promise.all([fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(e)}`),fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(e)}&langpair=en|vi`)]);if(g.ok){const m=(await g.json())[0],f=(u=m==null?void 0:m.meanings)==null?void 0:u[0];i=(l=(o=f==null?void 0:f.definitions)==null?void 0:o[0])==null?void 0:l.definition,s=f==null?void 0:f.partOfSpeech}if(y.ok){const h=await y.json();(b=h.responseData)!=null&&b.translatedText&&(d=h.responseData.translatedText)}if(i||d){t.style.display="none",a.style.display="block";let h="";i&&(h+=`
          <div class="Vocabulary-translation-item">
            <div class="Vocabulary-translation-label">🇬🇧 ${s?`(${s})`:"English"}:</div>
            <div class="Vocabulary-translation-result">${i}</div>
          </div>
        `),d&&(h+=`
          <div class="Vocabulary-translation-item">
            <div class="Vocabulary-translation-label">🇻🇳 Tiếng Việt:</div>
            <div class="Vocabulary-translation-result">${d}</div>
          </div>
        `),r.innerHTML=h}else throw new Error("No translation or definition found")}catch(g){console.error("Translation error:",g),t.style.display="none",a.style.display="block",r.innerHTML=`
      <div class="Vocabulary-translation-info">
        Click Save to see full definition
      </div>
    `}}function p(e,t="info"){console.log("showNotification:",e,t);const a=document.querySelector(".Vocabulary-notification");a&&a.remove();const r=document.createElement("div");r.className=`Vocabulary-notification Vocabulary-notification-${t}`,r.textContent=e,document.body.appendChild(r),setTimeout(()=>{r.classList.add("Vocabulary-notification-hide"),setTimeout(()=>r.remove(),300)},3e3)}function I(){return`word_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}console.log("Vocabulary Note content script loaded");
