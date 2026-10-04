import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL, firebaseReady } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
let draft = clone(SA_I18N.defaults), pending = new Map(), auth, db;

function mergeData(source = {}) {
  const value = {...clone(SA_I18N.defaults), ...source};
  value.artists = Array.isArray(value.artists) ? value.artists : clone(SA_I18N.defaults.artists);
  value.offers = Array.isArray(value.offers) ? value.offers : clone(SA_I18N.defaults.offers);
  return value;
}
function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function showStatus(message, isError = false) {
  $("saveStatus").textContent = message;
  $("saveStatus").classList.toggle("error", isError);
}
function markChanged() { showStatus("عندك تعديلات غير محفوظة."); }
const asDataUrl = blob => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
const loadImage = file => new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};image.onerror=reject;image.src=url;});
async function compressImage(file) {
  const image=await loadImage(file);let scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
  for(let attempt=0;attempt<9;attempt++){
    const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
    const quality=Math.max(.46,.84-attempt*.06);const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",quality));
    if(!blob)throw new Error("تعذر تجهيز الصورة.");const dataUrl=await asDataUrl(blob);if(dataUrl.length<850000)return dataUrl;scale*=.8;
  }
  throw new Error("الصورة كبيرة جدًا حتى بعد الضغط.");
}
async function storeImage(file){const id=crypto.randomUUID(),dataUrl=await compressImage(file);await setDoc(doc(db,"siteImages",id),{dataUrl,updatedAt:serverTimestamp()});return `firestore-image:${id}`;}
async function resolveImage(value){if(typeof value!=="string"||!value.startsWith("firestore-image:"))return value;const snap=await getDoc(doc(db,"siteImages",value.slice(16)));return snap.exists()?snap.data().dataUrl:"";}
function previewMarkup(value,alt,options={}){const classes=`preview${options.focus?" focusPreview":""}${options.detail?" detailPreview":""}`,position=options.position?` style="object-position:${safe(options.position)}"`:"",focusAttr=options.detail?` data-detail-focus-artist="${options.index}"`:(options.focus?` data-focus-artist="${options.index}"`:"");if(!value)return `<img class="${classes} hidden"${focusAttr}${position} alt="${alt}">`;return value.startsWith("firestore-image:")?`<img class="${classes}" data-image-ref="${safe(value)}"${focusAttr}${position} alt="${alt}">`:`<img class="${classes}" src="${safe(value)}"${focusAttr}${position} alt="${alt}">`;}
async function resolvePreviews(root=document){await Promise.all([...root.querySelectorAll("[data-image-ref]")].map(async image=>{image.src=await resolveImage(image.dataset.imageRef);}));}
function pickImage(input, key, preview) {
  const file = input.files?.[0];
  if (!file) return;
  if (!allowedTypes.has(file.type)) { input.value=""; showStatus("نوع الصورة غير مدعوم.",true); return; }
  if (file.size > 8*1024*1024) { input.value=""; showStatus("حجم الصورة أكبر من 8 MB.",true); return; }
  const url=URL.createObjectURL(file);pending.set(key,file);preview.src=url;preview.classList.remove("hidden");markChanged();return url;
}
function readMainFields() {
  draft.whatsapp=$("whatsapp").value.replace(/\D/g,"")||SA_I18N.defaults.whatsapp;
  draft.bannerTitleAr=$("bannerTitleAr").value.trim(); draft.bannerTitleEn=$("bannerTitleEn").value.trim();
  draft.aboutAr=$("aboutAr").value.trim(); draft.aboutEn=$("aboutEn").value.trim();
}
function fillMainFields() {
  $("whatsapp").value=draft.whatsapp||""; $("bannerTitleAr").value=draft.bannerTitleAr||SA_I18N.defaults.bannerTitleAr;
  $("bannerTitleEn").value=draft.bannerTitleEn||SA_I18N.defaults.bannerTitleEn; $("aboutAr").value=draft.aboutAr||""; $("aboutEn").value=draft.aboutEn||"";
  if(draft.bannerImage){$("bannerPreview").classList.remove("hidden");if(draft.bannerImage.startsWith("firestore-image:")){$("bannerPreview").dataset.imageRef=draft.bannerImage;}else{$("bannerPreview").src=draft.bannerImage;}}
}
function renderArtists() {
  $("alist").innerHTML=draft.artists.map((a,i)=>`<div class="item" data-artist="${i}"><div class="head"><b>فنان ${i+1}</b><button class="act danger" data-delete-artist="${i}">حذف</button></div><div class="grid">
  <div class="f"><label>اسم الفنان بالعربي</label><input data-af="ar" value="${safe(a.ar)}"></div><div class="f"><label>Artist name in English</label><input data-af="en" value="${safe(a.en)}"></div>
  <div class="f"><label>النبذة بالعربي</label><textarea data-af="bioAr">${safe(a.bioAr)}</textarea></div><div class="f"><label>Biography in English</label><textarea data-af="bioEn">${safe(a.bioEn)}</textarea></div>
  <div class="f"><label>صورة الفنان</label><input type="file" data-artist-file="${i}" accept="image/jpeg,image/png,image/webp,image/gif"><small>قص البطاقة الخارجية — اضغط على الوجه أو الجزء المهم:</small>${previewMarkup(a.image,"معاينة البطاقة الخارجية",{focus:true,index:i,position:`${a.focusX??50}% ${a.focusY??25}%`})}<small>قص الصورة داخل نافذة الفنان — اضغط لتحديد مكان القص:</small>${previewMarkup(a.image,"معاينة نافذة الفنان",{focus:true,detail:true,index:i,position:`${a.detailFocusX??a.focusX??50}% ${a.detailFocusY??a.focusY??25}%`})}</div></div>
  <div class="videos"><b>فيديوهات الفنان</b>${(a.videos||[]).map((v,j)=>`<div class="vrow"><input data-video="${j}" value="${safe(v)}" placeholder="رابط YouTube"><button class="act danger" data-delete-video="${j}">حذف</button></div>`).join("")}<button class="act" data-add-video="${i}">+ إضافة فيديو YouTube</button></div></div>`).join("");
  resolvePreviews($("alist")).catch(console.error);
}
function renderOffers() {
  $("olist").innerHTML=draft.offers.map((o,i)=>`<div class="item" data-offer="${i}"><div class="head"><b>عرض ${i+1}</b><button class="act danger" data-delete-offer="${i}">حذف</button></div><div class="grid">
  <div class="f"><label>اسم العرض بالعربي</label><input data-of="ar" value="${safe(o.ar)}"></div><div class="f"><label>Offer title in English</label><input data-of="en" value="${safe(o.en)}"></div>
  <div class="f"><label>الوصف بالعربي</label><textarea data-of="descAr">${safe(o.descAr)}</textarea></div><div class="f"><label>Description in English</label><textarea data-of="descEn">${safe(o.descEn)}</textarea></div>
  <div class="f"><label>صورة العرض</label><input type="file" data-offer-file="${i}" accept="image/jpeg,image/png,image/webp,image/gif">${previewMarkup(o.image,"معاينة صورة العرض")}</div></div></div>`).join("");
  resolvePreviews($("olist")).catch(console.error);
}
function renderAll(){fillMainFields();renderArtists();renderOffers();resolvePreviews($("site")).catch(console.error);}

