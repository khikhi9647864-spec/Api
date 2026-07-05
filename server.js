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

// Hệ thống quét và tự động xóa các link đã tồn tại quá 5 phút
setInterval(() => {
    const now = Date.now();
    for (const event in serverData) {
        // Chỉ giữ lại những server có thời gian tạo trong vòng 5 phút (300,000 ms)
        serverData[event] = serverData[event].filter(s => now - s.timestamp < 300000);
    }
}, 60000); // Mỗi 1 phút sẽ chạy kiểm tra một lần

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
        // Đã gỡ bỏ giới hạn 20 server, sức chứa hiện tại là vô tận
        serverData[eventName].push({
            job: job,
            players: players,
            link: joinLink,
            time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            timestamp: Date.now() // Đánh dấu mốc thời gian để xóa sau 5 phút
        });
    }

    res.status(200).send("Thành công");
});

app.get('/', (req, res) => {
    // Đã tinh chỉnh lại danh sách, gộp Elite
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
        { id: "elite", name: "13. Quái Elite (Chung)" }, // Gộp chung Diablo, Deandre, Urban
        
        // --- BOSS & SỰ KIỆN SEA 2 ---
        { id: "darkbeard", name: "14. Darkbeard (Râu Đen)" },
        { id: "captain", name: "15. Cursed Captain" },
        
        // --- VŨ KHÍ ---
        { id: "shizu", name: "16. Truyền Thuyết: Kiếm Shizu" },
        { id: "oroshi", name: "17. Truyền Thuyết: Kiếm Oroshi" },
        { id: "saishi", name: "18. Truyền Thuyết: Kiếm Saishi" }
    ];

    // Giao diện đã được chuyển sang màu trắng tối giản
    let html = `<html lang="vi"><head><meta charset="UTF-8">
                <title>Danh sách Server KAITER X HUD</title>
                <meta http-equiv="refresh" content="5">
                <style>
                    body { font-family: monospace; background: #ffffff; color: #000000; padding: 20px; margin: 0; }
                    h2 { color: #000000; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; }
                    h3 { color: #0055ff; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; font-size: 14px; }
                    .header-info { font-size: 15px; font-weight: bold; padding: 10px; background: #f0f0f0; border-left: 4px solid #000; margin-bottom: 20px; }
                    .item { margin-bottom: 8px; padding: 10px; background: #f9f9f9; border-left: 3px solid #0055ff; border-radius: 2px; }
                    a { color: #0055ff; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; color: #ff0000; }
                    .empty { color: #888; font-style: italic; }
                </style></head><body>`;
    
    html += `<h2>HỆ THỐNG QUÉT SERVER</h2>`;
    html += `<div class="header-info">Người chạy web: TRAN DUY KHANH | Trạng thái: Đang hoạt động 24/7 (Cập nhật tự động)</div>`;

    order.forEach(category => {
        html += `<h3>${category.name}</h3>`;
        const servers = serverData[category.id];
        
        if (servers && servers.length > 0) {
            servers.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Người chơi: <b>${s.players}/12</b> | 
                    <a href="${s.link}">JOIN SERVER</a> 
                    <br>JobId: <i>${s.job}</i>
                </div>`;
            });
        } else {
            html += `<div class="empty">Trống...</div>`;
        }
    });

    // Phần bắt tất cả các loại Trái Ác Quỷ (Fruits) và các Event khác
    html += `<h3>19. TRÁI ÁC QUỶ & SỰ KIỆN KHÁC</h3>`;
    let hasOther = false;
    for (const [key, value] of Object.entries(serverData)) {
        if (!order.find(o => o.id === key) && value.length > 0) {
            hasOther = true;
            html += `<b>- [${key.toUpperCase()}]</b><br>`;
            value.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Người chơi: <b>${s.players}/12</b> | <a href="${s.link}">JOIN SERVER</a>
                    <br>JobId: <i>${s.job}</i>
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
    console.log(\`Web đang chạy tại cổng \${PORT}\`);
});
