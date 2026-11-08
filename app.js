// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBu9MxolEz-oRP0vLNSBB-u1CtveWhx3Rs",
    authDomain: "informer-1d97c.firebaseapp.com",
    projectId: "informer-1d97c",
    storageBucket: "informer-1d97c.firebasestorage.app",
    messagingSenderId: "197697367836",
    appId: "1:197697367836:web:22c248c4b40750bf1454d9"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Глобальные переменные
let currentUser = null;
let selectedUser = null;
let messagesUnsubscribe = null;

// Звуки через Web Audio API
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'message') {
            // Звук получения сообщения (более высокий тон)
            oscillator.frequency.value = 880;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } else if (type === 'send') {
            // Звук отправки (более низкий тон)
            oscillator.frequency.value = 660;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    } catch (e) {
        console.log('Звук не поддерживается');
    }
}

// Показать форму регистрации
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('auth-error').textContent = '';
}

// Показать форму входа
function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('auth-error').textContent = '';
}

// Регистрация
async function register() {
    const nickname = document.getElementById('reg-nickname').value.trim();
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    const errorDiv = document.getElementById('auth-error');
    
    if (!nickname || !password || !passwordConfirm) {
        errorDiv.textContent = 'Заполните все поля';
        return;
    }
    
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Пароли не совпадают';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Пароль должен быть минимум 6 символов';
        return;
    }
    
    if (nickname.length < 3) {
        errorDiv.textContent = 'Никнейм должен быть минимум 3 символа';
        return;
    }
    
    try {
        // Проверяем, существует ли пользователь с таким никнеймом
        const usersSnapshot = await db.collection('users')
            .where('nickname', '==', nickname)
            .get();
        
        if (!usersSnapshot.empty) {
            errorDiv.textContent = 'Этот никнейм уже занят';
            return;
        }
        
        // Создаем email из никнейма
        const email = nickname.toLowerCase().replace(/[^a-z0-9]/g, '') + '@messenger.local';
        
        // Создаем аккаунт
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Сохраняем информацию о пользователе
        await db.collection('users').doc(userCredential.user.uid).set({
            nickname: nickname,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        errorDiv.textContent = '';
        alert('Аккаунт успешно создан! Теперь войдите.');
        showLogin();
        
    } catch (error) {
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

// Вход
async function login() {
    const nickname = document.getElementById('login-nickname').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    if (!nickname || !password) {
        errorDiv.textContent = 'Заполните все поля';
        return;
    }
    
    try {
        const email = nickname.toLowerCase().replace(/[^a-z0-9]/g, '') + '@messenger.local';
        await auth.signInWithEmailAndPassword(email, password);
        errorDiv.textContent = '';
    } catch (error) {
        errorDiv.textContent = getErrorMessage(error.code);
    }
}

// Обработка ошибок аутентификации
function getErrorMessage(errorCode) {
    switch(errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Неверный никнейм или пароль';
        case 'auth/email-already-in-use':
            return 'Этот никнейм уже занят';
        case 'auth/weak-password':
            return 'Пароль слишком слабый (минимум 6 символов)';
        case 'auth/invalid-email':
            return 'Некорректный никнейм';
        default:
            return 'Произошла ошибка. Попробуйте снова.';
    }
}

// Выход
function logout() {
    auth.signOut();
}

// Слушатель состояния аутентификации
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Пользователь вошел в систему
        currentUser = user;
        
        // Получаем информацию о пользователе
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        // Показываем основной экран
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'block';
        document.getElementById('current-user-name').textContent = userData.nickname;
        
        // Загружаем данные
        loadUsers();
        setupRealtimeMessages();
        
    } else {
        // Пользователь вышел
        currentUser = null;
        selectedUser = null;
        
        // Показываем экран авторизации
        document.getElementById('auth-screen').style.display = 'block';
        document.getElementById('main-screen').style.display = 'none';
        
        // Очищаем чат
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }
        
        document.getElementById('messages-container').innerHTML = '';
        document.getElementById('chat-header').textContent = 'Выберите пользователя';
    }
});

