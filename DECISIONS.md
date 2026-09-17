# DECISIONS

Tài liệu này giải thích các quyết định trong bài. Phần nào chưa làm thì nói thẳng là chưa làm.

---

## 1. Hiểu đề

**Part 1** là phần nhìn thấy được: lưu các thói quen, lưu việc tick mỗi ngày, rồi trả lời câu
"thói quen này tôi giữ đều tới đâu" bằng chuỗi ngày liên tiếp và tỉ lệ hoàn thành.

**Part 2** là phần thật sự khó. Cùng một người dùng nhiều máy, các máy hay mất mạng và gửi dồn
về sau. Hệ quả là ba tình huống phải xử lý: cùng một thao tác tới server nhiều lần do gửi lại,
hai máy cùng tick một ngày, và dữ liệu tới không đúng thứ tự thời gian.

**Quan trọng nhất**: định nghĩa cho rõ "thế nào là trùng" và "ai thắng khi mâu thuẫn", rồi làm
đúng theo định nghĩa đó. Hai câu này quyết định dữ liệu đúng hay sai. Sai thì mọi con số hiển
thị đều vô nghĩa.

**Ít quan trọng nhất**: số lượng tính năng, giao diện đẹp, CRUD đầy đủ. Đề nói rõ ưu tiên lập
luận sạch hơn là đếm tính năng.

**Nếu buộc phải cắt hẳn một phần**: cắt Part 2. Không phải vì nó dễ hơn mà vì Part 1 đứng một
mình vẫn là một ứng dụng dùng được, còn Part 2 mà không có Part 1 thì không có gì để đồng bộ.
Cắt theo chiều đó thì thứ còn lại vẫn nguyên vẹn.

---

## 2. Cách phân tích và khoanh vùng

Chia theo chiều dữ liệu chảy: mô hình dữ liệu → luật tính streak → API đọc → API đồng bộ → giao
diện → tài liệu. Mỗi bước xong là chạy được và kiểm chứng được trước khi sang bước sau.

**Đã làm**: hai bảng dữ liệu, tính streak khi đọc, một endpoint đồng bộ hai chiều, hàng đợi
offline trong trình duyệt, giao diện thể hiện trạng thái chờ / đã gửi / gửi lỗi / bị ghi đè / dữ
liệu cũ, và bộ test cho hai chỗ khó nhất.

**Không làm**: đăng nhập, tick nhiều lần mỗi ngày, tần suất tuỳ biến, service worker thật, triển
khai lên máy chủ.

**Ranh giới đặt ở đâu**: thứ gì phục vụ trực tiếp cho câu hỏi "trùng là gì, ai thắng" thì viết
code. Thứ gì chỉ là tính năng cho đẹp thì viết vào tài liệu. Đó là lý do có hai bảng và mười bốn
test cho phần đồng bộ, nhưng không có màn hình đăng nhập.

**Giả định nào sai sẽ phá nhiều nhất**: *"mỗi thói quen chỉ tick một lần mỗi ngày"*. Toàn bộ cơ
chế chống trùng dựa trên khoá duy nhất `(user, habit, ngày)`. Nếu giả định này sai thì khoá đó
sai, chống trùng sai, và cách tính streak cũng sai theo. Xem mục 4.

---

## 3. Vì sao chọn như vậy

| Quyết định | Đã cân nhắc | Lý do chọn |
|---|---|---|
| .NET 8 + React | FastAPI, Next.js fullstack | Đây là stack tôi làm hàng ngày. Đề yêu cầu phải giải thích được mọi dòng code nộp lên, nên chọn thứ mình vững nhất quan trọng hơn chọn thứ viết nhanh nhất. |
| PostgreSQL | SQLite | Cần một chuỗi số tăng dần không lặp (`sequence`) và một unique index thật, trong điều kiện nhiều request cùng lúc. SQLite làm được nhưng yếu đúng ở chỗ này. |
| Controllers | Minimal API | Khớp convention Clean Architecture đang dùng. Không có lý do kỹ thuật nào mạnh hơn. |
| Tính streak khi đọc | Lưu sẵn, hoặc lai có cache | Xem mục 5. |
| Last-write-wins | Merge, hoặc hỏi người dùng | Xem mục 9. |
| Không đăng nhập | JWT | Người chấm mở lên là dùng được ngay. Cột `UserId` vẫn có sẵn trong mọi bảng nên thêm đăng nhập sau không phải đổi schema. |
| Icon nhúng thẳng SVG | Font icon, thư viện React | Font Material đầy đủ nặng khoảng 1.5MB để vẽ vài hình. Icon của giao diện được chép path vào code; 32 icon cho thói quen thì nạp dạng file SVG từ chính package của Google. |

