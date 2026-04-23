const apiKey = 'c634def915e545ecb7d994b52c4730aa';

let favorites = [];
let shoppingList = [];
let trenutniRecepti = []; 

document.addEventListener("DOMContentLoaded", async () => {
    const savedName = localStorage.getItem("petalUserName");
    const userId = localStorage.getItem("petalUserId"); 
    const loginOverlay = document.getElementById("loginOverlay");
    const userNameDisplay = document.getElementById("userNameDisplay");

    if (savedName && userId) {
        loginOverlay.style.display = "none";
        if (userNameDisplay) userNameDisplay.innerText = "Dobrodošla, " + savedName + " ✨";
        await ucitajFavoriteIzBaze(userId);
        await ucitajShoppingListuIzBaze(userId);
    } else {
        loginOverlay.style.display = "flex";
    }
    getRecipes();
});

async function loginUser() {
    const nameInput = document.getElementById("loginName").value.trim();
    const passInput = document.getElementById("loginPass").value.trim();
    const loginOverlay = document.getElementById("loginOverlay");

    if (nameInput === "" || passInput === "") {
        alert("Molim te unesi i ime i šifru! 🌸");
        return;
    }

    try {
        const response = await fetch('/api/shopping-lista', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ime: nameInput, sifra: passInput })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("petalUserName", nameInput);
            localStorage.setItem("petalUserId", data.idKorisnika);
            location.reload(); 
        }
    } catch (error) {
        alert("Server nije pokrenut!");
    }
}

function logoutUser() {
    localStorage.removeItem("petalUserName");
    localStorage.removeItem("petalUserId");
    location.reload(); 
}

async function ucitajFavoriteIzBaze(userId) {
    try {
        const res = await fetch(`/api/favoriti/${userId}`);
        if(res.ok) favorites = await res.json();
    } catch(e) { console.log("Greška sa favoritima"); }
}

async function ucitajShoppingListuIzBaze(userId) {
    try {
        const res = await fetch(`/api/shopping-lista/${userId}`);
        if(res.ok) shoppingList = await res.json();
    } catch(e) { console.log("Greška sa listom"); }
}

async function toggleFav(id, title, image) {
    const userId = localStorage.getItem("petalUserId");
    if(!userId) return alert("Prijavi se! 🌸");

    try {
        const response = await fetch('/api/favoriti', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ korisnik_id: userId, recept_id: id, naslov: title, slika: image })
        });
        const data = await response.json();

        await ucitajFavoriteIzBaze(userId);
        renderCards(trenutniRecepti); 
    } catch (e) { 
        alert("Greška prilikom dodavanja u favorite!"); 
        console.error(e);
    }
}

async function addToShoppingList(item) {
    const userId = localStorage.getItem("petalUserId");
    if(!userId) return alert("Prijavi se! 🛒");

    try {
        const response = await fetch('/api/shopping-lista', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ korisnik_id: userId, namirnica: item })
        });
        if(response.ok) {
            alert("Dodano u Shopping Listu! 🛒");
            await ucitajShoppingListuIzBaze(userId);
        }
    } catch(e) { alert("Greška!"); }
}

async function showShoppingList() {
    const userId = localStorage.getItem("petalUserId");
    if (!userId) {
        alert("Moraš se prijaviti da bi vidjela svoju Shopping listu! 🛒🌸");
        document.getElementById("loginOverlay").style.display = "flex";
        return; 
    }

    await ucitajShoppingListuIzBaze(userId);
    const grid = document.getElementById('recipeGrid');
    document.getElementById('currentCategory').innerText = "MY SHOPPING LIST 🛒";
    
    // Sređujemo stilove da lista bude fina i široka
    grid.style.display = "block";
    grid.style.columns = "auto";
    
    if(shoppingList.length === 0) {
        grid.innerHTML = "<p>Tvoja lista je prazna. 🌸</p>";
        return;
    }

    grid.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${shoppingList.map((item) => `
                    <li style="border-bottom: 1px dashed #ffe0e6; padding: 15px 10px; display: flex; justify-content: space-between; font-size: 1.1rem; color: #555;">
                        ${item.namirnica} 
                        <i class="fa-solid fa-check" style="color: #ff85a2;"></i>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function showFavorites() {
    const userId = localStorage.getItem("petalUserId");
    if (!userId) {
        alert("Moraš se prijaviti da bi vidjela svoje omiljene recepte! ❤️🌸");
        document.getElementById("loginOverlay").style.display = "flex";
        return; 
    }

    const grid = document.getElementById('recipeGrid');
    document.getElementById('currentCategory').innerText = "MY FAVORITES ❤️";
    if(favorites.length === 0) {
        grid.innerHTML = "<p>Nemaš još favorita! 🌸</p>";
        return;
    }
    renderCards(favorites);
}

async function getRecipes(query = 'healthy', diet = '', type = '', exclude = '') {
    const grid = document.getElementById('recipeGrid');
    grid.innerHTML = "<div class='loader'>Searching... ✨</div>";
    
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&number=12&sort=random`;
    if(query) url += `&query=${query}`;
    if(diet) url += `&diet=${diet}`;
    if(type) url += `&type=${type}`;
    if(exclude) url += `&excludeIngredients=${exclude}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        trenutniRecepti = data.results;
        renderCards(trenutniRecepti);
    } catch (e) { grid.innerHTML = "<p>Greška pri učitavanju. 🎀</p>"; }
}

function renderCards(recipes) {
    const grid = document.getElementById('recipeGrid');
    
    grid.style.display = "grid"; 
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    grid.style.gap = "25px";
    grid.style.alignItems = "stretch"; 
    grid.style.columns = "auto"; 

    if (!recipes || recipes.length === 0) {
        grid.innerHTML = "<p>No results found. 🌸</p>";
        return;
    }

    grid.innerHTML = recipes.map(r => {
        const isFav = favorites.some(fav => fav.id === r.id);
        return `
            <div class="recipe-card" style="height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative;" onclick="openRecipe(${r.id})">
                
                <button class="fav-btn ${isFav ? 'active' : ''}" 
                        style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"
                        onclick="event.stopPropagation(); toggleFav(${r.id}, '${r.title.replace(/'/g, "\\'")}', '${r.image}')">
                    <i class="fa-solid fa-heart" style="color: ${isFav ? '#ff4d6d' : '#ccc'};"></i>
                </button>

                <div style="position: relative; padding-top: 70%; width: 100%;">
                    <img src="${r.image}" alt="${r.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                </div>
                
                <div class="recipe-info" style="padding: 15px; flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; background: white;">
                    <h4 style="margin: 0; font-size: 1rem; color: #444; font-weight: 600;">${r.title}</h4>
                </div>
                
            </div>
        `;
    }).join('');
}

async function openRecipe(id) {
    const modal = document.getElementById('recipeModal');
    const body = document.getElementById('modalBody');
    modal.style.display = "block";
    body.innerHTML = "<p>Učitavam... ✨</p>";

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`);
        const data = await response.json();

        body.innerHTML = `
            <img src="${data.image}" class="recipe-detail-img" style="width: 100%; border-radius: 20px;">
            <h2 style="color:#ff85a2; font-family:'Playfair Display', serif; margin-top: 15px;">${data.title}</h2>
            <div style="margin: 20px 0; display: flex; gap: 20px;">
                <span>⏱️ ${data.readyInMinutes} min</span>
                <span>🍽️ ${data.servings} porcija</span>
            </div>
            
            <h3>Sastojci:</h3>
            <ul class="ingredient-list" style="list-style: none; padding: 0;">
                ${data.extendedIngredients.map(ing => `
                    <li onclick="addToShoppingList('${ing.original.replace(/'/g, "\\'")}')" style="cursor:pointer; padding: 8px 0; border-bottom: 1px dashed #ffd1da;">
                        <i class="fa-solid fa-plus" style="color: #ff85a2; margin-right: 10px;"></i> ${ing.original}
                    </li>
                `).join('')}
            </ul>
            
            <h3 style="margin-top:20px;">Priprema:</h3>
            <p style="line-height: 1.6;">${data.instructions || "Ovaj recept nema tačne korake, ali možeš improvizovati! ✨"}</p>
            
            <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <button id="btn-made-${data.id}" onclick="napravilaSamRecept(${data.id})" 
                        style="background: #ff85a2; color: white; border: none; padding: 15px 30px; border-radius: 30px; font-size: 1.2rem; cursor: pointer; font-weight: bold; box-shadow: 0 5px 15px rgba(255, 133, 162, 0.4); transition: 0.3s;">
                    👩‍🍳 Napravila sam ovo!
                </button>
            </div>
        `;
    } catch (e) { body.innerHTML = "<p>Greška pri učitavanju detalja. 🌸</p>"; }
}

function napravilaSamRecept(id) {
    const btn = document.getElementById(`btn-made-${id}`);
    if (btn) {
        btn.innerHTML = "✅ Ponosni smo na tebe!";
        btn.style.background = "#4CAF50";
        btn.style.boxShadow = "0 5px 15px rgba(76, 175, 80, 0.4)";
        btn.disabled = true; // Gasi dugme
        btn.style.cursor = "default";
    }
}

function filterByDiet(diet) {
    document.getElementById('currentCategory').innerText = diet ? diet.toUpperCase() : "Recommended";
    getRecipes('', diet);
}

function filterByType(type) {
    document.getElementById('currentCategory').innerText = type.toUpperCase() + " SELECTION";
    getRecipes('', '', type);
}

function filterByHalal() {
    document.getElementById('currentCategory').innerText = "HALAL SELECTION";
    const forbidden = "pork,bacon,ham,lard,gelatin,wine,beer,alcohol,vodka,rum,whiskey,champagne,liquor";
    getRecipes('', '', '', forbidden);
}

function mixForMood(mood) {
    let keywords = [];
    let title = '';

    switch(mood) {
        case 'sad': keywords = ['chocolate', 'soup', 'brownie', 'cake']; title = "COMFORT FOOD FOR THE SOUL 🍫"; break;
        case 'lazy': keywords = ['pizza', 'sandwich', 'wrap', 'burger', 'toast']; title = "LAZY DAY BITES 🍕"; break;
        case 'stressed': keywords = ['pasta', 'mac and cheese', 'noodles', 'fries']; title = "CARBS TO THE RESCUE 🍝"; break;
        case 'happy': keywords = ['salad', 'fruit', 'smoothie', 'bowl', 'fresh']; title = "FRESH & ENERGETIC 🍓"; break;
    }
    const randomQuery = keywords[Math.floor(Math.random() * keywords.length)];
    document.getElementById('currentCategory').innerText = title;
    getRecipes(randomQuery); 
}

async function generateWeeklyPlan() {
    const grid = document.getElementById('recipeGrid');
    document.getElementById('currentCategory').innerText = "MY WEEKLY MEAL PLAN 📅";
    
    grid.style.display = "flex";
    grid.style.flexDirection = "column";
    grid.style.gap = "30px";
    grid.style.columns = "auto"; 

    grid.innerHTML = "<div class='loader'>Pravim savršen plan za ovu sedmicu... ✨</div>";

    try {
        const response = await fetch(`https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&timeFrame=week`);
        const data = await response.json();
        
        let html = '';
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
            const dayData = data.week[day];
            html += `
            <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #ffe0e6; width: 100%;">
                <h3 style="color: #ff85a2; text-transform: uppercase; margin-bottom: 20px; font-size: 1.3rem; border-bottom: 2px dashed #ffe0e6; padding-bottom: 10px;">
                    ${day} 🌸
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
            `;
            
            dayData.meals.forEach(meal => {
                html += `
                    <div style="background: #fff0f3; border: 1px solid #ffb3c6; padding: 20px; border-radius: 15px; cursor: pointer; transition: 0.3s; display: flex; flex-direction: column; justify-content: space-between;" 
                         onclick="openRecipe(${meal.id})"
                         onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 15px rgba(255,133,162,0.3)';"
                         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <strong style="color: #444; display: block; margin-bottom: 10px; font-size: 1.05rem; line-height: 1.4;">${meal.title}</strong>
                        <span style="font-size: 0.95rem; color: #ff85a2; font-weight: bold; margin-top: auto;">⏱️ ${meal.readyInMinutes} min</span>
                    </div>
                `;
            });
            html += `</div></div>`;
        });
        grid.innerHTML = html;

    } catch (e) {
        grid.innerHTML = "<p>Ups! Nešto je zapelo sa pravljenjem plana. Pokušaj ponovo! 🎀</p>";
    }
}

function closeModal() { document.getElementById('recipeModal').style.display = "none"; }
window.onclick = (e) => { if (e.target == document.getElementById('recipeModal')) closeModal(); }
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') getRecipes(e.target.value);
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

document.querySelectorAll('.menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('active');
    });
});