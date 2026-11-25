import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice; 6–7 câu/domain.
// Môi trường kiểm: Debian 13 (image postgres:18), bash 5.2.37, GNU coreutils 9.7, sed 4.9, awk = mawk 1.3.4.
// Câu về quyền chạy bằng user thường (useradd + runuser); systemd/cron/apt/free/Ctrl+Z/inode đối chiếu man page (freedesktop.org, manpages.debian.org, man7.org).
export const LINUX: SkillSeedQuestion[] = [
  // ───────────── Filesystem & links ─────────────
  {
    domain: "Filesystem & links",
    difficulty: "easy", type: "single_choice",
    stem: "Thư mục `proj` chứa file `a.txt`, file ẩn `.env` và thư mục con `src/`. Trong bash (cấu hình mặc định, không bật `dotglob`) bạn chạy `rm -r proj/*`. Sau đó `ls -A proj` hiển thị gì?",
    options: [
      { content: "Trống: `*` khớp mọi mục trong thư mục nên cả ba đều bị xoá" },
      { content: "Còn `.env` và `src`: `rm -r` bỏ qua thư mục con nếu không thêm `-f`" },
      { content: "Chỉ còn `.env`: `*` không khớp tên bắt đầu bằng dấu chấm nên `.env` không bị xoá", correct: true },
      { content: "Còn `a.txt` và `.env`: `*` chỉ khớp thư mục con nên chỉ `src` bị xoá" },
    ],
  },
  {
    domain: "Filesystem & links",
    difficulty: "easy", type: "multiple_choice",
    stem: "Chạy lần lượt: `echo data > orig.txt; ln orig.txt hard.txt; ln -s orig.txt soft.txt; rm orig.txt`. Chọn các phát biểu đúng.",
    options: [
      { content: "`cat hard.txt` vẫn in `data`: dữ liệu chỉ mất khi không còn tên nào trỏ tới inode", correct: true },
      { content: "`cat soft.txt` vẫn in `data` vì symlink giữ riêng một bản sao dữ liệu của file gốc, không phụ thuộc tên cũ" },
      { content: "`cat soft.txt` báo `No such file or directory`: symlink chỉ lưu đường dẫn `orig.txt`, giờ đã mất", correct: true },
      { content: "`cat hard.txt` báo lỗi vì `hard.txt` chỉ là lối tắt dẫn về tên `orig.txt` đã bị xoá, nên cũng không còn đích" },
    ],
  },
  {
    domain: "Filesystem & links",
    difficulty: "medium", type: "single_choice",
    stem: "Có sẵn `/tmp/m1/docs/a.txt` và thư mục rỗng `/tmp/m1/x`. Đứng ở `/tmp/m1` bạn chạy:\n\n```bash\nln -s docs/a.txt x/link\ncat x/link\n```\n\nKết quả của `cat` là gì?",
    options: [
      { content: "`No such file or directory`: đích tương đối được tính từ thư mục chứa link, tức `x/docs/a.txt`", correct: true },
      { content: "In nội dung `a.txt`: đích tương đối được tính từ thư mục đang đứng lúc chạy `cat`" },
      { content: "In nội dung `a.txt`: `ln -s` đổi `docs/a.txt` thành đường dẫn tuyệt đối ngay lúc tạo link" },
      { content: "`ln -s` báo lỗi ngay lúc tạo vì `x/docs/a.txt` chưa tồn tại" },
    ],
  },
  {
    domain: "Filesystem & links",
    difficulty: "medium", type: "single_choice",
    stem: "Thư mục hiện tại có file `a.log` và thư mục `sub/` chứa `b.log`, `c.log` (không còn file `.log` nào khác ở thư mục hiện tại). Bạn chạy trong bash mặc định:\n\n```bash\nfind . -name *.log\n```\n\nKết quả là gì?",
    options: [
      { content: "In cả ba: `./a.log`, `./sub/b.log`, `./sub/c.log`, vì `find` tự khớp mẫu ở mọi cấp thư mục" },
      { content: "Không in gì: `a.log` được truyền cho `-name`, mà `find` chỉ khớp được với đường dẫn đầy đủ `./a.log`" },
      { content: "Lỗi `find: paths must precede expression`: `-name` không nhận mẫu khi chưa quote" },
      { content: "Chỉ in `./a.log`: bash đã thay `*.log` thành `a.log` trước khi `find` chạy", correct: true },
    ],
  },
  {
    domain: "Filesystem & links",
    difficulty: "medium", type: "single_choice",
    stem: "Cây thư mục có ba file: `a.log`, `sub/b.log`, `sub/c.log`. Hai lệnh sau in ra gì?\n\n```bash\nfind . -name '*.log' -exec sh -c 'echo run: $#' _ {} \\;\nfind . -name '*.log' -exec sh -c 'echo run: $#' _ {} +\n```",
    options: [
      { content: "Lệnh đầu in `run: 3` một lần; lệnh sau in `run: 1` ba lần" },
      { content: "Lệnh đầu in `run: 1` ba lần; lệnh sau in `run: 3` một lần", correct: true },
      { content: "Cả hai lệnh đều in `run: 3` một lần, `+` và `\\;` chỉ khác cách báo lỗi" },
      { content: "Cả hai lệnh đều in `run: 1` ba lần, `+` chỉ khác ở chỗ chạy song song" },
    ],
  },
  {
    domain: "Filesystem & links",
    difficulty: "hard", type: "multiple_choice",
    stem: "Thư mục `d` chứa file `real` và symlink `lnk -> real`. Ở thư mục hiện tại còn có symlink `top -> d/real`. Bạn chạy GNU coreutils `cp top top2` và `cp -r d d2` (không thêm tuỳ chọn nào khác). Chọn các phát biểu đúng.",
    options: [
      { content: "`top2` là symlink trỏ tới `d/real`: `cp` sao chép symlink nguồn như một loại tệp đặc biệt khi không có tuỳ chọn" },
      { content: "`top2` là file thường chứa nội dung của `d/real`: không có `-r`, `cp` đi theo symlink nguồn", correct: true },
      { content: "`d2/lnk` là symlink có đích `real`: với `-r`, `cp` sao chép chính symlink chứ không đi theo nó", correct: true },
      { content: "`d2/lnk` là file thường chứa nội dung `real`: với `-r`, `cp` đi theo symlink nằm trong cây thư mục" },
    ],
  },
  {
    domain: "Filesystem & links",
    difficulty: "hard", type: "single_choice",
    stem: "`/tmp/f2/lnk` là symlink tới `/tmp/f2/real/inner`. `/tmp/f2` chứa `lnk`, `real`, `tmpm`; `/tmp/f2/real` chứa `inner` và `marker`. Trong bash mặc định (không bật `set -o physical`) bạn chạy:\n\n```bash\ncd /tmp/f2/lnk\nls ..\ncd ..\npwd\n```\n\n`ls ..` và `pwd` in ra gì?",
    options: [
      { content: "`lnk real tmpm` rồi `/tmp/f2`: cả hai đều coi `..` là thư mục chứa symlink `lnk`" },
      { content: "`inner marker` rồi `/tmp/f2`: `ls` lên thư mục cha thật, còn `cd` lên theo đường dẫn bash nhớ", correct: true },
      { content: "`inner marker` rồi `/tmp/f2/real`: cả hai đều đi theo thư mục thật của symlink" },
      { content: "`lnk real tmpm` rồi `/tmp/f2/real`: `ls` đi theo đường dẫn đã gõ, còn `cd` đi theo thư mục thật" },
    ],
  },
  // ───────────── Permissions & ownership ─────────────
  {
    domain: "Permissions & ownership",
    difficulty: "easy", type: "single_choice",
    stem: "Một phiên bash đặt `umask 027`. Trong phiên đó bạn chạy `touch f` và `mkdir d`. Quyền (dạng số) của `f` và `d` lần lượt là gì?",
    options: [
      { content: "`750` và `750`" },
      { content: "`640` và `640`" },
      { content: "`027` và `027`" },
      { content: "`640` và `750`", correct: true },
    ],
  },
  {
    domain: "Permissions & ownership",
    difficulty: "easy", type: "single_choice",
    stem: "`/tmp` có quyền `drwxrwxrwt`. Người dùng `u1` tạo `/tmp/a` với quyền `666`. Người dùng thường khác là `u2` chạy `echo y >> /tmp/a` rồi `rm -f /tmp/a`. Kết quả?",
    options: [
      { content: "Ghi thêm thành công; `rm -f` báo `Operation not permitted` vì bit `t` cấm xoá file của người khác", correct: true },
      { content: "Cả hai đều bị `Permission denied`: file của `u1` thì `u2` không động vào được" },
      { content: "Ghi thêm bị `Permission denied`, còn `rm -f` thành công vì `u2` có `w` trên thư mục `/tmp`" },
      { content: "Cả hai thành công: `/tmp` cho mọi người ghi, và `a` cho phép mọi người ghi, nên không gì ngăn `u2`" },
    ],
  },
  {
    domain: "Permissions & ownership",
    difficulty: "medium", type: "multiple_choice",
    stem: "Thư mục `/srv/shared` thuộc người dùng thường `u1` với quyền `755`. Trong đó có file `report` thuộc `root`, quyền `644`. `u1` (không dùng `sudo`) lần lượt thử các thao tác trên `report`. Chọn các phát biểu đúng.",
    options: [
      { content: "`rm -f report` thành công: xoá tên file là sửa thư mục, nên chỉ cần quyền `w` và `x` trên `/srv/shared`", correct: true },
      { content: "`rm -f report` bị `Permission denied` vì file thuộc `root` và `u1` không có quyền ghi file đó, dù là chủ thư mục" },
      { content: "`echo new >> report` bị `Permission denied`: ghi vào nội dung file cần quyền `w` của chính file", correct: true },
      { content: "`chmod 600 report` thành công vì `u1` sở hữu thư mục chứa file, tức có quyền quản lý các mục trong đó" },
    ],
  },
  {
    domain: "Permissions & ownership",
    difficulty: "medium", type: "single_choice",
    stem: "File `/srv/g/f` thuộc `root:g1` với quyền `660`. Người dùng `u1` đang có một phiên shell mở sẵn và chưa thuộc nhóm `g1`. Quản trị viên chạy `usermod -aG g1 u1`. Ngay sau đó `u1` chạy `cat /srv/g/f` trong phiên đang mở, rồi đăng nhập một phiên mới và chạy lại. Kết quả?",
    options: [
      { content: "Phiên cũ đọc được ngay vì kernel tra `/etc/group` ở mỗi lần mở file; phiên mới cũng đọc được" },
      { content: "Phiên cũ đọc được ngay; phiên mới phải chạy thêm `newgrp g1` mới đọc được" },
      { content: "Phiên cũ bị `Permission denied`; phiên mới đọc được vì nhóm được nạp vào tiến trình lúc đăng nhập", correct: true },
      { content: "Cả hai phiên đều bị `Permission denied` cho tới khi máy được khởi động lại" },
    ],
  },
  {
    domain: "Permissions & ownership",
    difficulty: "hard", type: "multiple_choice",
    stem: "Thư mục `/srv/d` thuộc `root` với quyền `711` (`rwx--x--x`). Trong đó có file `f` thuộc `root`, quyền `644`. Người dùng thường `u1` thử các lệnh sau. Chọn các phát biểu đúng.",
    options: [
      { content: "`ls -l /srv/d/f` bị `Permission denied` vì `u1` không có quyền `r` trên thư mục" },
      { content: "`cat /srv/d/f` in được nội dung: `x` trên thư mục cho phép đi tới `f` đã biết tên, và `f` cho đọc", correct: true },
      { content: "`ls /srv/d` bị `Permission denied`: liệt kê các mục trong thư mục cần quyền `r` trên thư mục", correct: true },
      { content: "`cat /srv/d/*` in được nội dung `f`, vì có `x` thì shell mở rộng được `*` thành tên các mục trong thư mục" },
    ],
  },
  {
    domain: "Permissions & ownership",
    difficulty: "hard", type: "single_choice",
    stem: "Trên Linux, `/srv/s/who.sh` là script bash (shebang `#!/bin/bash`, nội dung `id -u`) thuộc `root`, quyền `-rwsr-xr-x` (có bit setuid). Người dùng thường `u1` (uid `1000`) chạy trực tiếp `/srv/s/who.sh`. Kết quả in ra là gì?",
    options: [
      { content: "Lỗi `Permission denied`: kernel không cho người dùng thường chạy script thuộc `root` có bit setuid" },
      { content: "`0`, nhưng chỉ khi shebang là `#!/bin/sh` thay vì `#!/bin/bash`" },
      { content: "`1000`: Linux bỏ qua bit setuid trên script có shebang, nên nó chạy với quyền người gọi", correct: true },
      { content: "`0`, vì bash giữ nguyên euid của chủ file thay vì hạ về uid thật" },
    ],
  },
  // ───────────── Processes & signals ─────────────
  {
    domain: "Processes & signals",
    difficulty: "easy", type: "single_choice",
    stem: "Bạn chạy `sleep 300` ở foreground trong terminal rồi nhấn Ctrl+Z. Điều gì xảy ra với tiến trình?",
    options: [
      { content: "Tiến trình bị tạm dừng, vẫn nằm trong `jobs` và tiếp tục được bằng `fg` hoặc `bg`", correct: true },
      { content: "Tiến trình chuyển xuống chạy nền và tiếp tục đếm giờ như khi chạy với `&`" },
      { content: "Tiến trình bị chấm dứt như khi nhấn Ctrl+C và biến mất khỏi `jobs`" },
      { content: "Tiến trình tách khỏi terminal và vẫn chạy khi bạn đóng cửa sổ terminal" },
    ],
  },
  {
    domain: "Processes & signals",
    difficulty: "easy", type: "single_choice",
    stem: "Một bước CI (bash 5.2) chạy `./deploy.sh` rồi kết thúc với mã thoát `127`. Nguyên nhân khả dĩ nhất là gì?",
    options: [
      { content: "File `deploy.sh` có tồn tại nhưng không có quyền thực thi" },
      { content: "Tiến trình bị kernel giết bằng SIGKILL vì hết bộ nhớ" },
      { content: "Một lệnh trong script chạy xong nhưng báo lỗi chung, ví dụ `grep` không khớp dòng nào" },
      { content: "Một lệnh được gọi trong script mà shell không tìm thấy trong `PATH`", correct: true },
    ],
  },
  {
    domain: "Processes & signals",
    difficulty: "medium", type: "multiple_choice",
    stem: "Trên Linux, một tiến trình ở trạng thái `Z` (zombie) hiện trong `ps`, và một script bash khác đã đặt `trap '' TERM` rồi lặp vô hạn. Chọn các phát biểu đúng.",
    options: [
      { content: "Zombie không chết vì `kill -9` (nó đã kết thúc); nó chỉ biến mất khi cha gọi `wait` hoặc thoát", correct: true },
      { content: "Zombie chiếm CPU và bộ nhớ như một tiến trình đang chạy, nên nhiều zombie làm máy chậm đi rõ rệt" },
      { content: "`kill -9` kết thúc được script đang bỏ qua SIGTERM, vì SIGKILL không thể bị bắt, chặn hay bỏ qua", correct: true },
      { content: "Khi cha của một tiến trình đang chạy thoát, kernel tự dừng tiến trình con đó để tránh bị mồ côi" },
    ],
  },
  {
    domain: "Processes & signals",
    difficulty: "medium", type: "single_choice",
    stem: "Trong bash, đoạn sau in ra số nào?\n\n```bash\nsleep 100 &\np=$!\nkill $p\nwait $p\necho $?\n```",
    options: [
      { content: "`0`, vì `kill` chạy thành công nên `wait` trả mã 0" },
      { content: "`143`, tức 128 cộng số hiệu của SIGTERM", correct: true },
      { content: "`137`, vì `kill` mặc định gửi SIGKILL" },
      { content: "`15`, đúng số hiệu của SIGTERM" },
    ],
  },
  {
    domain: "Processes & signals",
    difficulty: "hard", type: "multiple_choice",
    stem: "Debian 13, systemd-logind mặc định (`KillUserProcesses=no`). Trong một bash tương tác bạn chạy `sleep 1001 &`, `nohup sleep 1002 &` và `sleep 1003 &` (lệnh thứ ba được `disown` ngay sau đó). Rồi bạn đóng cửa sổ terminal, bash nhận SIGHUP. Chọn các phát biểu đúng.",
    options: [
      { content: "`sleep 1001` bị kết thúc: bash tương tác gửi SIGHUP cho các job còn trong bảng job khi thoát", correct: true },
      { content: "`sleep 1001` vẫn sống vì chạy với `&` nghĩa là đã tách khỏi terminal điều khiển và không nhận SIGHUP" },
      { content: "`nohup sleep 1002` vẫn bị kết thúc vì kernel gửi SIGHUP cho mọi tiến trình dùng terminal đó, bất kể `nohup`" },
      { content: "`sleep 1003` (đã `disown`) vẫn sống: bash không còn gửi SIGHUP cho nó nữa", correct: true },
    ],
  },
  {
    domain: "Processes & signals",
    difficulty: "hard", type: "single_choice",
    stem: "Script sau được chạy ở nền; đúng 1 giây sau, tiến trình bash của script nhận `kill $pid` (SIGTERM):\n\n```bash\n#!/bin/bash\ntrap 'echo \"caught\"' TERM\nsleep 4\necho \"end\"\n```\n\nĐiều gì xảy ra (bash 5.2)?",
    options: [
      { content: "`caught` in ngay ở giây thứ 1, rồi script tiếp tục chờ `sleep` và in `end` ở giây thứ 4" },
      { content: "`caught` chỉ in sau khi `sleep 4` kết thúc, rồi script in `end` và thoát với mã 0", correct: true },
      { content: "`caught` in ngay ở giây thứ 1, rồi script thoát và không bao giờ in `end`" },
      { content: "Script bị dừng ngay ở giây thứ 1, không in gì thêm, còn `sleep` tiếp tục chạy mồ côi" },
    ],
  },
  // ───────────── Shell scripting ─────────────
  {
    domain: "Shell scripting",
    difficulty: "easy", type: "single_choice",
    stem: "Với `name=An`, lệnh `echo '$name' \"$name\"` in ra gì?",
    options: [
      { content: "`An An`" },
      { content: "`$name $name`" },
      { content: "`An $name`" },
      { content: "`$name An`", correct: true },
    ],
  },
  {
    domain: "Shell scripting",
    difficulty: "easy", type: "multiple_choice",
    stem: "File `s.sh` có hai dòng `cd /var` và `x=1`. Bạn đang ở `/tmp` trong một shell tương tác có `x=0` và đã `chmod +x s.sh`. Chọn các phát biểu đúng.",
    options: [
      { content: "`source ./s.sh` đổi thư mục hiện tại sang `/var` và đặt `x=1` trong shell đang dùng", correct: true },
      { content: "`./s.sh` đổi thư mục hiện tại của shell đang dùng sang `/var` vì script chạy ngay trong shell đó" },
      { content: "`./s.sh` không đổi thư mục hiện tại và không đổi `x` của shell đang dùng vì chạy trong tiến trình con", correct: true },
      { content: "`source ./s.sh` chạy trong tiến trình con nên thay đổi bị mất khi script kết thúc" },
    ],
  },
  {
    domain: "Shell scripting",
    difficulty: "medium", type: "single_choice",
    stem: "Trong bash 5.2, đoạn sau in ra gì?\n\n```bash\na=10; b=9\n[[ $a < $b ]] && echo A || echo B\n[ \"$a\" -lt \"$b\" ] && echo C || echo D\n```",
    options: [
      { content: "`A` rồi `D`", correct: true },
      { content: "`B` rồi `D`" },
      { content: "`B` rồi `C`" },
      { content: "`A` rồi `C`" },
    ],
  },
  {
    domain: "Shell scripting",
    difficulty: "medium", type: "single_choice",
    stem: "Hàm `count` in số đối số nhận được. Đoạn sau in ra bốn số nào, theo thứ tự?\n\n```bash\ncount() { echo $#; }\nset -- \"a b\" c\ncount $*\ncount \"$*\"\ncount $@\ncount \"$@\"\n```",
    options: [
      { content: "`2 1 2 2`" },
      { content: "`3 1 2 2`" },
      { content: "`3 1 3 2`", correct: true },
      { content: "`3 3 3 2`" },
    ],
  },
  {
    domain: "Shell scripting",
    difficulty: "medium", type: "single_choice",
    stem: "Trong một script bash 5.2 (không bật `shopt -s lastpipe`), đoạn sau in ra gì?\n\n```bash\nn=0\nprintf 'a\\nb\\nc\\n' | while read -r line; do\n  n=$((n+1))\ndone\necho \"$n\"\n```",
    options: [
      { content: "`3`" },
      { content: "`1`" },
      { content: "`0`", correct: true },
      { content: "`2`" },
    ],
  },
  {
    domain: "Shell scripting",
    difficulty: "hard", type: "single_choice",
    stem: "Script chạy bằng bash 5.2. Nó in ra gì?\n\n```bash\nset -e\nf() {\n  false\n  echo \"after false\"\n}\nif f; then echo \"ok\"; fi\necho \"end\"\n```",
    options: [
      { content: "`after false`, `ok`, `end` — `set -e` không có tác dụng trong hàm đang làm điều kiện của `if`", correct: true },
      { content: "`end` — `set -e` dừng riêng `f` ở `false`, `f` trả mã khác 0 nên nhánh `then` bị bỏ qua" },
      { content: "Không in gì: `set -e` thoát cả script ngay tại lệnh `false` bên trong hàm `f`" },
      { content: "`after false`, `end` — `set -e` bị tắt, nhưng `f` vẫn trả mã khác 0 nên nhánh `then` bị bỏ qua" },
    ],
  },
  {
    domain: "Shell scripting",
    difficulty: "hard", type: "single_choice",
    stem: "Bash 5.2, không bật `set -e`. Hai hàm sau in ra gì?\n\n```bash\na() { local out=$(false); echo \"A: $?\"; }\nb() { local out; out=$(false); echo \"B: $?\"; }\na\nb\n```",
    options: [
      { content: "`A: 1` rồi `B: 1`" },
      { content: "`A: 1` rồi `B: 0`" },
      { content: "`A: 0` rồi `B: 0`" },
      { content: "`A: 0` rồi `B: 1`", correct: true },
    ],
  },
  // ───────────── Text processing & redirection ─────────────
  {
    domain: "Text processing & redirection",
    difficulty: "easy", type: "single_choice",
    stem: "Chạy lần lượt trong bash: `echo a > f; echo b > f; echo c >> f; cat f`. `cat f` in ra gì?",
    options: [
      { content: "Ba dòng `a`, `b`, `c`" },
      { content: "Hai dòng `b` và `c`", correct: true },
      { content: "Một dòng `c`" },
      { content: "Hai dòng `a` và `c`" },
    ],
  },
  {
    domain: "Text processing & redirection",
    difficulty: "easy", type: "single_choice",
    stem: "Hai lệnh sau in ra những số nào, theo thứ tự?\n\n```bash\nprintf 'b\\na\\nb\\na\\n' | uniq | wc -l\nprintf 'b\\na\\nb\\na\\n' | sort | uniq | wc -l\n```",
    options: [
      { content: "`2` rồi `2`" },
      { content: "`4` rồi `2`", correct: true },
      { content: "`2` rồi `4`" },
      { content: "`4` rồi `4`" },
    ],
  },
  {
    domain: "Text processing & redirection",
    difficulty: "medium", type: "single_choice",
    stem: "Thư mục có file `ok.txt` và không có `/nonexistent`. So sánh hai lệnh (bash):\n\n```bash\nls /nonexistent ok.txt >out1 2>&1\nls /nonexistent ok.txt 2>&1 >out2\n```\n\nĐiều gì đúng?",
    options: [
      { content: "Cả hai lệnh: terminal trống, `out1` và `out2` đều chứa cả thông báo lỗi lẫn `ok.txt`" },
      { content: "Lệnh đầu: terminal hiện lỗi, `out1` chỉ có `ok.txt`. Lệnh sau: terminal trống, `out2` chứa cả hai" },
      { content: "Cả hai lệnh: terminal hiện lỗi, `out1` và `out2` chỉ chứa `ok.txt`" },
      { content: "Lệnh đầu: terminal trống, `out1` chứa cả hai. Lệnh sau: terminal hiện lỗi, `out2` chỉ có `ok.txt`", correct: true },
    ],
  },
  {
    domain: "Text processing & redirection",
    difficulty: "medium", type: "single_choice",
    stem: "File `d.txt` có ba dòng `b`, `a`, `c`. Trong bash bạn chạy `sort d.txt > d.txt`. Kết quả?",
    options: [
      { content: "`d.txt` rỗng (0 byte) và `sort` thoát mã 0: shell cắt file về 0 byte trước khi `sort` đọc", correct: true },
      { content: "`d.txt` thành ba dòng `a`, `b`, `c`, vì `sort` đọc hết file rồi mới ghi" },
      { content: "`sort` báo `input file is output file` và `d.txt` giữ nguyên ba dòng cũ" },
      { content: "`d.txt` thành sáu dòng: ba dòng cũ rồi ba dòng đã sắp xếp nối thêm vào cuối" },
    ],
  },
  {
    domain: "Text processing & redirection",
    difficulty: "hard", type: "single_choice",
    stem: "Thư mục có ba file: `a b.txt` (tên có dấu cách), `b.txt` và `a`. Bạn chạy GNU findutils và xargs mặc định:\n\n```bash\nfind . -name '*.txt' | xargs rm\n```\n\nNhững file nào còn lại?",
    options: [
      { content: "Còn `a`: `xargs` đọc theo dòng nên xoá được cả `a b.txt` lẫn `b.txt`" },
      { content: "Còn `a b.txt` và `a`: `rm` bỏ qua tên có dấu cách, chỉ xoá `b.txt`" },
      { content: "Chỉ còn `a b.txt`: `xargs` tách nó thành `./a` và `b.txt`, nên xoá nhầm `a` cùng `b.txt`", correct: true },
      { content: "Còn `a b.txt` và `b.txt`: chỉ `a` bị xoá nhầm vì `xargs` tách `./a b.txt` thành hai mảnh" },
    ],
  },
  {
    domain: "Text processing & redirection",
    difficulty: "hard", type: "single_choice",
    stem: "Dòng `a  b   c` có hai dấu cách giữa `a` và `b`, ba dấu cách giữa `b` và `c`. Hai lệnh sau in ra gì (GNU coreutils, awk là mawk)?\n\n```bash\necho 'a  b   c' | cut -d' ' -f2\necho 'a  b   c' | awk '{print $2}'\n```",
    options: [
      { content: "`b` rồi `b`" },
      { content: "`b` rồi một dòng trống" },
      { content: "Một dòng trống rồi `b`", correct: true },
      { content: "Một dòng trống rồi một dòng trống" },
    ],
  },
  {
    domain: "Text processing & redirection",
    difficulty: "hard", type: "single_choice",
    stem: "Trong bash 5.2, file `app.log` có hai dòng `ok` và không dòng nào chứa `ERROR`. Đoạn sau in ra gì?\n\n```bash\ncount=$(grep -c ERROR app.log || echo 0)\necho \"[$count]\"\n```",
    options: [
      { content: "Hai dòng `[0` và `0]`, vì `grep -c` in `0` nhưng thoát mã 1 nên `echo 0` cũng chạy", correct: true },
      { content: "`[]`, vì `grep -c` không in gì khi không có dòng khớp, rồi `echo 0` chạy" },
      { content: "`[0]`, vì `grep -c` in `0` và thoát mã 0 nên `echo 0` không chạy" },
      { content: "`[00]`, vì hai kết quả được nối liền nhau trong biến" },
    ],
  },
  // ───────────── System administration ─────────────
  {
    domain: "System administration",
    difficulty: "easy", type: "multiple_choice",
    stem: "Một máy Debian vừa có bản vá mới của `openssl` trên kho đã khai báo trong `sources.list`. Chọn các phát biểu đúng về `apt update` và `apt upgrade`.",
    options: [
      { content: "`apt update` chỉ làm mới danh sách gói (package index) từ các kho, không cài hay gỡ gói nào", correct: true },
      { content: "`apt update` nâng cấp các gói đã cài lên bản mới, còn `apt upgrade` nâng cả hệ thống lên bản Debian kế tiếp" },
      { content: "`apt upgrade` tự làm mới danh sách gói trước khi nâng cấp nên chạy riêng `apt update` là thừa" },
      { content: "Muốn nhận bản vá, cần `apt update` để thấy bản mới, rồi `apt upgrade` (hoặc `apt install openssl`) để cài", correct: true },
    ],
  },
  {
    domain: "System administration",
    difficulty: "easy", type: "single_choice",
    stem: "Dịch vụ `nginx` đã cài, đang tắt. Bạn chạy `sudo systemctl enable nginx` (không kèm `--now`). Điều gì đúng?",
    options: [
      { content: "`nginx` chạy ngay và tự khởi động lại ở mỗi lần boot" },
      { content: "`nginx` chạy ngay nhưng sau khi reboot nó lại tắt" },
      { content: "Không có gì thay đổi cho tới khi chạy thêm `systemctl daemon-reload`" },
      { content: "`nginx` chưa chạy ngay; nó sẽ tự khởi động ở lần boot kế tiếp", correct: true },
    ],
  },
  {
    domain: "System administration",
    difficulty: "easy", type: "single_choice",
    stem: "Kết quả `free -h` trên một máy chủ web:\n\n```text\n               total   used   free   shared  buff/cache   available\nMem:           7.7Gi  1.4Gi  0.3Gi    45Mi        6.2Gi       6.3Gi\n```\n\nĐồng nghiệp báo \"RAM chỉ còn 0.3Gi, sắp hết\". Nhận định nào hợp lý?",
    options: [
      { content: "Đúng, cột `free` là lượng RAM còn cấp được; phần `buff/cache` bị kernel giữ lại, không trả cho tiến trình" },
      { content: "Chưa thiếu: page cache trong `buff/cache` được thu hồi khi cần, `available` mới là RAM cấp được", correct: true },
      { content: "Đúng, nên chạy `drop_caches` ngay vì cache đang tranh RAM với các tiến trình đang chạy" },
      { content: "Thiếu thật: `used` cộng `buff/cache` gần bằng `total`, tức mọi vùng nhớ đều đã có chủ" },
    ],
  },
  {
    domain: "System administration",
    difficulty: "medium", type: "single_choice",
    stem: "Script `/home/an/run.sh` gọi `node` (cài bằng nvm, thư mục của nó được thêm vào `PATH` trong `~/.bashrc`). Chạy tay trong terminal thì ổn. Sau khi thêm dòng `0 2 * * * /home/an/run.sh` vào crontab của chính user `an` (cron trên Debian), log báo `node: command not found`. Nguyên nhân khả dĩ nhất là gì?",
    options: [
      { content: "Job cron chạy bằng `root` nên không thấy các lệnh cài riêng cho user `an`" },
      { content: "Cron chạy job với `PATH` tối giản, không nạp `~/.bashrc`, nên không thấy `node`", correct: true },
      { content: "`node` chỉ chạy được khi có terminal (TTY), mà cron chạy job không có terminal" },
      { content: "Cron chạy script ở thư mục `/` nên `node` không tìm thấy thư mục dự án" },
    ],
  },
  {
    domain: "System administration",
    difficulty: "medium", type: "multiple_choice",
    stem: "Server báo `/var` đầy 100% theo `df -h /var`, nhưng `du -sh /var` chỉ ra khoảng 3G trên ổ 20G. Trước đó quản trị viên đã `rm /var/log/app/big.log` (khoảng 16G) trong lúc tiến trình `app` đang chạy và đang giữ file đó mở. Chọn các phát biểu đúng.",
    options: [
      { content: "`du` không đếm journal và metadata của ext4; phần chênh khoảng 16G chính là chúng, không lấy lại được" },
      { content: "Dung lượng chưa được trả lại vì `app` còn giữ file mở; khởi động lại dịch vụ (đóng file) sẽ trả lại", correct: true },
      { content: "Chạy `sync` hoặc `fsck` trên `/var` sẽ trả lại dung lượng ngay cả khi `app` vẫn đang chạy" },
      { content: "`ls -l /proc/<PID của app>/fd` có một mục trỏ tới `big.log` kèm chữ `(deleted)`", correct: true },
    ],
  },
  {
    domain: "System administration",
    difficulty: "hard", type: "single_choice",
    stem: "Dịch vụ `app.service` (unit nằm ở `/etc/systemd/system/app.service`) đang chạy. Bạn sửa dòng `ExecStart=` để trỏ tới binary mới, lưu file rồi chạy `systemctl restart app`, không chạy thêm lệnh nào khác (systemd trên Debian 13). Điều gì xảy ra?",
    options: [
      { content: "Dịch vụ khởi động lại bằng `ExecStart` mới: `restart` đọc lại file unit trên đĩa" },
      { content: "Dịch vụ dùng `ExecStart` mới, nhưng chỉ sau khi chạy lại `systemctl enable app` để ghi lại symlink" },
      { content: "`restart` báo lỗi và không khởi động lại dịch vụ cho tới khi chạy `daemon-reload`" },
      { content: "Dịch vụ khởi động lại nhưng vẫn dùng `ExecStart` cũ; systemd cảnh báo cần `daemon-reload`", correct: true },
    ],
  },
  {
    domain: "System administration",
    difficulty: "hard", type: "single_choice",
    stem: "Một phân vùng ext4 gắn ở `/data` có `df -h /data` báo `Use% = 38%`. Một user thường có quyền ghi vào thư mục, nhưng `touch /data/new` báo `No space left on device`. Nguyên nhân khả dĩ nhất là gì?",
    options: [
      { content: "Đã dùng hết inode do có hàng triệu file nhỏ; kiểm tra bằng `df -i /data`", correct: true },
      { content: "Phân vùng đang được gắn chỉ đọc nên mọi thao tác tạo file đều thất bại" },
      { content: "Khoản 5% dung lượng dành riêng cho `root` khiến user thường không ghi được" },
      { content: "Tiến trình đã dùng hết số file descriptor cho phép (`ulimit -n`)" },
    ],
  },
];