document.querySelectorAll(".tabs button").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".tabs button,.sec").forEach(e=>e.classList.remove("on"));button.classList.add("on");$(button.dataset.id).classList.add("on");}));
document.querySelectorAll("#site input:not([type=file]),#about textarea").forEach(input=>input.addEventListener("input",markChanged));
$("bannerFile").addEventListener("change",event=>pickImage(event.target,"banner",$("bannerPreview")));
$("addArtist").addEventListener("click",()=>{draft.artists.push({ar:"فنان جديد",en:"New Artist",bioAr:"",bioEn:"",image:"",focusX:50,focusY:25,detailFocusX:50,detailFocusY:25,videos:[]});renderArtists();markChanged();});
$("addOffer").addEventListener("click",()=>{draft.offers.push({ar:"عرض جديد",en:"New Offer",descAr:"",descEn:"",image:""});renderOffers();markChanged();});
$("alist").addEventListener("input",event=>{const row=event.target.closest("[data-artist]");if(!row)return;const i=Number(row.dataset.artist);if(event.target.dataset.af)draft.artists[i][event.target.dataset.af]=event.target.value;if(event.target.dataset.video!==undefined)draft.artists[i].videos[Number(event.target.dataset.video)]=event.target.value;markChanged();});
$("alist").addEventListener("change",event=>{if(event.target.dataset.artistFile!==undefined){const row=event.target.closest("[data-artist]"),previews=row.querySelectorAll(".focusPreview"),url=pickImage(event.target,`artist:${event.target.dataset.artistFile}`,previews[0]);if(url)previews.forEach(image=>{image.src=url;image.classList.remove("hidden");});}});
$("alist").addEventListener("click",event=>{const row=event.target.closest("[data-artist]");if(!row)return;const i=Number(row.dataset.artist);if(event.target.dataset.focusArtist!==undefined||event.target.dataset.detailFocusArtist!==undefined){const box=event.target.getBoundingClientRect(),x=Math.round((event.clientX-box.left)/box.width*100),y=Math.round((event.clientY-box.top)/box.height*100),detail=event.target.dataset.detailFocusArtist!==undefined;if(detail){draft.artists[i].detailFocusX=x;draft.artists[i].detailFocusY=y;}else{draft.artists[i].focusX=x;draft.artists[i].focusY=y;}event.target.style.objectPosition=`${x}% ${y}%`;markChanged();return;}if(event.target.dataset.deleteArtist!==undefined&&confirm("حذف الفنان؟")){draft.artists.splice(i,1);pending.clear();renderArtists();markChanged();}if(event.target.dataset.addVideo!==undefined){(draft.artists[i].videos||=[]).push("");renderArtists();markChanged();}if(event.target.dataset.deleteVideo!==undefined){draft.artists[i].videos.splice(Number(event.target.dataset.deleteVideo),1);renderArtists();markChanged();}});
$("olist").addEventListener("input",event=>{const row=event.target.closest("[data-offer]");if(!row)return;if(event.target.dataset.of)draft.offers[Number(row.dataset.offer)][event.target.dataset.of]=event.target.value;markChanged();});
$("olist").addEventListener("change",event=>{if(event.target.dataset.offerFile!==undefined)pickImage(event.target,`offer:${event.target.dataset.offerFile}`,event.target.nextElementSibling);});
$("olist").addEventListener("click",event=>{if(event.target.dataset.deleteOffer!==undefined&&confirm("حذف العرض؟")){draft.offers.splice(Number(event.target.dataset.deleteOffer),1);pending.clear();renderOffers();markChanged();}});

