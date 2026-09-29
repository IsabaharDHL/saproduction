// ضع إعدادات تطبيق الويب من Firebase هنا مرة واحدة فقط.
// هذه البيانات عامة بطبيعتها، والحماية الفعلية موجودة في Firebase Rules.
export const firebaseConfig = {
  apiKey: "AIzaSyA8cT_DpytE82h7YkxALAXMXJQXJKBEZdo",
  authDomain: "sa-production-1a836.firebaseapp.com",
  projectId: "sa-production-1a836",
  storageBucket: "sa-production-1a836.firebasestorage.app",
  messagingSenderId: "567898142833",
  appId: "1:567898142833:web:0eba11fab13b68623a43d0"
};

// بريد مالك لوحة التحكم. لا يظهر في شاشة الدخول.
export const ADMIN_EMAIL = "admin@sa-production.app";

export const firebaseReady = () =>
  firebaseConfig.apiKey !== "REPLACE_ME" &&
  firebaseConfig.projectId !== "REPLACE_ME" &&
  ADMIN_EMAIL !== "REPLACE_ME";
