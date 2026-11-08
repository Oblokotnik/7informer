const firebaseConfig = {
  apiKey: "AIzaSyBu9MxolEz-oRP0vLNSBB-u1CtveWhx3Rs",
  authDomain: "informer-1d97c.firebaseapp.com",
  projectId: "informer-1d97c",
  storageBucket: "informer-1d97c.firebasestorage.app",
  messagingSenderId: "197697367836",
  appId: "1:197697367836:web:22c248c4b40750bf1454d9"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentGroupId = null;
let groupUnsub = null;
let chatUnsub = null;

const GROUPS_DATA = [
    {id: 'sport', name: 'Спорт и здоровье'},
    {id: 'games', name: 'Видеоигры'},
    {id: 'code', name: 'Программирование'},
    {id: 'money', name: 'Деньги и бизнес'},
    {id: 'music', name: 'Музыка'},
    {id: 'movies', name: 'Кино'},
    {id: 'cars', name: 'Автомобили'},
    {id: 'travel', name: 'Путешествия'},
    {id: 'science', name: 'Наука'},
    {id: 'art', name: 'Искусство'},
    {id: 'politics', name: 'Политика'},
    {id: 'memes', name: 'Юмор и мемы'}
];

function toggleAuth(view) {
    document.getElementById('login-view').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('reg-view').style.display = view === 'reg' ? 'block' : 'none';
    document.getElementById('auth-msg').textContent = '';
}

async function doRegister() {
    const nick = document.getElementById('r-nick').value.trim();
    const pass = document.getElementById('r-pass').value;
    const pass2 = document.getElementById('r-pass2').value;
    const msg = document.getElementById('auth-msg');
    
    if(nick.length < 3 || pass.length < 6) { msg.textContent = 'Ник > 3 симв, Пароль > 6 симв'; return; }
    if(pass !== pass2) { msg.textContent = 'Пароли не совпадают'; return; }
    
    try {
        const email = nick.toLowerCase().replace(/[^a-z0-9]/g, '') + '@7informer.local';
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(cred.user.uid).set({
            nickname: nick,
            bio: '',
            interests: '',
            groups: [],
            isAdmin: nick.toLowerCase() === 'admin',
            banned: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Аккаунт создан! Войдите.');
        toggleAuth('login');
    } catch(e) { msg.textContent = e.message; }
}

async function doLogin() {
    const nick = document.getElementById('l-nick').value.trim();
    const pass = document.getElementById('l-pass').value;
    const msg = document.getElementById('auth-msg');
    
    try {
        const email = nick.toLowerCase().replace(/[^a-z0-9]/g, '') + '@7informer.local';
        const cred = await auth.signInWithEmailAndPassword(email, pass);
        const uDoc = await db.collection('users').doc(cred.user.uid).get();
        if(uDoc.exists && uDoc.data().banned) {
            await auth.signOut();
            msg.textContent = 'Вы забанены администрацией.';
            return;
        }
    } catch(e) { msg.textContent = 'Ошибка входа: ' + e.message; }
}

auth.onAuthStateChanged(async (user) => {
    if(user) {
        const doc = await db.collection('users').doc(user.uid).get();
        if(!doc.exists || doc.data().banned) { auth.signOut(); return; }
        
        currentUser = { uid: user.uid, ...doc.data() };
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        document.getElementById('user-display-name').textContent = currentUser.nickname;
        
        if(currentUser.isAdmin) document.getElementById('admin-link').style.display = 'block';
        nav('feed');
    } else {
        currentUser = null;
        document.getElementById('auth-screen').style.display = 'block';
        document.getElementById('app-screen').style.display = 'none';
        cleanupListeners();
    }
});

function nav(page) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    cleanupListeners();
    
    if(page === 'feed') {
        document.getElementById('view-feed').style.display = 'block';
        loadFeed();
    } else if(page === 'groups') {
        document.getElementById('view-groups').style.display = 'block';
        loadGroupsList();
    } else if(page === 'profile') {
        document.getElementById('view-profile').style.display = 'block';
        document.getElementById('p-nick').textContent = currentUser.nickname;
        document.getElementById('p-bio').value = currentUser.bio || '';
        document.getElementById('p-interests').value = currentUser.interests || '';
    } else if(page === 'admin' && currentUser.isAdmin) {
        document.getElementById('view-admin').style.display = 'block';
        loadAdminPanel();
    }
}

function cleanupListeners() {
    if(groupUnsub) { groupUnsub(); groupUnsub = null; }
    if(chatUnsub) { chatUnsub(); chatUnsub = null; }
}

async function createPost() {
    const txt = document.getElementById('new-post-text').value.trim();
    if(!txt) return;
    await db.collection('posts').add({
        authorId: currentUser.uid,
        authorName: currentUser.nickname,
        text: txt,
        groupId: null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('new-post-text').value = '';
}

function loadFeed() {
    db.collection('posts').where('groupId', '==', null)
      .orderBy('timestamp', 'desc').limit(50)
      .onSnapshot(snap => {
          const list = document.getElementById('feed-list');
          list.innerHTML = '';
          snap.forEach(doc => renderPost(doc, list, true));
      });
}

function renderPost(doc, container, isGlobal) {
    const p = doc.data();
    const div = document.createElement('div');
    div.className = 'post-item';
    
    let actions = '';
    if(currentUser.isAdmin) {
        actions += `<a href="#" onclick="adminDeletePost('${doc.id}')" style="color:red;">[Удалить]</a> `;
    }
    if(p.authorId === currentUser.uid) {
        actions += `<a href="#" onclick="deleteMyPost('${doc.id}')">[Удалить]</a>`;
    }
    
    div.innerHTML = `
        <div class="post-author">${escapeHtml(p.authorName)} <span class="post-time">${formatTime(p.timestamp)}</span></div>
        <div>${escapeHtml(p.text)}</div>
        <div class="post-actions">${actions}</div>
    `;
    container.appendChild(div);
}

async function deleteMyPost(id) {
    await db.collection('posts').doc(id).delete();
}

async function adminDeletePost(id) {
    if(confirm('Удалить этот пост?')) await db.collection('posts').doc(id).delete();
}

function loadGroupsList() {
    const list = document.getElementById('groups-list');
    list.innerHTML = '';
    document.getElementById('group-count').textContent = currentUser.groups.length;
    
    GROUPS_DATA.forEach(g => {
        const joined = currentUser.groups.includes(g.id);
        const div = document.createElement('div');
        div.className = 'group-card';
        div.innerHTML = `
            <span><b>${g.name}</b></span>
            ${joined 
                ? `<button class="btn-blue" onclick="openGroup('${g.id}', '${g.name}')">Войти</button>` 
                : (currentUser.groups.length < 6 
                    ? `<button class="btn-small" onclick="joinGroup('${g.id}')">Вступить</button>` 
                    : '<span style="color:#999;">Лимит (6)</span>')
            }
        `;
        list.appendChild(div);
    });
}

async function joinGroup(gid) {
    if(currentUser.groups.length >= 6) return alert('Максимум 6 групп');
    await db.collection('users').doc(currentUser.uid).update({
        groups: firebase.firestore.FieldValue.arrayUnion(gid)
    });
    currentUser.groups.push(gid);
    loadGroupsList();
}

function openGroup(gid, gname) {
    currentGroupId = gid;
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById('view-group-detail').style.display = 'block';
    document.getElementById('gd-title').textContent = gname;
    
    loadGroupMembers();
    loadGroupPosts();
    loadGroupChat();
}

function loadGroupMembers() {
    db.collection('users').where('groups', 'array-contains', currentGroupId)
      .onSnapshot(snap => {
          const names = [];
          snap.forEach(d => names.push(d.data().nickname));
          document.getElementById('gd-members').textContent = names.join(', ');
      });
}

function loadGroupPosts() {
    db.collection('posts').where('groupId', '==', currentGroupId)
      .orderBy('timestamp', 'desc').limit(30)
      .onSnapshot(snap => {
          const list = document.getElementById('group-posts-list');
          list.innerHTML = '';
          snap.forEach(doc => renderPost(doc, list, false));
      });
}

async function createGroupPost() {
    const txt = document.getElementById('group-post-text').value.trim();
    if(!txt) return;
    await db.collection('posts').add({
        authorId: currentUser.uid,
        authorName: currentUser.nickname,
        text: txt,
        groupId: currentGroupId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('group-post-text').value = '';
}

function loadGroupChat() {
    const box = document.getElementById('group-chat-box');
    chatUnsub = db.collection('group_chats').doc(currentGroupId)
        .collection('messages').orderBy('timestamp', 'asc').limit(100)
        .onSnapshot(snap => {
            box.innerHTML = '';
            snap.forEach(d => {
                const m = d.data();
                const div = document.createElement('div');
                div.className = 'chat-msg';
                div.innerHTML = `<span class="chat-sender">${escapeHtml(m.senderName)}:</span> ${escapeHtml(m.text)}`;
                box.appendChild(div);
            });
            box.scrollTop = box.scrollHeight;
        });
}

async function sendGroupMsg() {
    const inp = document.getElementById('group-chat-input');
    const txt = inp.value.trim();
    if(!txt) return;
    await db.collection('group_chats').doc(currentGroupId)
        .collection('messages').add({
            senderId: currentUser.uid,
            senderName: currentUser.nickname,
            text: txt,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    inp.value = '';
}

async function leaveCurrentGroup() {
    await db.collection('users').doc(currentUser.uid).update({
        groups: firebase.firestore.FieldValue.arrayRemove(currentGroupId)
    });
    currentUser.groups = currentUser.groups.filter(g => g !== currentGroupId);
    nav('groups');
}

async function saveProfile() {
    const bio = document.getElementById('p-bio').value;
    const ints = document.getElementById('p-interests').value;
    await db.collection('users').doc(currentUser.uid).update({ bio, interests });
    alert('Профиль сохранен');
}

function loadAdminPanel() {
    db.collection('users').onSnapshot(snap => {
        const ul = document.getElementById('admin-users-list');
        ul.innerHTML = '<table class="form-table" style="width:100%"></table>';
        const table = ul.querySelector('table');
        
        snap.forEach(d => {
            const u = d.data();
            if(u.nickname === 'Admin') return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(u.nickname)}</td>
                <td>${u.banned ? '<span style="color:red">Забанен</span>' : 'Активен'}</td>
                <td>
                    ${u.banned 
                        ? `<button class="btn-small" onclick="adminToggleBan('${d.id}', false)">Разбанить</button>` 
                        : `<button class="btn-small" onclick="adminToggleBan('${d.id}', true)">Бан</button>`
                    }
                </td>
            `;
            table.appendChild(tr);
        });
    });
    
    db.collection('posts').orderBy('timestamp', 'desc').limit(20).onSnapshot(snap => {
        const list = document.getElementById('admin-posts-list');
        list.innerHTML = '';
        snap.forEach(doc => renderPost(doc, list, true));
    });
}

async function adminToggleBan(uid, banStatus) {
    await db.collection('users').doc(uid).update({ banned: banStatus });
}

function searchUsers() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const res = document.getElementById('search-results');
    if(q.length < 2) { res.innerHTML = ''; return; }
    
    db.collection('users').where('nickname', '>=', q).where('nickname', '<=', q+'\uf8ff').limit(5)
      .get().then(snap => {
          res.innerHTML = '';
          snap.forEach(d => {
              const u = d.data();
              if(d.id === currentUser.uid) return;
              const div = document.createElement('div');
              div.style.padding = '3px';
              div.style.borderBottom = '1px solid #eee';
              div.textContent = u.nickname;
              res.appendChild(div);
          });
      });
}

function escapeHtml(text) {
    if(!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(ts) {
    if(!ts) return '';
    const d = ts.toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

function doLogout() { auth.signOut(); }
