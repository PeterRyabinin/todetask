<?php
session_start();

$filename = 'users.json';

// Проверка, существует ли файл, если нет, создаем пустой массив
if (!file_exists($filename)) {
    file_put_contents($filename, json_encode([]));
}

// Чтение данных пользователей из JSON-файла
$users = json_decode(file_get_contents($filename), true);

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['register'])) {
        // Регистрация
        $username = $_POST['username'];
        $password = $_POST['password'];

        // Проверка на существование пользователя
        if (isset($users[$username])) {
            $error = "Пользователь с таким именем уже существует.";
        } else {
            // Сохранение пользователя (в реальном приложении храним хэш пароля)
            $users[$username] = password_hash($password, PASSWORD_DEFAULT);
			print_r($users);
            file_put_contents($filename, json_encode($users));
            $success = "Регистрация успешна!";
        }
    } elseif (isset($_POST['login'])) {
        // Вход
        $username = $_POST['username'];
        $password = $_POST['password'];

        // Проверка пользователя
        if (isset($users[$username]) && password_verify($password, $users[$username])) {
            $_SESSION['username'] = $username;
            header("Location: welcome.php"); // Перенаправление на страницу приветствия
            exit();
        } else {
            $error = "Неверное имя пользователя или пароль.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Регистрация и Вход</title>
</head>
<body>

    <h1>Регистрация</h1>
    <form method="POST">
        <input type="text" name="username" placeholder="Имя пользователя" required>
        <input type="password" name="password" placeholder="Пароль" required>
        <button type="submit" name="register">Зарегистрироваться</button>
    </form>
    <?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>
    <?php if (isset($success)) echo "<p style='color:green;'>$success</p>"; ?>

    <h1>Вход</h1>
    <form method="POST">
        <input type="text" name="username" placeholder="Имя пользователя" required>
        <input type="password" name="password" placeholder="Пароль" required>
        <button type="submit" name="login">Войти</button>
    </form>
    <?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>
</body>
</html>
