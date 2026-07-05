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

// CƠ CHẾ TỰ ĐỘNG XÓA: Cứ mỗi 10 giây, hệ thống tự động quét và xóa bỏ các Link/JobId đã tồn tại quá 5 phút (300000 ms)
setInterval(() => {
    const now = Date.now();
    for (const eventName in serverData) {
        serverData[eventName] = serverData[eventName].filter(s => (now - s.timestamp) < 5 * 60 * 1000);
        if (serverData[eventName].length === 0) {
            delete serverData[eventName];
        }
    }
}, 10000);

app.post('/push', (req, res) => {
    const { job, sea, boss, players } = req.body;
    
    if (!job || !sea || !boss) {
        return res.status(400).send("Thiếu dữ liệu");
    }

    const placeId = placeIds[sea] || 2753915549; 
    const joinLink = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${job}`;
    
    // GỘP ELITE: Nếu tên boss gửi về là diablo, deandre hoặc urban thì tự động gộp chung vào nhóm "elite"
    let eventName = boss.toLowerCase();
    if (eventName === "diablo" || eventName === "deandre" || eventName === "urban") {
        eventName = "elite";
    }

    if (!serverData[eventName]) {
        serverData[eventName] = [];
    }

    // Kiểm tra chống trùng lặp JobId trong danh sách hiện tại
    const isExist = serverData[eventName].find(s => s.job === job);
    if (!isExist) {
        // ĐÃ BỎ GIỚI HẠN SỨC CHỨA: Sức chứa vô tận, nhận liên tục dữ liệu mới và chỉ bị xóa đi khi hết hạn 5 phút
        serverData[eventName].push({
            job: job,
            players: players,
            link: joinLink,
            timestamp: Date.now(), // Lưu mốc thời gian nhận để tính thời gian xóa
            time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        });
    }

    res.status(200).send("Thành công");
});

app.get('/', (req, res) => {
    // Danh sách hiển thị rút gọn tối giản (Đã gộp 3 quái lẻ thành 1 mục Elite duy nhất)
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
        { id: "elite", name: "13. Quái Elite (Chung)" }, // Chỉ hiển thị duy nhất mục Elite tổng hợp này
        { id: "darkbeard", name: "14. Darkbeard (Râu Đen)" },
        { id: "captain", name: "15. Cursed Captain" },
        { id: "shizu", name: "16. Truyền Thuyết: Kiếm Shizu" },
        { id: "oroshi", name: "17. Truyền Thuyết: Kiếm Oroshi" },
        { id: "saishi", name: "18. Truyền Thuyết: Kiếm Saishi" }
    ];

    // GIAO DIỆN TRẮNG: Đã đổi toàn bộ nền sang màu trắng, chữ tối màu rõ ràng và thêm thẻ tự động tải lại trang sau 5 giây
    let html = `<html lang="vi"><head>
                <meta charset="UTF-8">
                <meta http-equiv="refresh" content="5">
                <title>Hệ Thống Quét Server</title>
                <style>
                    body { font-family: monospace; background: #ffffff; color: #111111; padding: 20px; }
                    h2 { color: #000000; border-bottom: 2px solid #222222; padding-bottom: 10px; text-transform: uppercase; margin-bottom: 5px; }
                    .author { font-weight: bold; color: #555555; margin-bottom: 25px; font-size: 13px; text-transform: uppercase; }
                    h3 { color: #0056b3; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; font-size: 14px; }
                    .item { margin-bottom: 8px; padding: 10px; background: #f8f9fa; border-left: 4px solid #d9534f; border-top: 1px solid #e9ecef; border-right: 1px solid #e9ecef; border-bottom: 1px solid #e9ecef; }
                    a { color: #d9534f; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; color: #000000; }
                    .empty { color: #999999; font-style: italic; font-size: 13px; }
                </style></head><body>`;
    
    html += `<h2>HỆ THỐNG QUÉT SERVER BLOX FRUITS</h2>`;
    html += `<div class="author">BY TRAN DUY KHANH | Web tự động làm mới mỗi 5s</div>`;

    order.forEach(category => {
        html += `<h3>${category.name}</h3>`;
        const servers = serverData[category.id];
        
        if (servers && servers.length > 0) {
            servers.forEach(s => {
                html += `<div class="item">
                    [${s.time}] Số người: <b>${s.players}/12</b> | 
                    <a href="${s.link}">JOIN SERVER</a> 
                    <br>JobId: <span style="color:#666;">${s.job}</span>
                </div>`;
            });
        } else {
            html += `<div class="empty">Trống (Hoặc đã hết hạn 5 phút)...</div>`;
        }
    });

    // Tự động bắt thêm các mục Trái Ác Quỷ rơi tự do ngoài danh sách ưu tiên
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
        html += `<div class="empty">Chưa có dữ liệu trái ác quỷ nào xuất hiện...</div>`;
    }

    html += `</body></html>`;
    res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hệ thống đang hoạt động ổn định trên cổng ${PORT}`);
});
         
