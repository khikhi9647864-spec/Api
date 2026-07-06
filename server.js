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

// --- PHÂN LOẠI NHÓM THỜI GIAN XÓA LINK (đơn vị: phút) ---
const time10m = [
    "full_moon", "nearmoon", "daobian", "kitsune", "prehistoric", 
    "rip", "doughv2", "doughv1", "nearcake", "mebeo", 
    "reaper", "tyrant", "elite", "darkbeard", "captain"
];
const time8m = ["shizu", "oroshi", "saishi"];

// CƠ CHẾ TỰ ĐỘNG XÓA: Quét mỗi 10 giây để xóa Link/JobId hết hạn
setInterval(() => {
    const now = Date.now();
    for (const eventName in serverData) {
        let expireMinutes = 4;
        if (time10m.includes(eventName)) expireMinutes = 10;
        else if (time8m.includes(eventName)) expireMinutes = 8;
        
        const expireMs = expireMinutes * 60 * 1000;
        serverData[eventName] = serverData[eventName].filter(s => (now - s.timestamp) < expireMs);
        if (serverData[eventName].length === 0) {
            delete serverData[eventName];
        }
    }
}, 10000);

// =========================================================================
// CỔNG NHẬN DỮ LIỆU TỪ SCRIPT LUA ROBLOX (GIỮ NGUYÊN 100%)
// =========================================================================
app.post('/push', (req, res) => {
    const { job, sea, boss, players } = req.body;
    
    if (!job || !sea || !boss) {
        return res.status(400).send("Thiếu dữ liệu");
    }

    const placeId = placeIds[sea] || 2753915549; 
    const joinLink = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${job}`;
    
    // Gộp nhóm Elite
    let eventName = boss.toLowerCase();
    if (eventName === "diablo" || eventName === "deandre" || eventName === "urban") {
        eventName = "elite";
    }

    if (!serverData[eventName]) {
        serverData[eventName] = [];
    }

    // Kiểm tra chống trùng lặp JobId
    const isExist = serverData[eventName].find(s => s.job === job);
    if (!isExist) {
        // 1. Lưu dữ liệu từ script Lua gửi về vào hệ thống
        serverData[eventName].push({
            job: job,
            players: players,
            link: joinLink,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        });

        // =========================================================================
        // 2. TỰ ĐỘNG BẮN NGAY LẬP TỨC SANG WEB APIFULLMOON-1
        // (Khi có JobId mới ở cột full_moon hoặc các cột khác, tự động forward ngay)
        // =========================================================================
        const targetUrl = 'https://apifullmoon-1.onrender.com/push';
        
        // Kiểm tra để tránh web tự bắn vào chính nó nếu code này đang chạy trực tiếp trên apifullmoon-1
        const currentHost = req.headers['x-forwarded-host'] || req.headers['host'] || '';
        if (!currentHost.includes('apifullmoon-1.onrender.com')) {
            if (typeof fetch === "function") {
                // Bắn nguyên gói dữ liệu (job, sea, boss, players) sang web kia ngay lập tức
                fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job, sea, boss, players })
                }).catch(err => {
                    console.log(`[Lỗi khi tự động bắn sang ${targetUrl}]:`, err.message);
                });
            }
        }
    }

    // Trả lời về cho script Lua là đã nhận thành công
    res.status(200).send("Thành công");
});

// Giao diện Web hiển thị
app.get('/', (req, res) => {
    const order = [
        { id: "full_moon", name: "1. Full Moon (Trăng Rằm)" },
        { id: "nearmoon", name: "2. Near Moon (Sắp Trăng Rằm)" },
        { id: "daobian", name: "3. Mirage Island (Đảo Bí Ẩn)" },
        { id: "kitsune", name: "4. Kitsune Island (Đảo Hồ Ly)" },
        { id: "prehistoric", name: "5. Prehistoric Island" },
        { id: "rip", name: "6. Rip Indra" },
        { id: "doughv2", name: "7. Dough King" },
        { id: "doughv1", name: "8. Cake Prince (Đã xuất hiện)" },
        { id: "nearcake", name: "9. Sắp có Cake Prince (<= 50 quái)" },
        { id: "mebeo", name: "10. Cake Queen" },
        { id: "reaper", name: "11. Soul Reaper" },
        { id: "tyrant", name: "12. Tyrant of the Skies" },
        { id: "elite", name: "13. Quái Elite (Chung)" }, 
        { id: "darkbeard", name: "14. Darkbeard (Râu Đen)" },
        { id: "captain", name: "15. Cursed Captain" },
        { id: "shizu", name: "16. Truyền Thuyết: Kiếm Shizu" },
        { id: "oroshi", name: "17. Truyền Thuyết: Kiếm Oroshi" },
        { id: "saishi", name: "18. Truyền Thuyết: Kiếm Saishi" }
    ];

    let html = `<html lang="vi"><head>
                <meta charset="UTF-8">
                <meta http-equiv="refresh" content="5">
                <title>Hệ Thống Quét Server</title>
                <style>
                    body { font-family: monospace; background: #ffffff; color: #111111; padding: 20px; }
                    h2 { color: #000000; border-bottom: 2px solid #222222; padding-bottom: 10px; text-transform: uppercase; margin-bottom: 5px; }
                    .author { font-weight: bold; color: #555555; margin-bottom: 25px; font-size: 13px; text-transform: uppercase; }
                    h3 { color: #0056b3; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; font-size: 14px; }
                    .item { margin-bottom: 8px; padding: 10px; background: #f8f9fa; border: 1px solid #e9ecef; border-left: 4px solid #d9534f; }
                    a { color: #d9534f; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; color: #000000; }
                    .empty { color: #999999; font-style: italic; font-size: 13px; }
                </style></head><body>`;
    
    html += `<h2>HỆ THỐNG QUÉT SERVER BLOX FRUITS</h2>`;
    html += `<div class="author">BY TRAN DUY KHANH | Web tự động làm mới mỗi 5s</div>`;

    order.forEach(category => {
        html += `<h3>${category.name}</h3>`;
        const servers = serverData[category.id];
        
        let expireText = 4;
        if (time10m.includes(category.id)) expireText = 10;
        else if (time8m.includes(category.id)) expireText = 8;

        if (servers && servers.length > 0) {
            servers.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Số người: <b>${s.players}/12</b> | 
                    <a href="${s.link}">JOIN SERVER</a> 
                    <br>JobId: <span style="color:#666;">${s.job}</span>
                </div>`;
            });
        } else {
            html += `<div class="empty">Trống (Hoặc đã hết hạn ${expireText} phút)...</div>`;
        }
    });

    html += `<h3>19. TRÁI ÁC QUỶ & SỰ KIỆN KHÁC</h3>`;
    let hasOther = false;
    for (const [key, value] of Object.entries(serverData)) {
        if (!order.find(o => o.id === key) && value.length > 0) {
            hasOther = true;
            html += `<div style="margin-top: 10px; font-weight: bold;">- Tên Vật Phẩm: ${key.toUpperCase()}</div>`;
            value.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Số người: <b>${s.players}/12</b> | <a href="${s.link}">JOIN SERVER</a>
                </div>`;
            });
        }
    }
    
    if (!hasOther) {
        html += `<div class="empty">Chưa có dữ liệu (Hoặc đã hết hạn 4 phút)...</div>`;
    }

    html += `</body></html>`;
    res.send(html);
});

// API hỗ trợ lấy nhanh JobID cho Script
app.get('/api/getjobs', (req, res) => {
    const targetId = req.query.id; 
    if (!targetId || !serverData[targetId]) {
        return res.type('text/plain').send(""); 
    }
    const jobList = serverData[targetId].map(s => s.job).join("\n");
    res.type('text/plain').send(jobList);
});

// API hỗ trợ lấy ngay Link Join mới nhất cho Script
app.get('/api/getlink', (req, res) => {
    const targetId = req.query.id;
    if (!targetId || !serverData[targetId] || serverData[targetId].length === 0) {
        return res.type('text/plain').send("");
    }
    const latestServer = serverData[targetId][serverData[targetId].length - 1];
    res.type('text/plain').send(latestServer.link);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hệ thống đang hoạt động ổn định trên cổng ${PORT}`);
});
            
