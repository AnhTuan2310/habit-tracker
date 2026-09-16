# Habit Tracker

Ứng dụng theo dõi thói quen hàng ngày: tick mỗi ngày một lần, xem chuỗi ngày liên tiếp và tỉ lệ
hoàn thành. Dùng được trên nhiều thiết bị, kể cả khi thiết bị đang mất mạng và chỉ đồng bộ về sau.

Lý do đằng sau từng quyết định nằm ở **[DECISIONS.md](DECISIONS.md)**.

## Chạy

```bash
docker compose up --build
```

| | Địa chỉ |
|---|---|
| Giao diện web | http://localhost:5173 |
| API + Swagger | http://localhost:5080/swagger |
| PostgreSQL | `localhost:5433` — user `habit`, mật khẩu `habit`, database `habittracker` |

Không cần làm gì thêm. Schema được tạo và dữ liệu mẫu được nạp ngay lúc API khởi động, nên không
phải chạy migration bằng tay. Lần build đầu mất vài phút để tải image và cài phụ thuộc.

Dừng lại bằng `docker compose down`, hoặc `docker compose down -v` nếu muốn xoá luôn dữ liệu để
bắt đầu lại từ đầu.

## Thử kịch bản nhiều thiết bị

Đây là phần chính của bài, và dựng lại được trong khoảng hai phút trên một máy.

1. Mở http://localhost:5173 ở **hai tab**. Mỗi tab là một thiết bị riêng — tên thiết bị hiện ở
   thanh công cụ, bấm vào đó đổi tên được cho dễ theo dõi.
2. **Tab A**: bấm nút `Trực tuyến` để chuyển thành `Ngoại tuyến`.
3. **Tab A**: tick thói quen *Uống đủ nước*. Ô chuyển màu vàng với nhãn **đang chờ**, và banner
   phía trên cho biết có bao nhiêu thay đổi chưa tới được máy chủ, cũ nhất từ ngày nào.
4. **Tab B** (vẫn trực tuyến): tick **cùng thói quen đó** cho **cùng ngày**. Thao tác này đi thẳng
   lên máy chủ.
5. **Tab A**: bấm `Ngoại tuyến` để trở lại trực tuyến. Hàng đợi tự động đẩy đi.

Kết quả mong đợi: trạng thái cuối cùng là của lần bấm **sau**, dù thiết bị đó đồng bộ trước hay
sau. Chỉ có **một** bản ghi cho ngày đó, và chuỗi ngày **không bị đếm hai lần**.

Nếu thao tác của tab A là bên thua, tab A hiện thêm thông báo **"thay đổi của bạn đã bị thiết bị
khác ghi đè"**, nói rõ thói quen nào, ngày nào, tab A đã chọn gì và thiết bị nào bấm sau nên
thắng. Không có dòng đó thì cái tick tự đảo ngược trên màn hình mà không ai hiểu vì sao — trông
hệt như ứng dụng làm mất dữ liệu.

Bấm `Đồng bộ ngay` thêm vài lần nữa cũng không làm gì đổi — gửi lại là vô hại.

Xem dữ liệu thật trong database:

```bash
docker compose exec db psql -U habit -d habittracker \
  -c 'SELECT "DeviceId","Status","Seq","LocalDate" FROM "CheckIns" ORDER BY "Seq";'
```

Thử nốt trường hợp gửi lỗi: bật `Ngoại tuyến`, tick vài thói quen, rồi để yên. Banner sẽ đếm số
thay đổi đang kẹt và thời gian chờ; sau vài lần thử lại tự động thất bại, các ô chuyển sang màu đỏ.
Không có thay đổi nào biến mất im lặng.

Thanh công cụ luôn hiện **lần đồng bộ gần nhất cách đây bao lâu**, vì những gì đang hiển thị chỉ là
ảnh chụp tại thời điểm đó và máy khác có thể đã đổi gì đó kể từ lúc ấy.

## Chạy test

```bash
dotnet test BE/HabitTracker.sln
```

23 test, không cần database:

- **`StreakCalculatorTests`** (9) — chuỗi bị đứt quãng, hôm nay chưa tick, ngày trùng lặp, dữ liệu
  tới không đúng thứ tự, tỉ lệ hoàn thành theo cửa sổ 30 ngày.
- **`SyncServiceTests`** (14) — gửi lại cùng một thao tác, hai thiết bị tick cùng một ngày, thao
  tác cũ tới sau, `done` gặp `undone`, đồng hồ client sai, hai thao tác cùng một ô trong một lô,
  và một thiết bị offline bắt kịp.

## Chạy khi phát triển

Không bắt buộc, nhưng tiện hơn khi sửa code vì có hot reload:

```bash
docker compose up -d db                                  # chỉ database

cd BE && dotnet run --project Api/Api.csproj              # API   -> :5080
cd FE && npm install && npm run dev                       # web   -> :5173
```

Vite chuyển tiếp `/api` sang `localhost:5080`, còn trong Docker thì nginx làm việc đó — nên mã
nguồn frontend luôn gọi `/api/...` và không cần biết backend nằm ở đâu.

## Cấu trúc

```
BE/                          .NET 8, Clean Architecture
  Domain/                    Thực thể, enum, hằng số
    Stats/StreakCalculator   Luật tính chuỗi — hàm thuần, không chạm database
  Application/               DTO, interface, service
    Services/SyncService     Luật chống trùng và xử lý xung đột
  Infrastructure/            EF Core, repository, migration, seed
  Api/                       Controller, middleware, Swagger
  Tests/                     xUnit

FE/                          React 19 + Vite + Tailwind
  src/lib/queue.js           Hàng đợi offline trong IndexedDB
  src/lib/api.js             Gọi API, kèm công tắc ngoại tuyến để demo
  src/hooks/useHabitBoard.js Cập nhật lạc quan, đẩy hàng đợi, tự thử lại
  src/components/            Thanh công cụ, thẻ thói quen, các thông báo sync
```

## Dữ liệu mẫu

Một người dùng và năm thói quen được tạo sẵn ở lần chạy đầu: uống đủ nước, tập thể dục, đọc sách,
thiền, ngủ đúng giờ. Chưa có đăng nhập — mọi yêu cầu đều chạy dưới người dùng mẫu này. Lý do và
cách mở rộng nằm ở mục 3 và 4 của [DECISIONS.md](DECISIONS.md).
