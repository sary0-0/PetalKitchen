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
    db.run(`CREATE TABLE IF NOT EXISTS korisnici (id INTEGER PRIMARY KEY AUTOINCREMENT, ime TEXT UNIQUE, sifra TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS favoriti (id INTEGER PRIMARY KEY AUTOINCREMENT, korisnik_id INTEGER, recept_id INTEGER, naslov TEXT, slika TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS shopping_lista (id INTEGER PRIMARY KEY AUTOINCREMENT, korisnik_id INTEGER, namirnica TEXT)`);
});

// REGISTRACIJA
app.post('/api/register', (req, res) => {
    const { ime, sifra } = req.body;
    
    // Provjera dužine šifre na serveru
    if (!sifra || sifra.length < 7) {
        return res.status(400).json({ poruka: "Šifra mora imati najmanje 7 karaktera! 🌸" });
    }

    const query = "INSERT INTO korisnici (ime, sifra) VALUES (?, ?)";
    db.run(query, [ime, sifra], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ poruka: "Ovo ime je već zauzeto! Izaberi drugo." });
            }
            return res.status(500).json({ poruka: "Greška na serveru!" });
        }
        res.json({ poruka: "Uspješna registracija! Sada se možeš prijaviti. ✨" });
    });
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { ime, sifra } = req.body;
    
    db.get("SELECT * FROM korisnici WHERE ime = ? AND sifra = ?", [ime, sifra], (err, row) => {
        if (err) return res.status(500).json({ poruka: "Greška na serveru!" });
        
        if (!row) {
            return res.status(401).json({ poruka: "Pogrešno ime ili šifra! Da li si se registrovala?" });
        }
        
        res.json({ poruka: "Dobrodošla nazad! 🌸", userId: row.id, userName: row.ime });
    });
});

// Dodavanje u favorite i brisanje
app.post('/api/favoriti', (req, res) => {
    const { korisnik_id, recept_id, naslov, slika } = req.body;
    
    const provjeraQuery = "SELECT id FROM favoriti WHERE korisnik_id = ? AND recept_id = ?";
    db.get(provjeraQuery, [korisnik_id, recept_id], (err, row) => {
        if (err) return res.status(500).json({ poruka: "Greška na serveru!" });
        
        if (row) {

            db.run("DELETE FROM favoriti WHERE id = ?", [row.id], function(err) {
                res.json({ poruka: "Uklonjeno iz favorita! 💔" });
            });
        } else {
        
            const insertQuery = "INSERT INTO favoriti (korisnik_id, recept_id, naslov, slika) VALUES (?, ?, ?, ?)";
            db.run(insertQuery, [korisnik_id, recept_id, naslov, slika], function(err) {
                res.json({ poruka: "Sačuvano u favorite! ❤️" });
            });
        }
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

// Brisanje iz shopping liste
app.delete('/api/shopping-lista/:id', (req, res) => {
    const id = req.params.id; 
    db.run("DELETE FROM shopping_lista WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ poruka: "Greška pri brisanju!" });
        res.json({ poruka: "Obrisano!" });
    });
});

// Dohvatanje shopping liste
app.get('/api/shopping-lista/:userId', (req, res) => {
    db.all("SELECT * FROM shopping_lista WHERE korisnik_id = ?", [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ greska: err.message });
        res.json(rows || []);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`🚀 Petal Kitchen server uspješno radi na portu: ${PORT}`);
});