**Quyết định ít tự tin nhất: last-write-wins dựa trên giờ của client.**

Nó đặt niềm tin vào đồng hồ của thiết bị, thứ mà server không kiểm soát được. Có kẹp độ lệch
(mục 7) nhưng kẹp chỉ giảm thiệt hại chứ không khử được vấn đề: một máy lệch bốn phút vẫn nằm
trong ngưỡng cho phép và vẫn có thể thắng oan. Cách đúng hơn là đếm logic theo từng thiết bị
(Lamport counter), nhưng nó phức tạp hơn nhiều so với giá trị mang lại cho một ô tick/không tick.

---

## 4. Dữ liệu và API

**`CheckIns`** — trạng thái hiện tại của mỗi ô `(thói quen, ngày)`:

```
Id, UserId, HabitId
LocalDate          date        -- do CLIENT gửi, server không tự suy ra
Status             int         -- Done | Undone
ClientUpdatedAt    timestamptz -- giờ người dùng bấm, dùng để so ai thắng
ServerReceivedAt   timestamptz
DeviceId           text
ClockSkewDetected  bool
Seq                bigint      -- số thứ tự thay đổi, dùng làm con trỏ bắt kịp

UNIQUE (UserId, HabitId, LocalDate)
```

**`SyncOperations`** — nhật ký mọi thao tác server đã nhận, khoá chính là `OpId` do client sinh.

**`Habits`** giữ tên thói quen, biểu tượng và mốc lưu trữ. Ở đây có một chỗ đặt tên chưa chuẩn,
nói thẳng ra thay vì để người đọc tự phát hiện: cột tên là `Emoji` nhưng giá trị bên trong là
**tên icon Material Symbols** (`water_drop`, `directions_run`), không phải ký tự emoji. Ban đầu
nó đúng là emoji thật; khi đổi sang bộ icon thì tên cột chưa được đổi theo. Sửa cho đúng cần một
migration đổi tên cột thành `Icon` — việc nhỏ nhưng chạm vào schema, nên nằm trong mục 13.

**Hai bảng vì chúng trả lời hai câu hỏi khác nhau.** `CheckIns` trả lời "hiện giờ ngày này thế
nào". `SyncOperations` trả lời "thao tác này server xử lý chưa". Gộp lại thì mất một trong hai.

**API**:

| Endpoint | Việc |
|---|---|
| `GET /api/habits?today=&days=` | Toàn bộ màn hình chính: habit, streak, lưới ngày |
| `POST /api/habits` · `DELETE /api/habits/{id}` | Tạo / lưu trữ |
| `GET /api/users/me` | Người dùng hiện tại. Đây là chỗ đăng nhập sẽ cắm vào |
| `POST /api/sync` | Đẩy lô thao tác **và** nhận về thay đổi, trong một lượt |

`POST /api/sync` làm cả hai chiều vì một máy vừa online lại cần cả hai cùng lúc: nó có thao tác
cần giao đi, và nó đang lạc hậu so với những gì máy khác đã làm. Tách thành hai endpoint thì
client phải tự lo thứ tự gọi và xử lý trường hợp một trong hai lỗi.

