import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 10 câu multiple_choice. Mỗi domain 8 câu.
// Docker Engine hiện hành + Compose v2 (`docker compose`, không dùng `version:` top-level).
// Đáp án đã kiểm bằng cách chạy thật (Docker Engine 29, busybox) hoặc đối chiếu docs.docker.com — xem docker-report.md.
export const DOCKER: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    domain: 'Images & Dockerfile', difficulty: 'easy', type: 'single_choice',
    stem: 'Dockerfile của một app Node:\n```dockerfile\nFROM node:22-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node", "index.js"]\n```\nChỉ sửa một dòng mã nguồn rồi build lại, bước `npm ci` vẫn chạy lại từ đầu dù `package.json` không đổi. Cách sửa nào giúp tận dụng build cache?',
    options: [
      { content: 'Thêm `node_modules` vào `.dockerignore` để `COPY . .` không còn làm vỡ cache của bước `npm ci`' },
      { content: '`COPY package*.json ./` rồi `RUN npm ci`, sau đó mới `COPY . .` phần mã nguồn còn lại', correct: true },
      { content: 'Đổi `COPY . .` thành `ADD . .` vì `ADD` có cơ chế so sánh nội dung riêng cho cache' },
      { content: 'Đưa `RUN npm ci` lên trước `COPY . .` để bước cài đặt nằm ở đầu Dockerfile' },
    ],
  },
  {
    domain: 'Images & Dockerfile', difficulty: 'easy', type: 'multiple_choice',
    stem: 'Dự án có `.dockerignore` chứa dòng `.env`, và Dockerfile có `COPY . /app`. Những phát biểu nào đúng?',
    options: [
      { content: 'Khi thiếu `.dockerignore`, Docker tự đọc `.gitignore` của repo để thay thế' },
      { content: 'File `.env` không được đưa vào image qua lệnh `COPY . /app`', correct: true },
      { content: '`.dockerignore` còn loại bỏ các file sẵn có trong image nền được chỉ ra ở `FROM`' },
      { content: 'Thêm lệnh `COPY .env /x` vào Dockerfile sẽ làm build báo lỗi không tìm thấy file', correct: true },
    ],
  },
  {
    domain: 'Images & Dockerfile', difficulty: 'easy', type: 'single_choice',
    stem: 'Dockerfile có dòng `RUN python app.py`, trong đó `app.py` khởi động một web server chạy vô hạn. Điều gì xảy ra khi chạy `docker build`?',
    options: [
      { content: 'Build bị treo ở bước này, vì `RUN` chạy lệnh lúc build và chờ lệnh kết thúc', correct: true },
      { content: 'Build xong bình thường, và server tự chạy mỗi khi bạn `docker run` image này' },
      { content: 'Build xong bình thường, nhưng server chạy nền trong layer nên image phình to' },
      { content: 'Build báo lỗi ngay vì bước `RUN` không được phép chiếm cổng mạng lúc build' },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'easy', type: 'single_choice',
    stem: 'Ứng dụng trong container cần ghi nốt dữ liệu đang xử lý trước khi tắt. Lệnh nào phù hợp nhất để tắt container?',
    options: [
      { content: '`docker kill` — mặc định gửi SIGKILL để tiến trình thoát ngay lập tức, không kịp dọn dẹp' },
      { content: '`docker rm -f` — xoá container sau khi chờ ứng dụng tự thoát gọn gàng rồi mới huỷ' },
      { content: '`docker stop` — gửi SIGTERM, quá thời gian chờ mà tiến trình chưa thoát mới gửi SIGKILL', correct: true },
      { content: '`docker pause` — gửi SIGSTOP để ứng dụng dừng gọn và giữ nguyên dữ liệu đang xử lý' },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'easy', type: 'single_choice',
    stem: 'Hai lệnh chạy lần lượt:\n```bash\ndocker run --name c1 alpine sh -c "echo hi > /note.txt"\ndocker run --rm alpine cat /note.txt\n```\nLệnh thứ hai cho kết quả gì?',
    options: [
      { content: 'In `hi`, vì file ghi ở container trước được lưu lại trong image `alpine`' },
      { content: 'In `hi`, vì Docker chia sẻ lớp ghi giữa các container cùng image' },
      { content: 'Báo permission denied, vì file thuộc về container `c1` và container mới không được đọc' },
      { content: 'Báo lỗi không có file, vì container mới có lớp ghi riêng tạo từ image', correct: true },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'easy', type: 'multiple_choice',
    stem: 'Chạy `docker run --rm -v /scratch -v keep:/keep alpine ...` (`/scratch` là volume ẩn danh, `keep` là named volume). Khi tiến trình trong container thoát, những phát biểu nào đúng?',
    options: [
      { content: 'Named volume `keep` cũng bị xoá cùng container vừa chạy, vì nó được gắn lúc `run`' },
      { content: 'Image `alpine` bị xoá nếu không còn container nào khác dùng nó' },
      { content: 'Container được xoá tự động khi tiến trình thoát, kể cả khi thoát với mã khác 0', correct: true },
      { content: 'Volume ẩn danh `/scratch` gắn kèm cũng bị xoá cùng container', correct: true },
    ],
  },
  {
    domain: 'Networking', difficulty: 'easy', type: 'single_choice',
    stem: 'Chạy `docker run -d -p 8080:80 nginx` (nginx lắng nghe cổng 80 trong container). Cách nào truy cập được trang chủ nginx từ trình duyệt trên máy chạy Docker?',
    options: [
      { content: 'Mở `http://localhost:8080`, cổng 8080 của host được chuyển tới cổng 80 của container', correct: true },
      { content: 'Mở `http://localhost:80`, container mở cổng 80 ra host với cùng số cổng' },
      { content: 'Mở `http://<IP của container>:8080`, cổng 8080 là cổng lắng nghe bên trong container' },
      { content: 'Mở `http://localhost:80` hoặc `http://localhost:8080`, Docker mở cả hai cổng ra host' },
    ],
  },
  {
    domain: 'Networking', difficulty: 'easy', type: 'single_choice',
    stem: 'Dockerfile có `EXPOSE 3000` và ứng dụng lắng nghe cổng 3000 trên mọi interface. Chạy `docker run -d img` (không thêm `-p`). Từ máy host, `curl localhost:3000` có kết nối được không?',
    options: [
      { content: 'Được, vì `EXPOSE 3000` đã mở cổng 3000 trên host khi container chạy' },
      { content: 'Được, nhưng chỉ từ máy khác trong LAN, không phải từ chính máy host' },
      { content: 'Không, vì `EXPOSE` có tác dụng khi container nằm trong một user-defined network' },
      { content: 'Không, vì `EXPOSE` ghi chú cổng thôi, muốn publish ra host cần `-p` hoặc `-P`', correct: true },
    ],
  },
  {
    domain: 'Networking', difficulty: 'easy', type: 'multiple_choice',
    stem: 'Container `web` và `db` cùng nằm trên một user-defined network. Ứng dụng trong `web` cấu hình kết nối DB tới `localhost:5432` và bị từ chối kết nối. Những phát biểu nào đúng?',
    options: [
      { content: '`localhost` trong `web` là chính container `web`, vì mỗi container có network namespace riêng', correct: true },
      { content: '`localhost` trong container trỏ tới máy host, nên cổng 5432 của host phải được mở' },
      { content: 'Đổi host kết nối thành `db` (tên container) là đủ, không cần publish cổng 5432 ra host', correct: true },
      { content: 'Phải publish `db` bằng `-p 5432:5432` thì `web` mới gọi được `db` qua mạng' },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'easy', type: 'single_choice',
    stem: 'Chạy `docker run -d -v pgdata:/var/lib/postgresql/data postgres`, trong đó `pgdata` không bắt đầu bằng `/` hay `./` và chưa có gì mang tên đó. Lệnh này tạo ra gì cho thư mục dữ liệu?',
    options: [
      { content: 'Bind mount tới thư mục `pgdata` nằm trong thư mục hiện tại của máy host' },
      { content: 'Bind mount tới thư mục `/pgdata` ở gốc hệ thống file của máy host' },
      { content: 'Lỗi, vì nguồn của `-v` phải là đường dẫn tuyệt đối trên máy host' },
      { content: 'Một named volume `pgdata` do Docker quản lý, tồn tại độc lập với container', correct: true },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'easy', type: 'single_choice',
    stem: 'Chạy `docker run --tmpfs /cache alpine ...` rồi ghi file vào `/cache`. Phát biểu nào đúng?',
    options: [
      { content: 'Dữ liệu ghi xuống đĩa của host trong thư mục volumes và còn sau khi container dừng' },
      { content: 'Dữ liệu nằm trong bộ nhớ của host và mất khi container dừng', correct: true },
      { content: 'Dữ liệu nằm trong RAM nhưng vẫn còn khi `docker start` lại container đó' },
      { content: 'Dữ liệu ghi vào lớp ghi của container và chỉ mất khi container bị `docker rm`' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'easy', type: 'single_choice',
    stem: 'File `compose.yaml` trong thư mục `shop` chỉ khai báo hai service `web` (image nginx) và `db` (image postgres), không có mục `networks`. Sau `docker compose up`, `web` gọi `db` bằng cách nào?',
    options: [
      { content: 'Compose tạo network mặc định `shop_default`, `web` gọi `db` bằng tên service `db`', correct: true },
      { content: 'Phải khai báo `networks:` cho cả hai service, nếu không chúng không thấy nhau' },
      { content: 'Cả hai dùng bridge `docker0` mặc định nên muốn gọi theo tên phải khai báo `links:`' },
      { content: 'Gọi nhau bằng `localhost`, vì mọi service trong một project dùng chung network namespace' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'easy', type: 'single_choice',
    stem: 'File `compose.yaml` có service `db` gắn named volume `data:/var/lib/postgresql/data` (khai báo ở mục `volumes:` cấp trên cùng). Bạn chạy `docker compose down` rồi `docker compose up -d`. Dữ liệu trong DB ra sao?',
    options: [
      { content: 'Mất, vì `down` xoá mọi thứ project đã tạo, kể cả named volume' },
      { content: 'Mất, vì named volume gắn với vòng đời container nên bị xoá khi container bị xoá' },
      { content: 'Còn, vì `down` mặc định xoá container và network, không xoá named volume', correct: true },
      { content: 'Còn, nhưng cần dùng `docker compose stop` thay cho `down` ở bước đầu' },
    ],
  },

  // ───── medium (14) ─────
  {
    domain: 'Images & Dockerfile', difficulty: 'medium', type: 'multiple_choice',
    stem: 'Hai Dockerfile:\n```dockerfile\n# imgA\nFROM busybox\nENTRYPOINT ["echo", "hello"]\nCMD ["world"]\n\n# imgB\nFROM busybox\nENTRYPOINT echo hello\nCMD ["world"]\n```\nNhững phát biểu nào đúng?',
    options: [
      { content: '`docker run imgA bye` in ra `hello bye`', correct: true },
      { content: '`docker run imgB bye` in ra `hello bye`' },
      { content: '`docker run imgB bye` in ra `hello`', correct: true },
      { content: '`docker run imgA` in ra `hello`' },
    ],
  },
  {
    domain: 'Images & Dockerfile', difficulty: 'medium', type: 'single_choice',
    stem: 'Thư mục build có file `app.tar.gz` (nén một thư mục `t/`). Dockerfile có dòng `ADD app.tar.gz /srv/`. Sau khi build, image chứa gì trong `/srv`?',
    options: [
      { content: 'Đúng file `app.tar.gz` nguyên dạng nén, vì `ADD` và `COPY` đều chép file nguyên vẹn' },
      { content: 'Build lỗi, vì `ADD` chỉ dùng để tải về từ URL còn file cục bộ phải dùng `COPY`' },
      { content: 'Thư mục `app/` chứa các file đã giải nén, vì tên thư mục lấy từ tên file nén bỏ phần đuôi' },
      { content: 'Thư mục `t/` đã được giải nén sẵn, vì `ADD` tự giải nén file nén cục bộ khi chép vào image', correct: true },
    ],
  },
  {
    domain: 'Images & Dockerfile', difficulty: 'medium', type: 'single_choice',
    stem: 'Dockerfile:\n```dockerfile\nFROM alpine\nRUN adduser -D app\nUSER app\nRUN mkdir /data\n```\nKết quả của `docker build` là gì?',
    options: [
      { content: 'Build lỗi permission denied ở `mkdir`, vì sau `USER app` các lệnh `RUN` cũng chạy bằng `app`', correct: true },
      { content: 'Build thành công: `USER` chỉ áp dụng cho `CMD` và `ENTRYPOINT`, còn `RUN` chạy bằng root' },
      { content: 'Build lỗi ngay ở dòng `USER app`, vì user chưa tồn tại trong `/etc/passwd` của image nền' },
      { content: 'Build thành công, và `/data` được Docker tự chuyển quyền sở hữu cho user `app`' },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'medium', type: 'single_choice',
    stem: 'Chạy `docker run -d --restart on-failure alpine sh -c "exit 0"`. Vài giây sau, trạng thái container là gì?',
    options: [
      { content: 'Bị khởi động lại liên tục, mỗi lần tiến trình thoát Docker lại chạy nó lên' },
      { content: '`Exited (0)` và không được khởi động lại vì tiến trình thoát thành công', correct: true },
      { content: 'Được khởi động lại tối đa 3 lần rồi dừng, 3 là giá trị mặc định của `on-failure`' },
      { content: 'Không tạo được container, vì `on-failure` bắt buộc phải có số lần thử tối đa đi kèm' },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'medium', type: 'single_choice',
    stem: 'Hai tình huống:\n```bash\n# (1)\ndocker run -it --name shell alpine sh      # rồi gõ exit\n# (2)\ndocker run -d --name worker alpine sleep 300\ndocker exec -it worker sh                  # rồi gõ exit\n```\nSau đó `docker ps -a` hiển thị trạng thái của `shell` và `worker` thế nào?',
    options: [
      { content: '`shell` đã thoát (Exited), `worker` vẫn chạy (Up), vì `exit` chỉ kết thúc PID 1 của `shell`', correct: true },
      { content: 'Cả hai vẫn chạy (Up), vì `exit` chỉ đóng phiên terminal chứ không kết thúc tiến trình trong container' },
      { content: 'Cả hai đã thoát (Exited), vì `exit` kết thúc shell và container dừng khi không còn shell nào' },
      { content: '`shell` vẫn chạy (Up), `worker` đã thoát (Exited), vì `exec` gắn vào PID 1 của `worker`' },
    ],
  },
  {
    domain: 'Networking', difficulty: 'medium', type: 'single_choice',
    stem: 'Hai container `api` và `worker` (cả hai chạy image `alpine`) được chạy bằng `docker run` thường, không tạo network nào. Trong `worker`, lệnh `ping api` cho kết quả gì?',
    options: [
      { content: 'Thành công, vì DNS nhúng của Docker phân giải tên container trên mọi bridge network' },
      { content: 'Thành công, nhưng chỉ khi `api` đã publish cổng ra host bằng `-p`' },
      { content: 'Báo `bad address`, vì bridge mặc định không phân giải tên container nên chỉ gọi được bằng IP', correct: true },
      { content: 'Báo lỗi, vì hai container khác network nên phải `docker network connect` chúng vào cùng `docker0`' },
    ],
  },
  {
    domain: 'Networking', difficulty: 'medium', type: 'multiple_choice',
    stem: 'Có hai user-defined network `front` và `back`. Container `web` chỉ nằm trong `front`, `api` nằm trong cả `front` và `back`, `db` chỉ nằm trong `back`. Những phát biểu nào đúng?',
    options: [
      { content: '`web` gọi được `db`, vì lưu lượng tự đi xuyên qua `api` đang nằm ở cả hai network' },
      { content: 'Sau `docker network connect front db`, `web` gọi được `db` theo tên mà không cần khởi động lại container', correct: true },
      { content: '`api` phải publish cổng của `db` ra host bằng `-p` thì mới gọi được `db` theo tên' },
      { content: 'Ban đầu `web` không phân giải được tên `db`, vì chúng không chung network nào', correct: true },
    ],
  },
  {
    domain: 'Networking', difficulty: 'medium', type: 'single_choice',
    stem: 'Cần mở cổng Postgres của container ra host để debug bằng GUI chạy trên chính máy đó, nhưng không cho máy khác trong LAN truy cập. Cấu hình nào đúng?',
    options: [
      { content: '`-p 5432:5432`, vì mặc định Docker chỉ bind cổng publish vào loopback của host' },
      { content: '`-p 127.0.0.1:5432:5432`, vì cổng publish khi đó chỉ bind vào loopback của host', correct: true },
      { content: '`EXPOSE 5432` trong Dockerfile, vì Docker chỉ cho phép truy cập từ máy local' },
      { content: '`-P`, vì Docker chỉ publish các cổng EXPOSE vào loopback của host' },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'medium', type: 'single_choice',
    stem: 'Image `img` có sẵn file `/data/seed.txt`. Thư mục `./empty` trên host đang rỗng. Chạy `docker run --rm -v "$(pwd)/empty:/data" img ls /data` in ra gì?',
    options: [
      { content: 'Không in gì: bind mount che toàn bộ nội dung `/data` của image nên `/data` rỗng', correct: true },
      { content: '`seed.txt`: Docker chép nội dung `/data` của image vào thư mục host rỗng trước khi mount' },
      { content: '`seed.txt`: bind mount gộp nội dung thư mục host với `/data` của image' },
      { content: 'Báo lỗi, vì không thể bind mount một thư mục rỗng lên đường dẫn đã có nội dung' },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'medium', type: 'multiple_choice',
    stem: 'Image `img` có sẵn file `/data/seed.txt`. Chạy `docker run -v app-data:/data img ...` với `app-data` chưa tồn tại, về sau sửa `seed.txt` trong volume rồi chạy lại. Những phát biểu nào đúng?',
    options: [
      { content: 'Ở lần đầu, volume `app-data` mới (rỗng) được chép sẵn `seed.txt` từ image', correct: true },
      { content: 'Volume ẩn danh mới (`-v /data`) không được chép sẵn, chỉ named volume mới được' },
      { content: 'Ở các lần sau, Docker chép lại `seed.txt` từ image và ghi đè bản bạn đã sửa trong volume' },
      { content: 'Khi volume đã có dữ liệu, nội dung volume được dùng và không bị image ghi đè', correct: true },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'medium', type: 'single_choice',
    stem: 'Image khai báo `VOLUME /d` trong Dockerfile. Bạn chạy `docker run --name x1 img`, rồi `docker rm x1` (không dùng `-v`, không đặt tên volume), lặp lại nhiều lần. Điều gì tích tụ trên máy?',
    options: [
      { content: 'Không gì cả: volume ẩn danh bị xoá cùng container theo mặc định khi chạy `docker rm`' },
      { content: 'Dữ liệu ghi vào `/d` tích tụ trong layer của image, làm image ngày càng lớn' },
      { content: 'Không gì cả: mọi container của image dùng chung một volume ẩn danh duy nhất' },
      { content: 'Mỗi lần tạo một volume ẩn danh mới và `docker rm` không kèm `-v` để nguyên chúng', correct: true },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'medium', type: 'single_choice',
    stem: 'File Compose:\n```yaml\nservices:\n  web:\n    build: .\n    depends_on: [db]\n  db:\n    image: postgres:17\n```\n`docker compose up` khởi động `db` trước, nhưng `web` thỉnh thoảng báo `connection refused` lúc đầu. Nguyên nhân?',
    options: [
      { content: '`depends_on` chờ healthcheck có sẵn của image postgres, nhưng chỉ chờ tối đa 30 giây' },
      { content: '`depends_on` đợi `db` chạy xong và thoát (`Exited 0`) rồi mới khởi động `web`' },
      { content: '`depends_on` dạng rút gọn chỉ chờ container `db` được start, không chờ Postgres sẵn sàng', correct: true },
      { content: '`depends_on` giữ thứ tự ở lần `up` đầu, các lần sau container đã tồn tại nên khởi động song song' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'medium', type: 'multiple_choice',
    stem: 'File `.env` (cạnh `compose.yaml`) có `TAG=1.2` và `PORT=9000`. File `app.env` có `FROM_FILE=1`. Service `w` trong `compose.yaml` khai báo `image: app:${TAG}` và `env_file: app.env`. Những phát biểu nào đúng?',
    options: [
      { content: 'Container `w` nhận cả `TAG` và `PORT`, vì `.env` được nạp vào mọi container của project' },
      { content: 'Container `w` nhận `FROM_FILE` từ `env_file`, nhưng không nhận `TAG` hay `PORT`', correct: true },
      { content: 'Image của `w` được thay thành `app:1.2` khi Compose đọc file', correct: true },
      { content: '`env_file: app.env` cũng cung cấp giá trị cho các biểu thức `${...}` trong `compose.yaml`' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'medium', type: 'single_choice',
    stem: 'File Compose có `app` (không profile) và `dbg` (`profiles: ["debug"]`). Phát biểu nào đúng?',
    options: [
      { content: '`docker compose up -d` khởi động cả hai service, còn profiles ảnh hưởng tới lệnh `docker compose run`' },
      { content: '`docker compose up -d` bỏ qua `dbg`, còn `up -d dbg` (gọi đích danh) vẫn khởi động nó, không cần `--profile`', correct: true },
      { content: '`dbg` bị bỏ qua cho tới khi bật `--profile debug`, kể cả khi bạn gọi đích danh tên service đó trên dòng lệnh' },
      { content: '`docker compose up -d` tạo `dbg` ở trạng thái paused cho tới khi bật profile `debug`' },
    ],
  },

  // ───── hard (13) ─────
  {
    domain: 'Images & Dockerfile', difficulty: 'hard', type: 'single_choice',
    stem: 'Dockerfile:\n```dockerfile\nFROM alpine\nARG GIT_SHA\nRUN apk add --no-cache curl\nCOPY . /app\n```\nCI build lại bằng `--build-arg GIT_SHA=<hash commit mới>` mỗi lần, kể cả khi mã nguồn không đổi. Với BuildKit và cache bình thường, điều nào đúng?',
    options: [
      { content: 'Không lớp nào mất cache, vì giá trị `ARG` không được lưu vào image' },
      { content: 'Mất cache từ `FROM` trở đi, vì một `ARG` đổi nghĩa là toàn bộ quá trình build bị coi là mới hoàn toàn' },
      { content: '`RUN apk add` chạy lại khi `GIT_SHA` đổi, vì `RUN` sau `ARG` dùng nó ngầm như biến môi trường', correct: true },
      { content: 'Chỉ lớp `COPY . /app` mất cache, vì `ARG` chỉ ảnh hưởng các lệnh làm việc trực tiếp với file nguồn' },
    ],
  },
  {
    domain: 'Images & Dockerfile', difficulty: 'hard', type: 'multiple_choice',
    stem: 'Dockerfile nhiều stage, build bằng BuildKit:\n```dockerfile\nFROM node:22-alpine AS deps\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\n\nFROM deps AS test\nRUN npm test\n\nFROM node:22-alpine AS final\nCOPY --from=deps /app/node_modules /app/node_modules\nCMD ["node", "index.js"]\n```\nNhững phát biểu nào đúng?',
    options: [
      { content: '`docker build .` không chạy stage `test` vì stage cuối không tham chiếu tới nó, nên test hỏng vẫn build xong', correct: true },
      { content: 'Image cuối chứa mọi layer của stage `deps`, vì `COPY --from=deps` kéo theo cả lịch sử build' },
      { content: '`docker build --target test .` chạy `deps` rồi `test`, vì stage `final` không nằm trong đường phụ thuộc đó', correct: true },
      { content: '`COPY --from=deps /app/node_modules ...` chép toàn bộ filesystem của stage `deps`, vì nó chép theo stage' },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'hard', type: 'single_choice',
    stem: 'Chạy lần lượt:\n```bash\ndocker run -d --name worker alpine sleep 300\ndocker stop worker\ndocker inspect -f \'{{.State.ExitCode}}\' worker\n```\n`sleep` không tự cài đặt xử lý tín hiệu nào. Mã thoát in ra là gì và vì sao?',
    options: [
      { content: '143: SIGTERM kết thúc `sleep` ngay lập tức theo hành động mặc định của tín hiệu (143 = 128 + 15)' },
      { content: '0: `docker stop` là dừng có chủ đích nên Docker ghi nhận tiến trình đã thoát thành công' },
      { content: '137: `sleep` bị OOM killer của kernel kết thúc vì vượt giới hạn bộ nhớ của container' },
      { content: '137: `sleep` là PID 1 không có handler nên SIGTERM bị bỏ qua, rồi Docker gửi SIGKILL', correct: true },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'hard', type: 'multiple_choice',
    stem: 'Phát biểu nào đúng về restart policy của Docker Engine?',
    options: [
      { content: 'Với `always`, container bị `docker stop` thủ công vẫn được chạy lại khi Docker daemon khởi động lại', correct: true },
      { content: 'Với `always`, ngay sau `docker stop` Docker tự khởi động lại container để nó không bị dừng' },
      { content: 'Với `unless-stopped`, container tự thoát mã 0 không được khởi động lại vì bị coi là dừng chủ đích' },
      { content: 'Với `unless-stopped`, container đã bị `docker stop` thủ công không tự chạy lại, kể cả sau khi daemon khởi động lại', correct: true },
    ],
  },
  {
    domain: 'Containers & lifecycle', difficulty: 'hard', type: 'single_choice',
    stem: 'Container được tạo bằng `docker run -d --name app -e BAR=2 img`. Tiến trình PID 1 (một script) tự chạy `export FOO=1` lúc khởi động rồi chạy tiếp. Sau đó:\n```bash\ndocker exec app sh -c \'echo "FOO=${FOO:-unset} BAR=${BAR:-unset}"\'\n```\nIn ra gì?',
    options: [
      { content: '`FOO=1 BAR=2`, vì `exec` kế thừa toàn bộ môi trường hiện tại của tiến trình PID 1 trong container' },
      { content: '`FOO=unset BAR=2`, vì `exec` nhận biến cấu hình container nhưng không nhận biến PID 1 tự `export`', correct: true },
      { content: '`FOO=1 BAR=unset`, vì `exec` nhận biến PID 1 tự `export` nhưng bỏ biến truyền bằng `-e` lúc `run`' },
      { content: '`FOO=unset BAR=unset`, vì `exec` khởi động với môi trường rỗng và phải khai báo lại bằng `-e` mỗi lần' },
    ],
  },
  {
    domain: 'Networking', difficulty: 'hard', type: 'single_choice',
    stem: 'Ứng dụng trong container được cấu hình lắng nghe `127.0.0.1:3000` (không phải `0.0.0.0`). Chạy `docker run -d -p 3000:3000 img`. Từ máy host, `curl localhost:3000` cho kết quả gì?',
    options: [
      { content: 'Thành công, vì `-p` chuyển tiếp thẳng vào loopback của container' },
      { content: 'Chỉ thất bại với `localhost` vì bị phân giải sang IPv6 `::1`, còn `curl 127.0.0.1:3000` thì thành công' },
      { content: 'Thất bại, vì lưu lượng publish đi vào qua interface của container trong khi app chỉ nghe loopback', correct: true },
      { content: 'Thất bại, vì thiếu `EXPOSE 3000` trong Dockerfile nên Docker không mở cổng tới ứng dụng đó' },
    ],
  },
  {
    domain: 'Networking', difficulty: 'hard', type: 'single_choice',
    stem: 'Trên Linux với Docker Engine, chạy hai container nginx (lắng nghe cổng 80), cả hai dùng `--network host`; container thứ hai còn thêm `-p 8081:80`. Điều gì xảy ra?',
    options: [
      { content: 'Container thứ hai lỗi bind cổng 80 (address already in use), vì dùng chung network stack với host và `-p` bị bỏ qua', correct: true },
      { content: 'Cả hai chạy, container thứ hai truy cập được qua cổng 8081 của host nhờ `-p 8081:80` đã khai báo' },
      { content: 'Cả hai chạy bình thường, vì mỗi container có network namespace riêng nên hai cổng 80 không đụng nhau' },
      { content: 'Docker từ chối tạo container thứ hai, vì cờ `--network host` không được phép dùng cùng với `-p`' },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'hard', type: 'single_choice',
    stem: 'Dockerfile:\n```dockerfile\nFROM alpine\nRUN adduser -D -u 1000 app\nUSER app\n```\nImage không tạo sẵn thư mục `/data`. Chạy `docker run --rm -v app-data:/data img sh -c "echo x > /data/f"` với `app-data` là named volume mới. Kết quả và cách sửa?',
    options: [
      { content: 'Ghi thành công, vì Docker tự đặt quyền sở hữu volume mới theo user `app` đang chạy trong container' },
      { content: 'Permission denied, vì `/data` do Docker tạo thuộc root; sửa bằng `mkdir` + `chown` cho `app` trong image', correct: true },
      { content: 'Permission denied, vì volume mặc định chỉ đọc; sửa bằng cách thêm hậu tố `:rw` vào đối số `-v`' },
      { content: 'Ghi thành công, nhưng dữ liệu chỉ nằm trong lớp ghi của container vì volume mới chưa được gắn' },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'hard', type: 'single_choice',
    stem: 'Dockerfile cài `node_modules` vào `/app/node_modules` lúc build. Khi dev, chạy `docker run -v "$(pwd):/app" img` và thư mục dự án trên host chưa có `node_modules` nên app báo thiếu module. Cách nào giữ được `node_modules` của image?',
    options: [
      { content: 'Thêm `:ro` vào bind mount (`-v "$(pwd):/app:ro"`) để Docker không ghi đè nội dung trong `/app`' },
      { content: 'Đặt bind mount sau cùng trong dòng lệnh để Docker gộp nội dung host với nội dung image' },
      { content: 'Thêm `VOLUME /app` vào Dockerfile để Docker tự gộp thư mục host với nội dung của image' },
      { content: 'Thêm một volume cho đường dẫn con (`-v /app/node_modules`) để phần đó lấy nội dung từ image', correct: true },
    ],
  },
  {
    domain: 'Volumes & storage', difficulty: 'hard', type: 'single_choice',
    stem: 'Trên Docker Engine 23 trở lên (API 1.42+), máy có ba volume: (1) volume ẩn danh không container nào dùng; (2) named volume `pgdata` không container nào (kể cả đã dừng) tham chiếu; (3) named volume `webdata` đang được một container đã dừng tham chiếu. Chạy `docker volume prune` (không thêm cờ nào, trả lời `y`) sẽ xoá những volume nào?',
    options: [
      { content: 'Cả (1), (2) và (3), vì container đã dừng không được tính là đang dùng volume' },
      { content: 'Cả (1) và (2), vì `prune` xoá mọi volume không có container nào tham chiếu' },
      { content: 'Chỉ (1), vì mặc định `prune` xoá volume ẩn danh không dùng, còn named volume cần thêm `-a`', correct: true },
      { content: 'Chỉ (2), vì `prune` xoá volume có tên và để nguyên volume ẩn danh do khó nhận diện' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'hard', type: 'multiple_choice',
    stem: '`compose.yaml` có service `web` với `command: ["sleep", "60"]`, `ports: ["8080:80"]`, `environment: {A: base, B: base}`. `compose.override.yaml` (tự được nạp) có cho `web`: `command: ["sleep", "99"]`, `ports: ["9090:80"]`, `environment: {B: over, C: over}`. Sau khi gộp, những phát biểu nào đúng?',
    options: [
      { content: 'Chỉ cổng host 9090 được publish, vì danh sách `ports` của file override thay thế danh sách gốc' },
      { content: 'Cả cổng host 8080 và 9090 đều được publish tới cổng 80 (`ports` được nối lại)', correct: true },
      { content: 'Lệnh chạy là `sleep 99`, vì `command` của file override thay giá trị gốc', correct: true },
      { content: '`environment` chỉ còn `B` và `C`, vì mục `environment` của override thay toàn bộ phần gốc' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'hard', type: 'single_choice',
    stem: 'File Compose:\n```yaml\nservices:\n  db:\n    image: busybox\n    command: ["sleep", "300"]\n    healthcheck: {test: ["CMD", "false"], interval: 1s, retries: 2}\n  web:\n    image: busybox\n    command: ["sleep", "300"]\n    depends_on:\n      db: {condition: service_healthy}\n```\nChạy `docker compose up -d`. Điều gì xảy ra?',
    options: [
      { content: 'Lệnh `up -d` thoát với lỗi khi `db` thành unhealthy, và `web` chỉ được tạo chứ không được start', correct: true },
      { content: '`web` khởi động ngay như `service_started`, vì healthcheck chỉ để hiển thị trạng thái' },
      { content: '`db` khởi động, `web` chờ vô hạn và lệnh `up -d` treo, không bao giờ thoát' },
      { content: '`web` khởi động sau khi `db` dùng hết `retries`, vì Compose bỏ qua điều kiện khi hết lượt thử' },
    ],
  },
  {
    domain: 'Docker Compose', difficulty: 'hard', type: 'single_choice',
    stem: 'File `.env` có dòng `PORT=` (giá trị rỗng) và không có biến `API_HOST`; shell cũng không đặt hai biến này. Trong `compose.yaml` có ba giá trị: `a: "${PORT:-8080}"`, `b: "${PORT-8080}"`, `c: "${API_HOST-example}"`. Sau khi nội suy, `a`, `b`, `c` lần lượt là gì?',
    options: [
      { content: '`8080`, `8080`, (rỗng)' },
      { content: '(rỗng), `8080`, `example`' },
      { content: '`8080`, `8080`, `example`' },
      { content: '`8080`, (rỗng), `example`', correct: true },
    ],
  },
];
