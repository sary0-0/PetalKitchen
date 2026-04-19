const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./baza.db', (err) => { if 
    (err) console.error("Greška sa bazom:", err.message); 
    console.log("✅ Povezano na SQLite bazu!"); });

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS korisnici (id INTEGER PRIMARY KEY AUTOINCREMENT, ime TEXT, sifra TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS favoriti (id INTEGER PRIMARY KEY AUTOINCREMENT, korisnik_id INTEGER, recept_id INTEGER, naslov TEXT, slika TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS shopping_lista (id INTEGER PRIMARY KEY AUTOINCREMENT, korisnik_id INTEGER, namirnica TEXT)`);
});

app.post('/api/prijava', (req, res) => {
    const { ime, sifra } = req.body;
    db.get("SELECT id FROM korisnici WHERE ime = ?", [ime], (err, row) => {
        if (row) { res.json({ idKorisnika: row.id }); } 
        else {
            db.run("INSERT INTO korisnici (ime, sifra) VALUES (?, ?)", [ime, sifra], function() {
                res.json({ idKorisnika: this.lastID });
            });
        }
    });
});

app.post('/api/favoriti', (req, res) => {
    const { korisnik_id, recept_id, naslov, slika } = req.body;
    db.run("INSERT INTO favoriti (korisnik_id, recept_id, naslov, slika) VALUES (?, ?, ?, ?)", 
    [korisnik_id, recept_id, naslov, slika], function(err) {
        if (err) return res.status(500).json({ poruka: "Greška!" });
        res.json({ poruka: "Sačuvano u favorite! ❤️" });
    });
});

app.get('/api/favoriti/:userId', (req, res) => {
    db.all("SELECT recept_id as id, naslov as title, slika as image FROM favoriti WHERE korisnik_id = ?", [req.params.userId], (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/shopping-lista', (req, res) => {
    const { korisnik_id, namirnica } = req.body;
    db.run("INSERT INTO shopping_lista (korisnik_id, namirnica) VALUES (?, ?)", [korisnik_id, namirnica], function(err) {
        if (err) return res.status(500).json({ poruka: "Greška!" });
        res.json({ poruka: "Sastojak dodat! 🛒" });
    });
});

app.get('/api/shopping-lista/:userId', (req, res) => {
    db.all("SELECT * FROM shopping_lista WHERE korisnik_id = ?", [req.params.userId], (err, rows) => {
        res.json(rows || []);
    });
});

app.listen(port, () => console.log(`🚀 Server uspješno radi na http://localhost:${port}`));