**Nếu cần tần suất tuỳ biến** (không phải ngày nào cũng làm): thêm cột lịch vào `Habits`, ví dụ
danh sách thứ trong tuần. `CheckIns` không đổi. Riêng `StreakCalculator` phải đổi: hiện nó coi
mọi ngày bỏ trống là đứt chuỗi, khi đó nó phải bỏ qua những ngày không nằm trong lịch. Đây là
thay đổi về luật, không phải về dữ liệu.

**Nếu nhiều người dùng chung một tài khoản**: cột `UserId` đã có sẵn ở mọi bảng nên phần khó
không nằm ở schema mà nằm ở ý nghĩa. Hai người cùng tick "tập thể dục" là hai việc khác nhau hay
một việc chung? Nếu là hai việc thì khoá duy nhất phải thêm người thực hiện vào, và lúc đó nó
không còn là "một ô mỗi ngày" nữa — tức là rơi đúng vào vấn đề ở đoạn dưới đây.

**Nếu một thói quen tick được nhiều lần mỗi ngày (ví dụ "uống 8 ly nước")**:

Vỡ đầu tiên là **khoá duy nhất `(UserId, HabitId, LocalDate)`**, vì nó vừa là mô hình dữ liệu vừa
là cơ chế chống trùng. Khi một ngày có 8 lần tick hợp lệ, hệ thống không còn phân biệt được:

- 8 lần tick thật, phải đếm đủ 8
- 1 lần tick bị gửi lại 8 lần do mạng chập chờn, chỉ được đếm 1

Cùng một dữ liệu, hai ý nghĩa ngược nhau. Cách sửa: bỏ khoá duy nhất theo ngày, chuyển `CheckIns`
thành bảng ghi từng sự kiện tick với `OpId` của client làm khoá — lúc đó chống trùng hoàn toàn dựa
vào `OpId` chứ không dựa vào cấu trúc bảng nữa. Thêm cột chỉ tiêu mỗi ngày vào `Habits`, và
`StreakCalculator` đổi từ "ngày này có tick không" sang "ngày này đạt đủ chỉ tiêu chưa".

Bài này **không làm** phần đó. Thói quen "Uống đủ nước" trong dữ liệu mẫu cố tình giữ ở dạng tick
một lần, đúng để minh hoạ ranh giới này.

---

## 5. Tính "độ đều đặn"

`Domain/Stats/StreakCalculator.cs` là một hàm thuần: đưa vào danh sách ngày đã hoàn thành và ngày
hôm nay, trả về chuỗi hiện tại, chuỗi dài nhất, và tỉ lệ 30 ngày. Không chạm database, không đọc
đồng hồ. Vì vậy nó test được trực tiếp (10 test) và đọc một lượt là hiểu.

**Không lưu sẵn con số nào. Tính lại mỗi lần đọc.**

Lý do nằm ở chính Part 2: một máy offline ba ngày sẽ đồng bộ về các check-in **của ngày đã qua**.
Mọi con số tính trước đó đều được tính khi chưa biết những ngày này tồn tại, nên nó **sai ngay lập
tức và không có gì báo**. Muốn dùng cách lưu sẵn thì phải tự phát hiện "có dữ liệu quá khứ vừa về"
rồi tính lại — thêm một tầng phức tạp và một nguồn sai, đổi lấy tốc độ mà bài này chưa cần.

**Cái giá phải trả, nói thẳng**: mỗi lần mở màn hình chính, server đọc toàn bộ lịch sử check-in
của người dùng (một query cho tất cả thói quen, không phải mỗi thói quen một query). Với vài năm
dữ liệu và vài chục thói quen thì vẫn là vài nghìn dòng, chấp nhận được. Khi nào không chấp nhận
được nữa thì thêm một bảng tóm tắt làm cache, xoá cache khi có check-in của ngày cũ đổ về — chuỗi
check-in thô vẫn là nguồn sự thật, nên đổi sang cách đó về sau không phải sửa dữ liệu.

**Tính khi đọc hay khi ghi**: khi đọc, vì lý do ở trên.

---

## 6. Giao diện và tầng dữ liệu

