const bcrypt = require('bcrypt');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
initSql.split(/;\s*\n/).forEach(stmt => {
  if (stmt.trim()) db.prepare(stmt).run();
});

(async ()=>{
  const username = 'admin';
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  try{
    const stmt = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)');
    stmt.run(username, hash);
    console.log('Admin user created:', username, 'password:', password);
  }catch(e){
    console.log('Admin already exists or error:', e.message);
  }
})();