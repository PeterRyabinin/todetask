<?php
session_start();
session_destroy(); // Завершение сессии
header("Location: index.php"); // Перенаправление на страницу входа
exit();
?>