Người dùng bấm tick → thao tác được ghi vào hàng đợi IndexedDB **trước**, rồi ô trên màn hình đổi
màu ngay, rồi mới gửi đi. Ghi vào hàng đợi trước nghĩa là đóng tab, mất mạng hay request lỗi đều
không làm mất cái tick đó.

Một thao tác chỉ bị xoá khỏi hàng đợi khi server đã trả lời về nó — bất kể trả lời là `Applied`,
`Duplicate` hay `Superseded`. Cả ba đều có nghĩa "server đã thấy rồi, không còn gì để gửi lại".

Nhưng ba kết quả đó **không có nghĩa như nhau với người dùng**. Xem mục 9 và 10.

**Khi check-in đã gửi mà chưa được xác nhận, UI hiện gì?**

Ô ngày đổi màu ngay và mang nhãn **"đang chờ"** màu vàng. Nhưng **các con số streak thì không
đổi** — chúng vẫn là con số cũ từ server cho tới khi server xác nhận.

Đây là lựa chọn có ý thức. Muốn streak nhảy ngay thì phải viết lại luật tính chuỗi bằng
JavaScript ở client, tức là cùng một luật tồn tại hai bản bằng hai ngôn ngữ. Hai bản đó sẽ lệch
nhau ngay lần đầu có người sửa một bên. Thà để con số chậm vài trăm mili giây còn hơn để nó nhanh
mà sai.

---

## 7. Chống trùng và idempotency

**"Trùng" ở đây có hai loại khác hẳn nhau, nên có hai cơ chế.**

**Loại 1 — cùng một thao tác gửi lại.** Request timeout, client không biết lần gửi đầu có tới nơi
hay không, nên gửi lại. Mỗi thao tác mang một `OpId` do client sinh **một lần** lúc người dùng bấm
và giữ nguyên qua mọi lần gửi lại. Server thấy `OpId` đã có trong `SyncOperations` thì bỏ qua và
trả `Duplicate`. Gửi lại bao nhiêu lần cũng không đổi gì.

**Loại 2 — hai máy cùng tick một ngày.** Khác `OpId` nhưng cùng `(thói quen, ngày)`. Đây **không
phải hai check-in**, mà là hai ý kiến về cùng một ô. Unique index khiến dữ liệu không thể mọc thêm
dòng thứ hai; giờ bấm quyết định ý kiến nào thắng.

Đã kiểm chứng trên Postgres thật: 4 request từ 2 thiết bị (gồm 1 lần gửi lại) → đúng **1 dòng**
trong `CheckIns`, và `SyncOperations` có 3 dòng vì bản gửi lại bị chặn trước khi chạm dữ liệu.

**Định nghĩa này có sống sót khi client sai đồng hồ hoặc sai múi giờ không?**

Tách làm hai phần, vì chúng là hai chuyện khác nhau:

- **Ngày** (`LocalDate`) do client gửi lên, server **không bao giờ** tự suy ra từ giờ nhận. Đây
  không phải chiều client mà là đúng nghiệp vụ: "hôm nay" là khái niệm của người dùng. Người tick
  lúc 23:50, request tới server sau nửa đêm, nếu server tự suy ra ngày thì check-in nhảy sang hôm
  sau và chuỗi đứt oan. Cùng lý do, code client dùng `getFullYear/getMonth/getDate` chứ không dùng
  `toISOString()` — hàm sau quy về UTC và làm sai ngày với người ở múi giờ dương.
- **Thứ tự** dùng `ClientUpdatedAt` theo UTC, là một mốc thời gian tuyệt đối nên không phụ thuộc
  múi giờ.

**Chống đồng hồ sai**: server kẹp `ClientUpdatedAt` không được vượt quá giờ nhận cộng 5 phút. Vượt
thì ghi lại giá trị đã kẹp và bật cờ `ClockSkewDetected`. Một máy cài lịch sang năm sau nếu không
kẹp sẽ thắng mọi xung đột mãi mãi. Server cũng trả `serverTimeUtc` trong mỗi phản hồi để client có
thể tự biết mình lệch.

