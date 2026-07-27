  let isAdmin = false;
  const STORAGE_KEY = "comments_japan";

  // 初期読み込み
  document.addEventListener("DOMContentLoaded", () => {
    renderComments();
  });

  // コメント保存の取得
  function getComments() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // コメント投稿ハンドラ
  document.getElementById("commentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const author = document.getElementById("authorInput").value.trim() || "名無し";
    const content = document.getElementById("contentInput").value.trim();

    if (!content) return;

    const newComment = {
      id: Date.now(),
      author: author,
      content: content,
      date: new Date().toLocaleString("ja-JP")
    };

    const comments = getComments();
    comments.unshift(newComment); // 新しいものを先頭に追加
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));

    // フォームリセット＆再描画
    document.getElementById("contentInput").value = "";
    document.getElementById("authorInput").value = "";
    renderComments();
  });

  // 管理者コードチェック
  function checkAdminCode() {
    const inputCode = document.getElementById("adminCodeInput").value;
    const statusEl = document.getElementById("adminStatus");
    const container = document.querySelector(".container");

    if (inputCode === ADMIN_CODE) {
      isAdmin = true;
      statusEl.textContent = "✔ 管理者認証中";
      container.classList.add("admin-mode");
      document.getElementById("adminCodeInput").value = "";
    } else {
      alert("管理者用コードが正しくありません。");
    }
  }

  // コメント削除機能
  function deleteComment(id) {
    if (!isAdmin) return;
    if (!confirm("このコメントを削除してもよろしいですか？")) return;

    let comments = getComments();
    comments = comments.filter(comment => comment.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    renderComments();
  }

  // コメント一覧の描画
  function renderComments() {
    const comments = getComments();
    const listEl = document.getElementById("commentList");

    if (comments.length === 0) {
      listEl.innerHTML = "<p style='color:#94a3b8; font-size:0.9rem;'>コメントはまだありません。</p>";
      return;
    }

    listEl.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(c.author)}</span>
          <span>${c.date}</span>
        </div>
        <div class="comment-body">${escapeHtml(c.content)}</div>
        <button class="delete-btn" onclick="deleteComment(${c.id})">削除</button>
      </div>
    `).join("");
  }

  // XSS対策（エスケープ処理）
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }
