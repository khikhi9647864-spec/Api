const express = require('express');
const app = express();
app.use(express.json());

// Nơi lưu trữ dữ liệu các server được gửi về
let serverData = {};

// PlaceID của Blox Fruits theo từng Sea
const placeIds = {
    1: 2753915549,
    2: 4442272183,
    3: 7449423635
};

app.post('/push', (req, res) => {
    const { job, sea, boss, players } = req.body;
    
    if (!job || !sea || !boss) {
        return res.status(400).send("Thiếu dữ liệu");
    }

    const placeId = placeIds[sea] || 2753915549; 
    const joinLink = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${job}`;
    const eventName = boss.toLowerCase();

    if (!serverData[eventName]) {
        serverData[eventName] = [];
    }

    const isExist = serverData[eventName].find(s => s.job === job);
    if (!isExist) {
        if (serverData[eventName].length > 20) serverData[eventName].shift();
        
        serverData[eventName].push({
            job: job,
            players: players,
            link: joinLink,
            time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        });
    }

    res.status(200).send("Thành công");
});

app.get('/', (req, res) => {
    // Đã liệt kê full 100% các ID từ script Lua
    const order = [
        // --- THIÊN NHIÊN & ĐẢO ---
        { id: "full_moon", name: "1. Full Moon (Trăng Rằm)" },
        { id: "nearmoon", name: "2. Near Moon (Sắp Trăng Rằm)" },
        { id: "daobian", name: "3. Mirage Island (Đảo Bí Ẩn)" },
        { id: "kitsune", name: "4. Kitsune Island (Đảo Hồ Ly)" },
        { id: "prehistoric", name: "5. Prehistoric Island" },
        
        // --- BOSS & SỰ KIỆN SEA 3 ---
        { id: "rip", name: "6. Rip Indra" },
        { id: "doughv2", name: "7. Dough King" },
        { id: "doughv1", name: "8. Cake Prince (Đã xuất hiện)" },
        { id: "nearcake", name: "9. Sắp có Cake Prince (<= 50 quái)" },
        { id: "mebeo", name: "10. Cake Queen" },
        { id: "reaper", name: "11. Soul Reaper" },
        { id: "tyrant", name: "12. Tyrant of the Skies" },
        
        // --- ELITE SEA 3 ---
        { id: "elite", name: "13. Quái Elite (Chung)" },
        { id: "diablo", name: "14. Elite: Diablo" },
        { id: "deandre", name: "15. Elite: Deandre" },
        { id: "urban", name: "16. Elite: Urban" },
        
        // --- BOSS & SỰ KIỆN SEA 2 ---
        { id: "darkbeard", name: "17. Darkbeard (Râu Đen)" },
        { id: "captain", name: "18. Cursed Captain" },
        
        // --- VŨ KHÍ ---
        { id: "shizu", name: "19. Truyền Thuyết: Kiếm Shizu" },
        { id: "oroshi", name: "20. Truyền Thuyết: Kiếm Oroshi" },
        { id: "saishi", name: "21. Truyền Thuyết: Kiếm Saishi" }
    ];

    let html = `<html lang="vi"><head><meta charset="UTF-8"><title>Danh sách Server KAITER</title>
                <style>
                    body { font-family: monospace; background: #121212; color: #fff; padding: 20px; }
                    h2 { color: #ffffff; border-bottom: 2px solid #555; padding-bottom: 10px; text-transform: uppercase; }
                    h3 { color: #00ffcc; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; font-size: 14px; }
                    .item { margin-bottom: 8px; padding: 8px; background: #1e1e1e; border-left: 3px solid #ff5555; }
                    a { color: #ff5555; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; color: #ffffff; }
                    .empty { color: #666; font-style: italic; }
                </style></head><body>`;
    
    html += `<h2>HỆ THỐNG QUÉT SERVER</h2>`;

    order.forEach(category => {
        html += `<h3>${category.name}</h3>`;
        const servers = serverData[category.id];
        
        if (servers && servers.length > 0) {
            servers.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Người chơi: ${s.players}/12 | 
                    <a href="${s.link}">JOIN SERVER</a> 
                    <br>JobId: <i>${s.job}</i>
                </div>`;
            });
        } else {
            html += `<div class="empty">Trống...</div>`;
        }
    });

    // Phần này sẽ tự động bắt tất cả các loại Trái Ác Quỷ (Fruits) rơi ra trên map
    html += `<h3>22. TRÁI ÁC QUỶ & SỰ KIỆN KHÁC</h3>`;
    let hasOther = false;
    for (const [key, value] of Object.entries(serverData)) {
        if (!order.find(o => o.id === key) && value.length > 0) {
            hasOther = true;
            html += `<b>- [${key.toUpperCase()}]</b><br>`;
            value.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Người chơi: ${s.players}/12 | <a href="${s.link}">JOIN SERVER</a>
                </div>`;
            });
        }
    }
    
    if (!hasOther) {
        html += `<div class="empty">Chưa quét được trái ác quỷ nào...</div>`;
    }

    html += `</body></html>`;
    res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web đang chạy tại cổng ${PORT}`);
});
                   