// Загрузка списка пользователей
async function loadUsers() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '<div style="padding:15px;color:#999;">Загрузка...</div>';
    
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        usersList.innerHTML = '';
        
        let userCount = 0;
        
        snapshot.forEach(doc => {
            // Не показываем текущего пользователя в списке
            if (doc.id !== currentUser.uid) {
                const userData = doc.data();
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.dataset.userId = doc.id;
                userDiv.innerHTML = `<div class="user-name">${escapeHtml(userData.nickname)}</div>`;
                userDiv.onclick = () => selectUser(doc.id, userData.nickname);
                usersList.appendChild(userDiv);
                userCount++;
            }
        });
        
        if (userCount === 0) {
            usersList.innerHTML = '<div style="padding:15px;color:#999;">Пока нет других пользователей</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        usersList.innerHTML = '<div style="padding:15px;color:red;">Ошибка загрузки</div>';
    }
}

// Выбор пользователя для чата
function selectUser(userId, userName) {
    selectedUser = userId;
    
    // Обновляем активный элемент в списке
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-user-id="${userId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Обновляем заголовок чата
    document.getElementById('chat-header').textContent = userName;
    
    // Загружаем сообщения
    loadMessages(userId);
}

// Загрузка сообщений в реальном времени
function loadMessages(otherUserId) {
    // Отписываемся от предыдущей подписки
    if (messagesUnsubscribe) {
        messagesUnsubscribe();
    }
    
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    
    // Подписываемся на сообщения между текущим пользователем и выбранным
    messagesUnsubscribe = db.collection('messages')
        .where('participants', 'array-contains', currentUser.uid)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            messagesContainer.innerHTML = '';
            
            snapshot.forEach(doc => {
                const message = doc.data();
                
                // Показываем только сообщения с выбранным пользователем
                const isRelevantMessage = 
                    (message.senderId === currentUser.uid && message.receiverId === otherUserId) ||
                    (message.senderId === otherUserId && message.receiverId === currentUser.uid);
                
                if (isRelevantMessage) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
                    
                    // Форматируем время
                    let timeStr = '';
                    if (message.timestamp) {
                        const date = message.timestamp.toDate();
                        timeStr = date.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                    
                    messageDiv.innerHTML = `
                        <div>${escapeHtml(message.text)}</div>
                        <div class="message-time">${timeStr}</div>
                    `;
                    
                    messagesContainer.appendChild(messageDiv);
                }
            });
            
            // Прокручиваем вниз
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, error => {
            console.error('Ошибка загрузки сообщений:', error);
        });
}

// Отправка сообщения
async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) {
        return;
    }
    
    if (!selectedUser) {
        alert('Сначала выберите пользователя для общения');
        return;
    }
    
    try {
        // Добавляем сообщение в базу
        await db.collection('messages').add({
            senderId: currentUser.uid,
            receiverId: selectedUser,
            participants: [currentUser.uid, selectedUser],
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        // Очищаем поле ввода
        input.value = '';
        
        // Воспроизводим звук отправки
        playSound('send');
        
        // Прокручиваем вниз
        const container = document.getElementById('messages-container');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        alert('Не удалось отправить сообщение. Попробуйте снова.');
    }
}

// Обработка нажатия Enter в поле ввода
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Настройка уведомлений о новых сообщениях
function setupRealtimeMessages() {
    db.collection('messages')
        .where('receiverId', '==', currentUser.uid)
        .where('read', '==', false)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    // Воспроизводим звук при получении нового сообщения
                    playSound('message');
                    
                    // Показываем браузерное уведомление
                    const message = change.doc.data();
                    showBrowserNotification(message);
                }
            });
        });
}

// Показ браузерного уведомления
function showBrowserNotification(message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            // Получаем имя отправителя
            db.collection('users').doc(message.senderId).get().then(doc => {
                if (doc.exists) {
                    const senderData = doc.data();
                    new Notification(`Новое сообщение от ${senderData.nickname}`, {
                        body: message.text.substring(0, 100),
                        icon: '/icon.png'
                    });
                }
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showBrowserNotification(message);
                }
            });
        }
    }
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Запрашиваем разрешение на уведомления при загрузке
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
