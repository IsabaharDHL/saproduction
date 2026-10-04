import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, firebaseReady } from "./firebase-config.js";

const publish = data => window.dispatchEvent(new CustomEvent("sa:content", {detail:data}));
const failed = error => { console.error("تعذر تحميل بيانات الموقع من Firebase",error); window.dispatchEvent(new CustomEvent("sa:content-error")); };
if (firebaseReady()) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const images = new Map();
  let revision = 0;
  async function resolveImage(value) {
    if (typeof value !== "string" || !value.startsWith("firestore-image:")) return value;
    if (!images.has(value)) {
      images.set(value,getDoc(doc(db,"siteImages",value.slice(16))).then(image => image.exists() ? image.data().dataUrl : "").catch(error => {images.delete(value);throw error;}));
    }
    return images.get(value);
  }
  async function resolvedContent(source) {
    const data = structuredClone(source);
    await Promise.all([
      resolveImage(data.bannerImage).then(value => {data.bannerImage=value;}),
      ...(data.artists||[]).map(async item => {item.image=await resolveImage(item.image);}),
      ...(data.offers||[]).map(async item => {item.image=await resolveImage(item.image);})
    ]);
    return data;
  }
  onSnapshot(doc(db,"sites","main"),async snapshot => {
    const current = ++revision;
    if (!snapshot.exists()) {publish({});return;}
    try {const data=await resolvedContent(snapshot.data());if(current===revision) publish(data);}
    catch(error) {if(current===revision) failed(error);}
  },failed);
} else {failed(new Error("Firebase configuration is missing"));}