Cơ chế kẹp này đã tự chứng minh một cách ngoài ý muốn: một kịch bản kiểm thử gửi nhầm mốc thời
gian lệch hơn bốn tiếng về tương lai, và cả ba thao tác đều bị kẹp về đúng giờ nhận, kèm cờ
`ClockSkewDetected` bật lên trong database. Đó đúng là hành vi mong muốn, quan sát được trên
Postgres thật chứ không chỉ trong unit test.

**Phần còn lại chưa xử lý**: lệch dưới ngưỡng 5 phút vẫn có thể làm chọn sai. Đây đúng là quyết
định tôi ít tự tin nhất ở mục 3.

---

## 8. Nhiều thiết bị và offline

**Máy offline bắt kịp thế nào**: mỗi lần ghi, dòng `CheckIns` nhận một số `Seq` mới lấy từ
sequence của Postgres. Client nhớ số lớn nhất nó từng thấy và gửi kèm khi đồng bộ; server trả về
mọi thay đổi có `Seq` lớn hơn.

Dùng số thứ tự chứ không dùng timestamp là có chủ ý: hai dòng có thể trùng timestamp tới từng
mili giây, và khi đó dùng `>` sẽ bỏ sót một thay đổi còn dùng `>=` sẽ lặp lại vô hạn.

Client cũng tự gọi đồng bộ mỗi 15 giây kể cả khi không có gì để gửi, nên một máy đang mở sẽ tự
nhận thay đổi từ máy khác mà không phải bấm gì.

**Hai máy cùng tick một thói quen cho cùng một ngày**: chỉ có một ô, giờ bấm sau thắng. Không sinh
dòng thứ hai, streak không bị đếm hai lần.

**Một máy tick "đã làm", máy kia đang offline tick "chưa làm" thì sao?**

Ai bấm sau thắng, kể cả khi máy đó đồng bộ trước hay sau.

Điều này đòi một chi tiết trong mô hình: **"chưa làm" được lưu thành một dòng thật, không phải là
xoá dòng đi.** Nếu bỏ tick mà xoá dòng thì hành động đó không mang theo mốc thời gian nào, và nó
sẽ không bao giờ thắng nổi một "đã làm" đến sau. Dòng `Undone` chính là bia mộ giữ lại dấu vết của
việc bỏ tick.

---

## 9. Thứ tự và xung đột

**Luật: last-write-wins, đo bằng lúc người dùng bấm, không phải lúc dữ liệu tới server.**

Một chiếc điện thoại tick ở phòng gym rồi một tiếng sau mới đồng bộ thì không được phép thắng
chiếc tablet mà người đó thực sự dùng sau đó.

Khi hai mốc thời gian bằng nhau đúng từng tick, hệ thống so `DeviceId` theo thứ tự chuỗi. Trường
hợp này hiếm, nhưng nó không được phép do may rủi quyết định: cùng một dữ liệu chạy lại phải ra
cùng một kết quả.

**Thao tác thua không được biến mất im lặng.** Nó vẫn được ghi vào `SyncOperations` với kết quả
`Superseded` nên gửi lại vẫn vô hại, và client nhận kết quả đó trong phản hồi rồi **báo thẳng cho
người dùng**: thói quen nào, ngày nào, họ đã chọn gì, và thiết bị nào bấm sau nên thắng.

Thiếu thông báo đó thì cái tick tự đảo ngược trên màn hình mà không giải thích gì — đúng cái cảm
giác ứng dụng vừa làm mất dữ liệu của mình. Bản đầu tiên của client đã mắc lỗi này: nó xoá mọi
thao tác khỏi hàng đợi như nhau, coi `Superseded` ngang với `Applied`. Đúng với hàng đợi, sai với
người dùng.

**Trong cùng một lô** cũng có thể có hai thao tác trỏ vào một ô (máy offline tick rồi bỏ tick).
`SyncService` giữ một dictionary các ô đã chạm trong vòng lặp, vì chưa có gì được ghi xuống
database nên đọc lại sẽ không thấy thay đổi vừa tạo ra ở vòng lặp trước.

