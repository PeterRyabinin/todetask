const readlineSync = require('readline-sync');

// Установка кодировки для Windows
if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec('chcp 65001', (err) => {
        if (err) console.log('Error setting encoding:', err);
    });
}

class Hero {
    constructor(name, XP, uron) {
        this.name = name;
        this.XP = XP;
        this.uron = uron;
    }

    get_sick(damage) {
        this.XP -= damage;
        if (this.XP < 0) this.XP = 0;
    }

    attack(target) {
        const damage = this.uron;
        console.log(`${this.name} ударил ${target.name}`);
        target.get_sick(damage);
        console.log(`${target.name} получил урон: ${damage}. Осталось XP: ${target.XP}`);
    }
}

let heroes = {};

function createHero() {
    const name = readlineSync.question('Введите имя персонажа: ');
    
    if (heroes[name]) {
        console.log('Персонаж с таким именем уже существует!');
        return;
    }

    const XP = parseInt(readlineSync.question('Введите XP: '));
    const uron = parseInt(readlineSync.question('Введите урон: '));

    heroes[name] = new Hero(name, XP, uron);
    console.log(`Персонаж ${name} создан!`);
}

function modifyHero() {
    if (Object.keys(heroes).length === 0) {
        console.log('Нет созданных персонажей!');
        return;
    }

    console.log('Доступные персонажи:', Object.keys(heroes).join(', '));
    const name = readlineSync.question('Введите имя персонажа для изменения: ');

    if (!heroes[name]) {
        console.log('Персонаж не найден!');
        return;
    }

    console.log(`Текущие значения ${name}: XP=${heroes[name].XP}, урон=${heroes[name].uron}`);
    
    const newXP = readlineSync.question(`Введите новое XP (текущее: ${heroes[name].XP}): `);
    const newUron = readlineSync.question(`Введите новый урон (текущий: ${heroes[name].uron}): `);

    if (newXP) heroes[name].XP = parseInt(newXP);
    if (newUron) heroes[name].uron = parseInt(newUron);

    console.log(`Значения обновлены: XP=${heroes[name].XP}, урон=${heroes[name].uron}`);
}

function attackHero() {
    if (Object.keys(heroes).length < 2) {
        console.log('Нужно как минимум 2 персонажа для атаки!');
        return;
    }

    console.log('Доступные персонажи:', Object.keys(heroes).join(', '));
    const attackerName = readlineSync.question('Введите имя атакующего персонажа: ');
    const targetName = readlineSync.question('Введите имя цели: ');

    if (!heroes[attackerName] || !heroes[targetName]) {
        console.log('Один из персонажей не найден!');
        return;
    }

    if (attackerName === targetName) {
        console.log('Персонаж не может атаковать себя!');
        return;
    }

    heroes[attackerName].attack(heroes[targetName]);
}

function showHeroes() {
    if (Object.keys(heroes).length === 0) {
        console.log('Нет созданных персонажей!');
        return;
    }

    console.log('\n=== ТЕКУЩИЕ ПЕРСОНАЖИ ===');
    for (const [name, hero] of Object.entries(heroes)) {
        console.log(`${name}: XP=${hero.XP}, урон=${hero.uron}`);
    }
    console.log('========================\n');
}

function main() {
    console.log('=== СИСТЕМА УПРАВЛЕНИЯ ПЕРСОНАЖАМИ ===');
    
    while (true) {
        console.log('\nДоступные команды:');
        console.log('1 - Создать персонажа');
        console.log('2 - Изменить параметры персонажа');
        console.log('3 - Атаковать персонажа');
        console.log('4 - Показать всех персонажей');
        console.log('0 - Выйти');

        const command = readlineSync.question('\nВыберите команду: ');

        switch (command) {
            case '1':
                createHero();
                break;
            case '2':
                modifyHero();
                break;
            case '3':
                attackHero();
                break;
            case '4':
                showHeroes();
                break;
            case '0':
                console.log('Выход из программы...');
                return;
            default:
                console.log('Неизвестная команда!');
        }
    }
}

main();