import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, firebaseReady } from "./firebase-config.js";

if (firebaseReady()) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  async function resolveImage(value) {
    if (typeof value !== "string" || !value.startsWith("firestore-image:")) return value;
    const image = await getDoc(doc(db,"siteImages",value.slice(16)));
    return image.exists() ? image.data().dataUrl : "";
  }
  async function resolvedContent(source) {
    const data = structuredClone(source);
    data.bannerImage = await resolveImage(data.bannerImage);
    await Promise.all((data.artists||[]).map(async item => { item.image=await resolveImage(item.image); }));
    await Promise.all((data.offers||[]).map(async item => { item.image=await resolveImage(item.image); }));
    return data;
  }
  onSnapshot(doc(db, "sites", "main"), async snapshot => {
    if (snapshot.exists()) {
      window.dispatchEvent(new CustomEvent("sa:content", {detail: await resolvedContent(snapshot.data())}));
    }
  }, error => {
    console.error("تعذر تحميل بيانات الموقع من Firebase", error);
  });
}