async function uploadPending(){
  for(const [key,file] of pending){const value=await storeImage(file);if(key==="banner")draft.bannerImage=value;else{const [kind,index]=key.split(":");draft[kind==="artist"?"artists":"offers"][Number(index)].image=value;}}
  for(const target of [...draft.artists,...draft.offers]){if(typeof target.image==="string"&&target.image.startsWith("data:image/")){target.image=await storeImage(await (await fetch(target.image)).blob());}}
  if(typeof draft.bannerImage==="string"&&draft.bannerImage.startsWith("data:image/")){draft.bannerImage=await storeImage(await (await fetch(draft.bannerImage)).blob());}
}
$("saveButton").addEventListener("click",async()=>{readMainFields();const button=$("saveButton");button.disabled=true;showStatus("جاري ضغط الصور وحفظ التغييرات...");try{await uploadPending();await setDoc(doc(db,"sites","main"),{...clone(draft),updatedAt:serverTimestamp()});pending.clear();renderAll();showStatus("تم الحفظ والنشر. التغييرات تظهر الآن على كل الأجهزة.");}catch(error){console.error(error);showStatus(error.message||"تعذر الحفظ. لم تُنشر التغييرات، حاول مرة ثانية.",true);}finally{button.disabled=false;}});
$("importOld").addEventListener("click",()=>{try{draft=mergeData(JSON.parse(localStorage.getItem("saData")||"{}"));renderAll();markChanged();$("importOld").classList.add("hidden");}catch{showStatus("تعذر قراءة التعديلات القديمة.",true);}});
$("loginButton").addEventListener("click",async()=>{const button=$("loginButton");button.disabled=true;$("loginStatus").textContent="";try{await signInWithEmailAndPassword(auth,ADMIN_EMAIL,$("loginPassword").value);$("loginPassword").value="";}catch{$("loginStatus").textContent="كلمة المرور غير صحيحة.";}finally{button.disabled=false;}});
$("loginPassword").addEventListener("keydown",event=>{if(event.key==="Enter")$("loginButton").click();});
$("logoutButton").addEventListener("click",()=>signOut(auth));
$("changePassword").addEventListener("click",async()=>{const status=$("passwordStatus"),current=$("currentPassword").value,next=$("newPassword").value,confirmation=$("confirmPassword").value;status.className="";if(next.length<8){status.textContent="كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.";status.className="error";return;}if(next!==confirmation){status.textContent="تأكيد كلمة المرور غير مطابق.";status.className="error";return;}try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(ADMIN_EMAIL,current));await updatePassword(auth.currentUser,next);["currentPassword","newPassword","confirmPassword"].forEach(id=>$(id).value="");status.textContent="تم تغيير كلمة المرور مباشرة.";status.className="status";}catch{status.textContent="تعذر التغيير. تأكد من كلمة المرور الحالية.";status.className="error";}});

if(!firebaseReady()){$("loginButton").disabled=true;$("loginPassword").disabled=true;$("loginStatus").textContent="Firebase غير مربوط بعد. أكمل إعداد firebase-config.js أولًا.";}else{const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);onAuthStateChanged(auth,async user=>{$("loginView").classList.toggle("hidden",!!user);$("adminView").classList.toggle("hidden",!user);if(!user)return;try{const snap=await getDoc(doc(db,"sites","main"));draft=mergeData(snap.exists()?snap.data():{});renderAll();if(localStorage.getItem("saData"))$("importOld").classList.remove("hidden");showStatus(snap.exists()?"البيانات محمّلة من الموقع.":"اضغط حفظ لنشر البيانات الأساسية لأول مرة.");}catch(error){console.error(error);showStatus("دخلت بنجاح، لكن تعذر تحميل البيانات. تحقق من قواعد Firestore.",true);}});}
