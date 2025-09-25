const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = '1111';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Хеш для пароля "1111":', hashedPassword);
}

generateHash();