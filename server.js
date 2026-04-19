const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path'); 

const app = express();

// DINAMIČKI PORT: Render će dodijeliti svoj port, a lokalno koristimo 3000
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// VAŽNO ZA DEPLOYMENT: Govorimo serveru da su HTML, CSS i JS u istom folderu
app.use(express.static(path.join(__dirname, './')));

// Povezivanje na bazu podataka
const db = new sqlite3.Database('./baza.db', (err) => { 
    if (err) {
        console.error("Greška sa bazom:", err.message);
    } else {
        console.log("✅ Povezano na SQLite bazu!");
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS korisnici (id INTEGER PRIMARY KEY AUTOINCREMENT, ime TEXT, sifra TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS favoriti (id INTEGER PRIMARY KEY AUTOINCREMENT, korisnik_id INTEGER, recept_id INTEGER, naslov TEXT, slika TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS shopping_lista (id INTEGER PRIMARY KEY AUTOINCREMENT, korisnik_id INTEGER, namirnica TEXT)`);
});

// Prijava i registracija korisnika
app.post('/api/prijava', (req, res) => {
    const { ime, sifra } = req.body;
    db.get("SELECT id FROM korisnici WHERE ime = ?", [ime], (err, row) => {
        if (row) { 
            res.json({ idKorisnika: row.id }); 
        } else {
            db.run("INSERT INTO korisnici (ime, sifra) VALUES (?, ?)", [ime, sifra], function(err) {
                if (err) return res.status(500).json({ greska: err.message });
                res.json({ idKorisnika: this.lastID });
            });
        }
    });
});

// Dodavanje u favorite
app.post('/api/favoriti', (req, res) => {
    const { korisnik_id, recept_id, naslov, slika } = req.body;
    const query = "INSERT INTO favoriti (korisnik_id, recept_id, naslov, slika) VALUES (?, ?, ?, ?)";
    db.run(query, [korisnik_id, recept_id, naslov, slika], function(err) {
        if (err) return res.status(500).json({ poruka: "Greška pri čuvanju!" });
        res.json({ poruka: "Sačuvano u favorite! ❤️" });
    });
});

// Dohvatanje favorita za određenog korisnika
app.get('/api/favoriti/:userId', (req, res) => {
    db.all("SELECT recept_id as id, naslov as title, slika as image FROM favoriti WHERE korisnik_id = ?", [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ greska: err.message });
        res.json(rows || []);
    });
});

// Dodavanje na shopping listu
app.post('/api/shopping-lista', (req, res) => {
    const { korisnik_id, namirnica } = req.body;
    db.run("INSERT INTO shopping_lista (korisnik_id, namirnica) VALUES (?, ?)", [korisnik_id, namirnica], function(err) {
        if (err) return res.status(500).json({ poruka: "Greška pri dodavanju!" });
        res.json({ poruka: "Sastojak dodat! 🛒" });
    });
});

// Dohvatanje shopping liste
app.get('/api/shopping-lista/:userId', (req, res) => {
    db.all("SELECT * FROM shopping_lista WHERE korisnik_id = ?", [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ greska: err.message });
        res.json(rows || []);
    });
});

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`🚀 Petal Kitchen server uspješno radi na portu: ${PORT}`);
});