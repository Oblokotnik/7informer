<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>7informer</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="auth-screen">
        <div class="auth-box">
            <h1 class="logo-text">[ 7informer ]</h1>
            <div id="login-view">
                <table class="form-table">
                    <tr><td>Никнейм:</td><td><input type="text" id="l-nick"></td></tr>
                    <tr><td>Пароль:</td><td><input type="password" id="l-pass"></td></tr>
                    <tr><td colspan="2"><button onclick="doLogin()" class="btn-blue">Войти</button></td></tr>
                </table>
                <p class="small-link" onclick="toggleAuth('reg')">Нет аккаунта? Регистрация</p>
            </div>
            <div id="reg-view" style="display:none;">
                <table class="form-table">
                    <tr><td>Никнейм:</td><td><input type="text" id="r-nick"></td></tr>
                    <tr><td>Пароль:</td><td><input type="password" id="r-pass"></td></tr>
                    <tr><td>Повтор:</td><td><input type="password" id="r-pass2"></td></tr>
                    <tr><td colspan="2"><button onclick="doRegister()" class="btn-blue">Создать</button></td></tr>
                </table>
                <p class="small-link" onclick="toggleAuth('login')">Уже есть аккаунт? Войти</p>
            </div>
            <div id="auth-msg" class="error-text"></div>
        </div>
    </div>

    <div id="app-screen" style="display:none;">
        <div class="top-bar">
            <div class="top-logo">[ 7informer ]</div>
            <div class="top-nav">
                <a href="#" onclick="nav('feed')">Лента</a> | 
                <a href="#" onclick="nav('groups')">Группы</a> | 
                <a href="#" onclick="nav('profile')">Профиль</a> | 
                <span id="user-display-name"></span> (<a href="#" onclick="doLogout()">выйти</a>)
            </div>
        </div>

        <div class="container">
            <div class="left-col">
                <div class="box-header">Меню</div>
                <div class="box-content">
                    <ul class="side-menu">
                        <li><a href="#" onclick="nav('feed')">Общая лента</a></li>
                        <li><a href="#" onclick="nav('groups')">Мои группы</a></li>
                        <li><a href="#" onclick="nav('profile')">Мой профиль</a></li>
                        <li id="admin-link" style="display:none;"><a href="#" onclick="nav('admin')" style="color:red;">Админка</a></li>
                    </ul>
                </div>
                
                <div class="box-header" style="margin-top:10px;">Быстрый поиск</div>
                <div class="box-content">
                    <input type="text" id="search-input" placeholder="Поиск людей..." onkeyup="searchUsers()">
                    <div id="search-results"></div>
                </div>
            </div>

            <div class="right-col">
                <div id="view-feed" class="view-section">
                    <div class="box-header">Общая лента новостей</div>
                    <div class="box-content">
                        <textarea id="new-post-text" rows="3" style="width:100%; border:1px solid #ccc;"></textarea>
                        <button onclick="createPost()" class="btn-blue" style="margin-top:5px;">Опубликовать</button>
                        <div id="feed-list" style="margin-top:15px;"></div>
                    </div>
                </div>

                <div id="view-groups" class="view-section" style="display:none;">
                    <div class="box-header">Группы по интересам</div>
                    <div class="box-content">
                        <p class="small-text">Вы состоите в <span id="group-count">0</span>/6 группах.</p>
                        <div id="groups-list"></div>
                    </div>
                </div>

                <div id="view-group-detail" class="view-section" style="display:none;">
                    <div class="box-header" id="gd-title">Название группы</div>
                    <div class="box-content">
                        <div style="background:#f7f7f7; padding:5px; border-bottom:1px solid #ddd; margin-bottom:10px;">
                            <b>Участники:</b> <span id="gd-members"></span> | 
                            <button onclick="leaveCurrentGroup()" class="btn-small">Покинуть группу</button>
                        </div>
                        
                        <div style="border:1px solid #ccc; padding:10px; margin-bottom:15px; background:#fff;">
                            <h4>Чат группы</h4>
                            <div id="group-chat-box" style="height:200px; overflow-y:auto; border:1px solid #eee; padding:5px; background:#fafafa; margin-bottom:5px;"></div>
                            <input type="text" id="group-chat-input" style="width:70%;" placeholder="Сообщение...">
                            <button onclick="sendGroupMsg()" class="btn-blue">Отпр.</button>
                        </div>

                        <div style="border:1px solid #ccc; padding:10px; background:#fff;">
                            <h4>Стена группы</h4>
                            <textarea id="group-post-text" rows="2" style="width:100%; border:1px solid #ccc;"></textarea>
                            <button onclick="createGroupPost()" class="btn-blue" style="margin-top:5px;">Написать на стене</button>
                            <div id="group-posts-list" style="margin-top:10px;"></div>
                        </div>
                    </div>
                </div>

                <div id="view-profile" class="view-section" style="display:none;">
                    <div class="box-header">Редактирование профиля</div>
                    <div class="box-content">
                        <table class="form-table">
                            <tr><td width="100">Никнейм:</td><td><b id="p-nick"></b> (нельзя изменить)</td></tr>
                            <tr><td>О себе:</td><td><textarea id="p-bio" rows="3" style="width:100%;"></textarea></td></tr>
                            <tr><td>Интересы:</td><td><input type="text" id="p-interests" style="width:100%;"></td></tr>
                            <tr><td colspan="2"><button onclick="saveProfile()" class="btn-blue">Сохранить</button></td></tr>
                        </table>
                    </div>
                </div>

                <div id="view-admin" class="view-section" style="display:none;">
                    <div class="box-header" style="background:#800000; color:white;">Панель Администратора</div>
                    <div class="box-content">
                        <h3>Управление пользователями</h3>
                        <div id="admin-users-list"></div>
                        <hr>
                        <h3>Все посты в системе</h3>
                        <div id="admin-posts-list"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="app.js"></script>
</body>
</html>