**Last-write-wins, merge, hay hỏi người dùng?** Last-write-wins. Một ô chỉ có hai giá trị
tick/không tick nên không có gì để merge. Còn hỏi lại người dùng thì nặng tay quá so với giá trị:
bắt người ta dừng lại chọn giữa "đã tập thể dục" và "chưa tập thể dục" thì phiền hơn là lấy luôn
lần bấm gần nhất — rồi báo cho họ biết việc đó đã xảy ra.

---

## 10. Trạng thái đồng bộ trên giao diện

Đề đòi UI thể hiện bốn thứ: đang chờ, đã gửi, gửi lỗi, và **dữ liệu cũ**. Bốn tầng thông tin,
từ hẹp tới rộng:

1. **Từng ô ngày**: vàng là đang chờ, đỏ là đã thử lại từ 3 lần trở lên, xanh là đã đồng bộ.
2. **Thanh công cụ**: số thay đổi đang chờ, và **lần đồng bộ gần nhất cách đây bao lâu**. Cái sau
   là phần trả lời cho "dữ liệu cũ": những gì đang hiển thị chỉ là ảnh chụp tại thời điểm đó, và
   máy khác có thể đã đổi gì đó kể từ lúc ấy.
3. **Banner hàng đợi**: hiện khi còn thay đổi chưa gửi được.
4. **Thông báo bị ghi đè**: hiện khi thay đổi của chính người dùng đã thua một thiết bị khác.

Mỗi ô ngày còn cho biết **thiết bị nào đã quyết định ngày đó** khi rê chuột lên, và dưới lưới có
một dòng tóm tắt các thiết bị đã tham gia khi có từ hai trở lên. Cần nói rõ giới hạn: đó là thiết
bị *thắng lần cuối*, không phải mọi thiết bị từng chạm vào ngày đó. Tablet tick, điện thoại bỏ
tick, rồi tablet tick lại thì chỉ còn thấy tablet. Lịch sử đầy đủ của mọi lần thử nằm trong
`SyncOperations`, nhưng chưa có endpoint nào đọc ra.

**Làm sao người dùng phát hiện một check-in của ba ngày trước âm thầm gửi lỗi?**

Vì thao tác chỉ rời hàng đợi khi server trả lời về nó, một check-in gửi lỗi **vẫn còn nằm trong
hàng đợi**. Banner đọc thẳng từ hàng đợi và hiện số thay đổi chưa ghi nhận, **ngày cũ nhất**, và
đã chờ bao lâu. Banner không tự tắt và không đóng được chừng nào còn thứ chưa gửi — khác với
toast, thứ biến mất sau vài giây và người dùng có thể không bao giờ nhìn thấy.

Ngoài ra client tự thử lại mỗi 15 giây, nên lỗi mạng tạm thời tự khỏi mà không cần ai bấm gì.

Trong bài này ngưỡng cảnh báo đặt là 2 phút để người chấm thấy được ngay khi demo. Sản phẩm thật
thì ngưỡng đó dài hơn nhiều.

---

## 11. Những gì đã cố ý đơn giản hoá

- **Không đăng nhập.** Một người dùng được seed sẵn. Cột `UserId` vẫn có ở mọi bảng.
- **Offline là mô phỏng.** Công tắc trong giao diện chặn ở tầng gọi API, không phải service
  worker thật. Đổi lại người chấm bật/tắt được theo ý muốn để diễn kịch bản, thay vì phải đi ngắt
  wifi. Hàng đợi IndexedDB thì là thật.
- **Mỗi tab là một thiết bị** (`deviceId` lưu ở `sessionStorage`). Đây là cách rẻ nhất để một
  người ngồi một máy vẫn dựng lại được cảnh hai thiết bị mâu thuẫn.
