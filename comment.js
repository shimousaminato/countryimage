  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
  import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    deleteDoc, 
    doc, 
    serverTimestamp 
  } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
  import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged 
  } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBcCZWsvL7dmtAvVnZHRE5SWlXKTRvowu8",
    authDomain: "countryimage-1afba.firebaseapp.com",
    projectId: "countryimage-1afba",
    storageBucket: "countryimage-1afba.firebasestorage.app",
    messagingSenderId: "652765088648",
    appId: "1:652765088648:web:fc61c79710784ef23a883d",
    measurementId: "G-H7HC152SDT"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
// ページ側で設定された ID (korea, japan など) を取得し、なければ null にする
const countryId = window.COUNTRY_ID || "null";

// ページごとのコレクション（comments_korea や comments_japan）を参照する
const commentsRef = collection(db, `comments_${countryId}`);

  let currentUser = null;

  // ログイン状態の監視
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const container = document.querySelector(".container");
    const statusEl = document.getElementById("adminStatus");
    const formEl = document.getElementById("adminLoginForm");

    if (user) {
      container.classList.add("admin-logged-in");
      statusEl.textContent = "✔ 管理者としてログイン中 (" + user.email + ")";
      formEl.style.display = "none";
    } else {
      container.classList.remove("admin-logged-in");
      statusEl.textContent = "";
      formEl.style.display = "flex";
    }
  });

  // 管理者ログイン処理
  document.getElementById("adminLoginBtn").addEventListener("click", async () => {
    const email = document.getElementById("adminEmail").value;
    const pass = document.getElementById("adminPass").value;

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      document.getElementById("adminEmail").value = "";
      document.getElementById("adminPass").value = "";
    } catch (err) {
      alert("ログインに失敗しました: " + err.message);
    }
  });

  // コメントのリアルタイム取得
  const q = query(commentsRef, orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const listEl = document.getElementById("commentList");
    if (snapshot.empty) {
      listEl.innerHTML = "<p style='color:#94a3b8; font-size:0.9rem;'>コメントはまだありません。</p>";
      return;
    }

    listEl.innerHTML = "";
// docs の配列を取得して全体の件数を把握
const total = snapshot.docs.length;

snapshot.docs.forEach((docSnapshot, index) => {
  const data = docSnapshot.data();
  const id = docSnapshot.id;
  const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString("ja-JP") : "送信中...";
  const adminClass = data.isAdmin ? "admin-author" : "";

  // ★ 新しい順（降順）で取得している場合、古い順に1, 2, 3...と番号を振る計算
  const commentNo = total - index;

  const item = document.createElement("div");
  item.className = "comment-item";
  item.innerHTML = `
    <div class="comment-header">
      <span class="comment-number">#${commentNo}</span> <!-- ★ 番号を表示 -->
      <span class="comment-author ${adminClass}">${escapeHtml(data.author || "名無し")}</span>
      <span>${dateStr}</span>
    </div>
    <div class="comment-body">${escapeHtml(data.content)}</div>
    <button class="delete-btn" data-id="${id}">削除</button>
  `;
  listEl.appendChild(item);
});

    // 削除ボタンイベント
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        if (!currentUser) return;
        const docId = e.target.getAttribute("data-id");
        if (confirm("このコメントを削除しますか？")) {
          try {
// 修正後
await deleteDoc(doc(db, `comments_${countryId}`, docId));
          } catch (err) {
            alert("削除に失敗しました: " + err.message);
          }
        }
      });
    });
  });

  // コメント投稿
  document.getElementById("commentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const author = document.getElementById("authorInput").value.trim();
    const content = document.getElementById("contentInput").value.trim();

    if (!content) return;

try {
  await addDoc(commentsRef, {
    author: author || "名無し",
    content: content,
    createdAt: serverTimestamp(),
    isAdmin: currentUser ? true : false
  });
      document.getElementById("contentInput").value = "";
      document.getElementById("authorInput").value = "";
    } catch (err) {
      alert("投稿に失敗しました: " + err.message);
    }
  });

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