- **Mỗi thói quen chỉ tick một lần mỗi ngày.** Xem mục 4.
- **Không có tần suất tuỳ biến.** Mọi thói quen đều là hằng ngày.
- **Biểu tượng chọn từ danh sách 32 cái.** Không cho tải ảnh lên, cũng không cho gõ emoji tự do.
- **Thông báo bị ghi đè chỉ sống trong phiên.** Đóng tab là mất, vì nó nằm trong state của React
  chứ không được lưu xuống. Đủ cho mục đích của nó là giải thích một thay đổi vừa xảy ra trước
  mắt, nhưng một sản phẩm thật nên giữ lại thành nhật ký xem được sau.
- **Chỉ có giao diện sáng.** Không làm chế độ tối.
- **Migration chạy lúc khởi động.** Chấp nhận được vì chỉ có một instance API sở hữu database này.
  Nhiều instance thì hai tiến trình sẽ cùng migrate một lúc.
- **Mỗi lần ghi gọi `nextval` một lần**, tức một lượt đi về database cho mỗi thay đổi. Với lô lớn
  thì nên lấy sẵn một khoảng số.

---

## 12. Nếu phải thành tính năng thật

Theo thứ tự tôi sẽ làm:

1. **Xác thực và phân quyền.** Hiện `UserId` là hằng số trong controller. Phải lấy từ token, và
   mọi truy vấn phải lọc theo người dùng đã đăng nhập — vốn đã sẵn sàng vì repository nào cũng
   nhận `userId`.
2. **Giới hạn tần suất và kích thước lô.** Đã chặn 500 thao tác mỗi lô, nhưng chưa có rate limit
   theo thiết bị.
3. **Giao dịch cho toàn bộ một lô.** `SyncService` gọi `SaveAsync` hai lần ở cuối, nhưng cả hai
   dùng chung một `DbContext` nên lần thứ hai không sinh thêm câu lệnh nào và EF vẫn gói tất cả
   trong một transaction. Riêng `nextval` thì nằm ngoài transaction đó. Cần khẳng định bằng một
   transaction tường minh, và xử lý trường hợp unique index bắn lỗi do hai request đồng thời.
4. **Đổi offline mô phỏng thành service worker thật**, để app mở được khi không có mạng.
5. **Dọn `SyncOperations`.** Bảng này chỉ lớn lên. Cần xoá bản ghi cũ hơn một ngưỡng — chọn ngưỡng
   phải dài hơn khoảng thời gian một thiết bị có thể offline.
6. **Quan sát được**: log có mã tương quan, đếm số thao tác `Superseded` và số lần phát hiện lệch
   đồng hồ. Hai con số đó tăng bất thường là dấu hiệu luật xung đột đang xử oan ai đó.

---

## 13. Chưa kịp làm, và sẽ làm tiếp thế nào

- **Test API đầu-cuối tự động.** Luật xung đột có 14 unit test dùng repository giả, và tôi đã chạy
  một kịch bản 2 thiết bị qua HTTP thật để kiểm chứng (kết quả ở mục 7), nhưng kịch bản đó chưa
  được viết thành test tự động. Tiếp theo sẽ dùng `WebApplicationFactory` với Postgres trong
  Testcontainers.
- **Test giao diện.** Chưa có. Phần đáng test nhất là hàng đợi: đóng tab lúc đang chờ rồi mở lại
  thì thao tác phải còn nguyên.
- **Xử lý xoá thói quen giữa chừng.** Hiện lưu trữ chứ không xoá, nên chưa có xung đột kiểu "một
  máy xoá, máy kia vẫn tick". Nếu cho xoá thật thì phải có bia mộ cho thói quen giống như đã làm
  với ô `Undone`.
- **Phân trang cho lịch sử.** `GET /api/habits` trả về lưới 30 ngày nhưng đọc toàn bộ lịch sử để
  tính chuỗi dài nhất. Xem mục 5.
- **Thông báo khi nhận thay đổi từ máy khác.** Hiện chỉ báo khi thay đổi của mình bị ghi đè. Trường
  hợp máy khác tick một ngày mà máy này chưa từng chạm tới thì ô cứ thế đổi màu, không nói gì.
- **Đổi tên cột `Emoji` thành `Icon`.** Xem mục 4. Cần một migration nên chưa làm trong bài này.
