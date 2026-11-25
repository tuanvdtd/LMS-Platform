import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 10 câu multiple_choice; 8 câu/domain.
// Kubernetes 1.32, chỉ tính năng GA/ổn định. Máy không có cluster: đáp án đối chiếu kubernetes.io/docs (v1.32);
// manifest/lệnh kiểm bằng kubectl v1.32.3 `create ... --dry-run=client`. Hành vi phụ thuộc cấu hình cluster ghi rõ trong đề.
// Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const KUBERNETES: SkillSeedQuestion[] = [
  // ---- Pods & workloads ----
  {
    domain: "Pods & workloads",
    difficulty: "easy", type: "single_choice",
    stem: "Một Pod có hai container: `app` nghe cổng 8080 và `sidecar` cần gọi `app`. Cách gọi nào đúng theo mô hình mạng của Pod?",
    options: [
      { content: "`sidecar` gọi `app` qua IP riêng của `app`, vì mỗi container trong Pod được cấp một IP khác nhau" },
      { content: "`sidecar` gọi `localhost:8080`, vì các container cùng Pod dùng chung network namespace và địa chỉ IP", correct: true },
      { content: "`sidecar` phải gọi qua một Service, vì hai container cùng Pod không kết nối trực tiếp được với nhau" },
      { content: "`sidecar` gọi `app:8080` theo tên container, vì Kubernetes tạo sẵn bản ghi DNS cho từng container" },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "easy", type: "single_choice",
    stem: "Deployment `web` có `replicas: 3`. Bạn chạy `kubectl delete pod` để xoá một trong ba Pod của nó. Điều gì xảy ra tiếp theo?",
    options: [
      { content: "Deployment chỉ còn 2 Pod cho tới khi bạn tự tạo lại, vì Pod đã bị xoá thủ công" },
      { content: "Kubernetes sửa `replicas` của Deployment xuống 2 để khớp với số Pod còn lại" },
      { content: "ReplicaSet tạo một Pod mới (tên khác) để đưa số Pod về lại 3 như trạng thái mong muốn", correct: true },
      { content: "Pod bị xoá được dựng lại với đúng tên cũ, vì Deployment giữ tên Pod cố định như StatefulSet" },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "easy", type: "multiple_choice",
    stem: "Chọn các phát biểu đúng về cách chọn workload controller cho từng nhu cầu.",
    options: [
      { content: "Agent thu thập log cần chạy trên mọi node: dùng DaemonSet để mỗi node phù hợp có một bản sao Pod", correct: true },
      { content: "Cơ sở dữ liệu cần tên Pod và ổ đĩa ổn định cho từng bản sao: dùng Deployment cho gọn nhẹ" },
      { content: "Backup cơ sở dữ liệu mỗi đêm: dùng CronJob, đến lịch nó tạo một Job để chạy tác vụ rồi dừng", correct: true },
      { content: "Web server stateless cần giữ 3 bản sao chạy mãi: dùng Job với `completions: 3` để tự thay Pod lỗi" },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "medium", type: "single_choice",
    stem: "Deployment có `replicas: 4` với cấu hình:\n\n```yaml\nstrategy:\n  type: RollingUpdate\n  rollingUpdate:\n    maxSurge: 1\n    maxUnavailable: 0\n```\n\nTrong lúc rolling update sang image mới, xét số Pod đang chạy (không tính Pod đang Terminating). Điều nào đúng?",
    options: [
      { content: "Số Pod tối đa là 4; Pod cũ bị xoá trước rồi mới tạo Pod mới thay thế" },
      { content: "Số Pod có thể lên tới 5, nhưng số Pod available được phép tạm xuống còn 3" },
      { content: "Mỗi lần tạo 1 Pod mới thì xoá ngay 1 Pod cũ, nên số Pod giữ đúng 4 suốt quá trình" },
      { content: "Số Pod có thể lên tới 5, và số Pod available không xuống dưới 4", correct: true },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "medium", type: "single_choice",
    stem: "Deployment `api` đang chạy. Bạn sửa file YAML: đổi `spec.selector.matchLabels` từ `app: api` thành `app: api-v2` (và đổi label trong Pod template cho khớp) rồi `kubectl apply`. Kết quả?",
    options: [
      { content: "API server từ chối vì `spec.selector` của Deployment không đổi được sau khi đã tạo", correct: true },
      { content: "Deployment rolling update sang selector mới, Pod cũ được thay dần bằng Pod mang label `app: api-v2`" },
      { content: "Apply thành công, nhưng Pod cũ thành Pod mồ côi và tiếp tục chạy ngoài sự quản lý của Deployment" },
      { content: "Apply thành công và Kubernetes xoá hết Pod cũ cùng lúc rồi tạo lại toàn bộ với selector mới" },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "medium", type: "multiple_choice",
    stem: "Pod có hai init container `wait-db` và `migrate` (khai báo theo thứ tự này) cùng container ứng dụng `app`; `restartPolicy` của Pod là mặc định. Chọn các phát biểu đúng.",
    options: [
      { content: "`wait-db` phải chạy xong thành công thì `migrate` mới bắt đầu; các init container chạy lần lượt", correct: true },
      { content: "Nếu `migrate` thoát với lỗi, kubelet chạy lại nó và `app` chưa khởi động cho tới khi `migrate` thành công", correct: true },
      { content: "Init container chạy song song với `app` để rút ngắn thời gian khởi động, cả ba bắt đầu cùng lúc" },
      { content: "Init container không dùng chung volume với `app` được, vì mỗi init container có hệ tệp riêng bị xoá khi xong" },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "hard", type: "single_choice",
    stem: "StatefulSet `db` có `replicas: 3` và dùng `podManagementPolicy` mặc định. Pod `db-0` đã Running nhưng readiness probe của nó thất bại liên tục. Điều gì xảy ra với `db-1` và `db-2`?",
    options: [
      { content: "Chúng được tạo ngay và chạy bình thường, vì `podManagementPolicy` mặc định là `Parallel`" },
      { content: "Chúng chưa được tạo, vì Pod `db-1` chỉ được tạo sau khi `db-0` đã Running và Ready", correct: true },
      { content: "Chúng được tạo nhưng ở trạng thái `Pending` cho tới khi `db-0` vượt qua readiness probe" },
      { content: "`db-0` bị xoá và tạo lại liên tục cho tới khi vượt readiness probe, rồi mới tạo các Pod còn lại" },
    ],
  },
  {
    domain: "Pods & workloads",
    difficulty: "hard", type: "single_choice",
    stem: "Deployment `shop` có 2 revision (đã đổi image từ `v1` sang `v2`) và đang `replicas: 3`. Bạn chạy `kubectl scale deployment shop --replicas=5`, sau đó `kubectl rollout undo deployment shop`. Kết quả?",
    options: [
      { content: "Template quay về `v1` và `replicas` cũng trở về 3, vì undo hoàn tác toàn bộ thay đổi gần nhất" },
      { content: "Không có gì thay đổi, vì thay đổi gần nhất là scale nên undo quay về chính cấu hình hiện tại" },
      { content: "Template về `v1`, `replicas` giữ 5, vì undo chỉ khôi phục Pod template, không đụng `replicas`", correct: true },
      { content: "Template giữ nguyên `v2`, chỉ `replicas` quay về 3, vì undo chỉ đảo ngược lần scale gần nhất" },
    ],
  },

  // ---- Services & networking ----
  {
    domain: "Services & networking",
    difficulty: "easy", type: "single_choice",
    stem: "Service `shop` có `selector: {app: shop}`. Deployment `shop` tạo Pod với label `app: shop-api` trong Pod template. Điều gì xảy ra khi client gọi Service `shop`?",
    options: [
      { content: "Request tới được các Pod, vì Service tìm Pod theo tên Deployment trùng với tên Service" },
      { content: "Request tới được các Pod, vì Service khớp label theo tiền tố (`shop` là tiền tố của `shop-api`)" },
      { content: "Service không tạo được, vì selector không khớp label của Deployment đang có" },
      { content: "Service tạo được nhưng không có endpoint nào, vì label `app` của Pod khác `shop`", correct: true },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "easy", type: "single_choice",
    stem: "Service `web` có `type: NodePort`, `port: 80`, `targetPort: 8080`, `nodePort: 30080` (các thiết lập khác mặc định). Máy ở ngoài cluster, truy cập được mọi cổng trên IP của các node (không có firewall chặn). Gọi Service này bằng địa chỉ nào?",
    options: [
      { content: "`<IP của một node bất kỳ>:30080`; traffic sau đó được chuyển tới cổng 8080 của một Pod", correct: true },
      { content: "`<ClusterIP của Service>:80`, vì ClusterIP truy cập được từ mọi máy có đường tới cluster" },
      { content: "`<IP của một node bất kỳ>:80`, vì `port` là cổng được mở trên mỗi node" },
      { content: "`<IP của node đang chạy Pod>:8080`, vì chỉ node đó mới nhận được traffic của Service" },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "easy", type: "single_choice",
    stem: "Cho một Service:\n\n```yaml\nspec:\n  selector:\n    app: web\n  ports:\n  - port: 80\n    targetPort: 8080\n```\n\nCác Pod `web` nghe ở cổng 8080. Một Pod khác trong cùng namespace gọi Service `web` bằng cách nào?",
    options: [
      { content: "`http://web:8080`, vì client phải dùng đúng cổng mà ứng dụng trong Pod đang nghe" },
      { content: "`http://web:80`, vì `port` là cổng của Service và được chuyển tiếp sang 8080 của Pod", correct: true },
      { content: "Dùng được cả `http://web:80` lẫn `http://web:8080`, vì Service nhận cả hai cổng đã khai báo" },
      { content: "`http://web:30080`, vì Service tự cấp một cổng ngẫu nhiên trên mỗi node cho client" },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "medium", type: "multiple_choice",
    stem: "Cluster dùng cluster domain mặc định `cluster.local`. Một Pod ở namespace `dev` cần gọi Service `db` nằm ở namespace `prod`. Chọn các tên mà Pod đó dùng để kết nối được tới Service này.",
    options: [
      { content: "`db`, vì tên ngắn được phân giải theo namespace của Service đích chứ không theo namespace của Pod" },
      { content: "`db.prod`: tên kèm namespace, phần `svc.cluster.local` được bổ sung nhờ search domain của Pod", correct: true },
      { content: "`db.prod.svc.cluster.local`: tên đầy đủ (FQDN) của Service trong cluster", correct: true },
      { content: "`db.prod.cluster.local`, vì phần `svc` có thể bỏ khi gọi Service ở namespace khác" },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "medium", type: "single_choice",
    stem: "Cluster dùng CNI có hỗ trợ NetworkPolicy. Namespace `shop` có các Pod `db` (label `app: db`), `api` (`app: api`) và `batch` (`app: batch`). Bạn áp dụng:\n\n```yaml\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: db-allow-api\nspec:\n  podSelector:\n    matchLabels:\n      app: db\n  policyTypes: [Ingress]\n  ingress:\n  - from:\n    - podSelector:\n        matchLabels:\n          app: api\n```\n\nĐiều nào đúng?",
    options: [
      { content: "Pod ở namespace khác có label `app: api` cũng vào được `db`, vì `podSelector` trong `from` khớp label trên toàn cluster" },
      { content: "`db` không nhận kết nối từ Pod nào nữa, vì policy chưa khai báo phần `egress`" },
      { content: "Trong namespace `shop`, chỉ `api` vào được `db`; `batch` bị chặn khi vào `db`, các Pod khác không bị đổi quy tắc", correct: true },
      { content: "`db` không kết nối ra ngoài tới Pod nào nữa, vì policy cũng áp dụng cho chiều egress của `db`" },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "medium", type: "single_choice",
    stem: "Bạn apply một Ingress với rule `host: shop.example.com` trỏ tới Service `shop`, nhưng cluster chưa cài Ingress controller nào. Điều nào đúng?",
    options: [
      { content: "Apply bị API server từ chối, vì chỉ tạo được Ingress khi cluster đã có Ingress controller" },
      { content: "kube-proxy tự đọc Ingress và cấu hình định tuyến theo host tới Service `shop`" },
      { content: "Kubernetes tự chuyển Ingress thành Service type LoadBalancer để nhận traffic từ ngoài" },
      { content: "Ingress được tạo nhưng không có controller thực thi rule nên traffic không được định tuyến", correct: true },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "hard", type: "multiple_choice",
    stem: "Service `nginx` khai báo `clusterIP: None`, `port: 80`, `targetPort: 8080` và có `selector` khớp 3 Pod của StatefulSet `web` (với `serviceName: nginx`). Chọn các phát biểu đúng.",
    options: [
      { content: "Truy vấn DNS tên `nginx` trả về IP của từng Pod sẵn sàng thay vì một IP ảo duy nhất của Service", correct: true },
      { content: "Có thể biến một Service ClusterIP đang chạy thành headless bằng cách sửa thành `clusterIP: None` rồi `kubectl apply`" },
      { content: "Mỗi Pod có tên DNS ổn định dạng `web-0.nginx.<namespace>.svc.cluster.local` (cluster domain mặc định `cluster.local`)", correct: true },
      { content: "Client gọi `nginx:80` thì được chuyển sang cổng 8080 của Pod, giống như với một Service ClusterIP thông thường" },
    ],
  },
  {
    domain: "Services & networking",
    difficulty: "hard", type: "single_choice",
    stem: "Service `api` khai báo `targetPort: http`. Deployment `api` đang rolling update: Pod cũ có container port `name: http`, `containerPort: 8080`; Pod mới có container port `name: http`, `containerPort: 9090` (ứng dụng mới nghe 9090). Trong lúc cả hai loại Pod cùng Ready, điều gì xảy ra?",
    options: [
      { content: "Service chuyển tới đúng cổng mỗi Pod khai báo cho tên `http` (8080 hay 9090), không lỗi lệch cổng", correct: true },
      { content: "Service dùng cổng của Pod đầu tiên tìm thấy cho mọi Pod, nên request tới Pod loại kia bị từ chối kết nối" },
      { content: "Apply bị API server từ chối vì hai Pod cùng tên cổng `http` nhưng khác số cổng containerPort" },
      { content: "Service chia traffic tới cả hai cổng 8080 và 9090 trên mọi Pod, nên khoảng một nửa request bị lỗi" },
    ],
  },

  // ---- Configuration & storage ----
  {
    domain: "Configuration & storage",
    difficulty: "easy", type: "single_choice",
    stem: "Một Secret có `data.password: cEBzc3cwcmQ=`. Chọn phát biểu đúng về giá trị này.",
    options: [
      { content: "Đó là bản mã hoá (encryption), người không có khoá giải mã của cluster thì không đọc được nội dung" },
      { content: "Đó chỉ là chuỗi base64 (encoding, không phải encryption); ai đọc được Secret đều giải mã ra `p@ssw0rd`", correct: true },
      { content: "Kubernetes băm giá trị bằng SHA-256, nên không khôi phục được mật khẩu gốc từ chuỗi này" },
      { content: "Đó là chuỗi mã hoá AES, chỉ Pod nào mount Secret mới giải mã được" },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "easy", type: "multiple_choice",
    stem: "Chọn các phát biểu đúng về volume loại `emptyDir`.",
    options: [
      { content: "Dữ liệu trong `emptyDir` được giữ lại khi Pod bị xoá và tạo lại, vì nó nằm trên một PersistentVolume" },
      { content: "Các container trong cùng một Pod có thể mount chung `emptyDir` để trao đổi tệp với nhau", correct: true },
      { content: "Khi một container trong Pod crash và khởi động lại, dữ liệu trong `emptyDir` vẫn còn", correct: true },
      { content: "Khi Pod bị xoá khỏi node, dữ liệu trong `emptyDir` bị xoá theo", correct: true },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "easy", type: "single_choice",
    stem: "Ứng dụng cần lưu dữ liệu sống sót qua việc Pod bị tạo lại, kể cả khi Pod mới được lập lịch sang node khác. Theo mô hình lưu trữ của Kubernetes, người dùng ứng dụng thường làm gì?",
    options: [
      { content: "Ghi dữ liệu vào hệ tệp bên trong container, vì lớp ghi được giữ lại khi Pod được tạo lại" },
      { content: "Dùng volume `hostPath`, vì dữ liệu nằm trên đĩa của node nên còn nguyên khi Pod được tạo lại" },
      { content: "Tạo PersistentVolumeClaim rồi mount vào Pod; PVC yêu cầu dung lượng và được gắn với một PV", correct: true },
      { content: "Tạo ConfigMap chứa dữ liệu rồi mount vào Pod, vì ConfigMap được lưu bền trong etcd" },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "medium", type: "multiple_choice",
    stem: "ConfigMap `app-cfg` có khoá `LEVEL=info`. Các Pod của Deployment `web` nhận nó theo hai cách: biến môi trường (`envFrom` với `configMapRef`) và volume mount tại `/etc/cfg` (không dùng `subPath`). Bạn sửa `LEVEL` thành `debug` mà không đụng tới Deployment. Chọn các phát biểu đúng.",
    options: [
      { content: "Biến môi trường `LEVEL` trong container vẫn là `info` cho tới khi container được tạo lại", correct: true },
      { content: "Tệp `/etc/cfg/LEVEL` được kubelet cập nhật thành `debug` sau một khoảng trễ (chu kỳ sync của kubelet cộng cache)", correct: true },
      { content: "Nếu mount bằng `subPath`, tệp được cập nhật nhanh hơn vì kubelet theo dõi trực tiếp từng khoá" },
      { content: "`kubectl rollout restart deployment web` làm các Pod mới nhận `LEVEL=debug` qua biến môi trường", correct: true },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "medium", type: "single_choice",
    stem: "Cluster có một StorageClass được đánh dấu mặc định (`volumeBindingMode: Immediate`, provisioner hoạt động bình thường). Bạn tạo PVC không khai báo `storageClassName`. Điều gì xảy ra?",
    options: [
      { content: "PVC ở `Pending` mãi, vì PVC bắt buộc khai báo `storageClassName` mới được cấp phát" },
      { content: "PVC chỉ bind được với PV tạo thủ công có sẵn, vì cấp phát động chỉ chạy khi chỉ định StorageClass" },
      { content: "PVC chờ ở `Pending` cho tới khi có Pod dùng nó, vì PV chỉ được cấp phát khi có Pod cần" },
      { content: "Cluster gán StorageClass mặc định cho PVC, rồi PV được cấp phát động và PVC chuyển sang `Bound`", correct: true },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "hard", type: "single_choice",
    stem: "PVC `data` có `accessModes: [ReadWriteOnce]` và đang bind với một PV. Hai Pod của một Deployment cùng mount PVC này. Điều nào đúng?",
    options: [
      { content: "Cả hai Pod ghi được nếu cùng nằm trên một node, vì RWO giới hạn theo node chứ không theo Pod", correct: true },
      { content: "Chỉ một Pod mount được; Pod thứ hai không khởi động được ở node nào, vì RWO giới hạn theo Pod" },
      { content: "Hai Pod mount được trên hai node khác nhau, nhưng chỉ Pod đầu có quyền ghi còn Pod kia chỉ đọc" },
      { content: "Hai Pod mount và ghi được trên mọi node, vì RWO chỉ ngăn nhiều cluster dùng chung một volume" },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "hard", type: "single_choice",
    stem: "StatefulSet `db` có `replicas: 3`, dùng `volumeClaimTemplates` tên `data` và mọi thiết lập khác để mặc định; mỗi Pod ghi dữ liệu riêng vào volume của nó. Bạn scale về `replicas: 1`, một lúc sau scale lên lại `3`. `db-2` mới được tạo sẽ có dữ liệu gì?",
    options: [
      { content: "Volume rỗng, vì khi scale xuống StatefulSet xoá PVC của các Pod có ordinal cao" },
      { content: "Dữ liệu cũ của `db-2`, vì PVC `data-db-2` được giữ khi scale xuống và gắn lại theo đúng tên", correct: true },
      { content: "Volume rỗng, vì PVC `data-db-2` đã chuyển sang `Released` và không bind lại được nữa" },
      { content: "Dữ liệu của `db-0`, vì volume mới được nhân bản từ Pod có ordinal nhỏ nhất" },
    ],
  },
  {
    domain: "Configuration & storage",
    difficulty: "hard", type: "single_choice",
    stem: "PV `pv-a` có `persistentVolumeReclaimPolicy: Retain` và đang `Bound` với PVC `data`. Bạn xoá PVC `data`. Điều nào đúng về `pv-a`?",
    options: [
      { content: "PV bị xoá theo cùng toàn bộ dữ liệu trên volume, vì PV phụ thuộc vào vòng đời của PVC" },
      { content: "PV trở về `Available` ngay, PVC mới cùng yêu cầu tự bind lại và dùng được dữ liệu cũ" },
      { content: "PV thành `Released`, dữ liệu còn nguyên nhưng chưa tự bind lại, cần quản trị viên xử lý", correct: true },
      { content: "PV chuyển sang `Failed` vì mất PVC mà nó đang phục vụ, và phải xoá PV thì mới tạo lại được" },
    ],
  },

  // ---- Scheduling & resources ----
  {
    domain: "Scheduling & resources",
    difficulty: "easy", type: "multiple_choice",
    stem: "Container khai báo `resources.limits.cpu: 500m` và `resources.limits.memory: 256Mi`. Chọn các phát biểu đúng khi container vượt các giới hạn đó.",
    options: [
      { content: "Vượt `limits.cpu` thì container bị kill và khởi động lại, giống như khi vượt giới hạn bộ nhớ" },
      { content: "`requests` là mức tối đa container được dùng; vượt `requests` thì kubelet kill container" },
      { content: "Vượt `limits.cpu` thì container bị throttle (chạy chậm đi) chứ không bị kill", correct: true },
      { content: "Vượt `limits.memory` thì tiến trình bị kernel OOM kill, container báo `OOMKilled` (exit code 137)", correct: true },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "easy", type: "single_choice",
    stem: "Pod `worker` ở `Pending`; `kubectl describe pod worker` có sự kiện `0/3 nodes are available: 3 Insufficient cpu`. Nguyên nhân gần nhất là gì?",
    options: [
      { content: "Container `worker` dùng CPU thực tế vượt `limits` nên bị scheduler từ chối" },
      { content: "Image của `worker` chưa kéo về được node nên Pod chưa chạy" },
      { content: "Readiness probe của `worker` thất bại nên Pod chưa được coi là sẵn sàng" },
      { content: "Không node nào còn đủ CPU chưa cấp phát để đáp ứng `requests.cpu` của Pod", correct: true },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "medium", type: "single_choice",
    stem: "Pod có hai container:\n\n```yaml\ncontainers:\n- name: app\n  image: busybox\n  resources:\n    requests: {cpu: 500m, memory: 256Mi}\n    limits:   {cpu: 500m, memory: 256Mi}\n- name: sidecar\n  image: busybox\n```\n\n`sidecar` không khai báo `resources`. QoS class của Pod là gì?",
    options: [
      { content: "Burstable, vì không phải mọi container đều có requests bằng limits", correct: true },
      { content: "Guaranteed, vì container chính `app` đã đặt requests bằng limits cho cả CPU và memory" },
      { content: "BestEffort, vì chỉ cần một container không khai báo resources là cả Pod bị xếp vào lớp này" },
      { content: "`app` là Guaranteed còn `sidecar` là BestEffort, vì QoS được xét riêng cho từng container" },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "medium", type: "single_choice",
    stem: "Node `gpu-1` có taint `dedicated=gpu:NoSchedule`. Pod `train` có toleration khớp taint này, nhưng không có `nodeSelector` hay affinity. Điều nào đúng?",
    options: [
      { content: "`train` bị ép lập lịch lên `gpu-1`, vì Pod có toleration khớp thì chỉ chạy được trên node đó" },
      { content: "`train` được phép lên `gpu-1` nhưng không bắt buộc; scheduler vẫn có thể đặt nó lên node không có taint", correct: true },
      { content: "`train` không lập lịch được ở node nào, vì Pod có toleration chỉ được chạy trên node có taint" },
      { content: "`train` được ưu tiên lên `gpu-1` và các Pod không có toleration đang chạy ở đó bị đuổi đi" },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "medium", type: "multiple_choice",
    stem: "Bạn tạo HorizontalPodAutoscaler scale Deployment `web` theo mức dùng CPU (`averageUtilization: 70`). Chọn các điều kiện cần để HPA hoạt động đúng.",
    options: [
      { content: "Cluster có Metrics API cung cấp số liệu CPU của Pod, ví dụ cài metrics-server", correct: true },
      { content: "Container có khai báo `limits.cpu`; `requests.cpu` không cần vì HPA tính phần trăm theo limits" },
      { content: "Deployment `web` phải để `replicas` cố định trong manifest để HPA biết số bản sao ban đầu" },
      { content: "Các container của Pod có khai báo `requests.cpu`, vì phần trăm sử dụng được tính trên requests", correct: true },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "hard", type: "single_choice",
    stem: "Cluster có đúng 3 node lập lịch được (không taint, đủ tài nguyên). Deployment `cache` có `replicas: 3`, strategy mặc định (`maxSurge` và `maxUnavailable` đều 25%), Pod template có label `app: cache` và:\n\n```yaml\naffinity:\n  podAntiAffinity:\n    requiredDuringSchedulingIgnoredDuringExecution:\n    - labelSelector:\n        matchLabels:\n          app: cache\n      topologyKey: kubernetes.io/hostname\n```\n\n3 Pod đang chạy, mỗi node một Pod. Bạn đổi image sang phiên bản mới. Điều gì xảy ra?",
    options: [
      { content: "Rollout hoàn tất: Deployment xoá trước một Pod cũ (25% của 3 Pod được tính là 1), rồi Pod mới vào chỗ đó" },
      { content: "Rollout hoàn tất: Pod mới khác `pod-template-hash` với Pod cũ nên không bị anti-affinity với chúng chặn" },
      { content: "Rollout kẹt: 1 Pod mới `Pending`, 3 Pod cũ vẫn chạy, vì `maxSurge` tròn lên thành 1, `maxUnavailable` tròn xuống thành 0", correct: true },
      { content: "Scheduler preempt (đuổi) một Pod cũ để lấy chỗ đặt Pod mới, sau đó rollout tiếp tục bình thường" },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "hard", type: "multiple_choice",
    stem: "Node `n1` đang chạy Pod `p` (`p` không khai báo toleration nào). Chọn các phát biểu đúng về taint.",
    options: [
      { content: "Thêm taint effect `NoSchedule` vào `n1` không đuổi `p`; chỉ Pod mới không có toleration bị từ chối", correct: true },
      { content: "Thêm taint effect `NoExecute` vào `n1` làm `p` bị đuổi (evict), vì `p` không có toleration tương ứng", correct: true },
      { content: "Nếu taint `NoExecute` bị gỡ khỏi node sau 30 giây, Pod có `tolerationSeconds: 60` vẫn bị đuổi khi đủ 60 giây" },
      { content: "Pod có toleration cho taint `NoExecute` kèm `tolerationSeconds: 60` vẫn bị đuổi sau khoảng 60 giây nếu taint còn trên node", correct: true },
    ],
  },
  {
    domain: "Scheduling & resources",
    difficulty: "hard", type: "single_choice",
    stem: "Namespace `team-a` có ResourceQuota với `requests.cpu: \"4\"` và không có LimitRange. Bạn tạo Deployment `web` (3 replicas) mà container không khai báo `resources`. Điều nào đúng?",
    options: [
      { content: "Deployment bị API server từ chối ngay khi apply, vì Pod template thiếu `resources`" },
      { content: "3 Pod được tạo bình thường với `requests.cpu` bằng 0, nên không tính vào quota" },
      { content: "3 Pod được tạo, nhưng kubelet từ chối chạy vì container không có `requests.cpu` khi quota đang bật" },
      { content: "Deployment tạo được nhưng ReplicaSet không tạo nổi Pod, vì quota đòi khai báo `requests.cpu`", correct: true },
    ],
  },

  // ---- Health, debugging & operations ----
  {
    domain: "Health, debugging & operations",
    difficulty: "easy", type: "single_choice",
    stem: "Readiness probe của Pod `api` (đang được Service `api` chọn) thất bại liên tục. Điều gì xảy ra?",
    options: [
      { content: "Pod bị loại khỏi endpoint của Service nên không nhận traffic mới, nhưng container không bị restart", correct: true },
      { content: "Container bị kill và khởi động lại theo `restartPolicy`, giống khi liveness probe thất bại" },
      { content: "Pod bị xoá và ReplicaSet tạo một Pod mới thay thế ở node khác" },
      { content: "Service vẫn gửi traffic tới Pod vì readiness probe chỉ ghi lại một sự kiện cảnh báo" },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "easy", type: "single_choice",
    stem: "Pod `web` ở trạng thái `ImagePullBackOff`. Nguyên nhân thường gặp nhất là gì?",
    options: [
      { content: "Container đã chạy nhưng tiến trình thoát với lỗi, nên kubelet chờ lâu hơn mỗi lần khởi động lại" },
      { content: "Kubelet không kéo được image, ví dụ sai tên hoặc tag, hoặc thiếu `imagePullSecrets`", correct: true },
      { content: "Không node nào đủ CPU hoặc memory để lập lịch Pod, nên Pod bị hoãn rồi được thử lập lịch lại sau" },
      { content: "Liveness probe thất bại quá số lần cho phép nên kubelet ngừng khởi động lại container" },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "medium", type: "single_choice",
    stem: "Deployment `report` chạy một script in báo cáo rồi thoát. `kubectl describe pod` của một Pod cho thấy:\n\n```text\nState:          Waiting\n  Reason:       CrashLoopBackOff\nLast State:     Terminated\n  Reason:       Completed\n  Exit Code:    0\nRestart Count:  6\n```\n\nVì sao Pod rơi vào `CrashLoopBackOff` dù script luôn thoát thành công?",
    options: [
      { content: "Kubelet gắn sẵn một liveness probe mặc định, và probe thất bại khi tiến trình đã thoát" },
      { content: "Mã thoát 0 chỉ được coi là thành công khi container chạy đủ lâu; thoát quá nhanh bị tính là lỗi" },
      { content: "Deployment chỉ cho `restartPolicy: Always`, nên container thoát (kể cả mã 0) vẫn bị chạy lại; tác vụ một lần nên dùng Job", correct: true },
      { content: "Chỉ cần thêm `restartPolicy: OnFailure` vào Pod template là container thoát với mã 0 sẽ không bị chạy lại nữa" },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "medium", type: "single_choice",
    stem: "Ứng dụng Java mất khoảng 3 phút để khởi động. Container có liveness probe `httpGet` với `initialDelaySeconds: 10`, `periodSeconds: 10`, `failureThreshold: 3`, nên bị kill và khởi động lại liên tục trước khi sẵn sàng. Cách xử lý nào đúng theo cơ chế của probe?",
    options: [
      { content: "Tăng `timeoutSeconds` của liveness probe lên 180 giây để mỗi lần kiểm tra chờ đủ lâu" },
      { content: "Thêm readiness probe với `initialDelaySeconds: 180` để hoãn luôn việc chạy liveness probe" },
      { content: "Đặt `restartPolicy: Never` cho Pod để kubelet không khởi động lại container mỗi khi probe thất bại" },
      { content: "Thêm `startupProbe` đủ lâu (trên 180 giây); liveness chỉ chạy sau khi startup thành công", correct: true },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "medium", type: "single_choice",
    stem: "Trong namespace `dev` có RoleBinding sau:\n\n```yaml\nkind: RoleBinding\nmetadata:\n  name: view-dev\n  namespace: dev\nsubjects:\n- kind: User\n  name: lan\nroleRef:\n  kind: ClusterRole\n  name: view\n  apiGroup: rbac.authorization.k8s.io\n```\n\nQuyền của `lan` được cấp ở phạm vi nào?",
    options: [
      { content: "Chỉ trong namespace `dev`, vì RoleBinding giới hạn quyền của ClusterRole trong namespace của nó", correct: true },
      { content: "Trên toàn cluster, vì đối tượng được tham chiếu là ClusterRole nên quyền áp dụng cho mọi namespace" },
      { content: "Không có quyền nào, vì RoleBinding chỉ tham chiếu được Role chứ không tham chiếu được ClusterRole" },
      { content: "Trong `dev` và cả tài nguyên cấp cluster như `nodes`, vì ClusterRole mang theo quyền cluster-scoped" },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "hard", type: "single_choice",
    stem: "Bạn cập nhật Deployment `web` lên image mới có readiness probe luôn thất bại. `maxUnavailable` là 25% và `progressDeadlineSeconds` để mặc định (600). Sau hơn 10 phút, điều nào đúng?",
    options: [
      { content: "Deployment báo `ProgressDeadlineExceeded` rồi tự rollback về revision trước đó" },
      { content: "Deployment báo `ProgressDeadlineExceeded` nhưng không tự rollback; Pod cũ chưa bị thay hết vẫn phục vụ", correct: true },
      { content: "Deployment báo `ProgressDeadlineExceeded` và xoá các Pod mới lỗi, đưa ReplicaSet cũ về đủ bản sao" },
      { content: "Deployment báo `ProgressDeadlineExceeded` rồi tự đặt `replicas` về 0 để chờ bạn chạy `kubectl rollout undo`" },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "hard", type: "multiple_choice",
    stem: "Deployment `api` (đứng sau một Service) bắt SIGTERM, đóng server rồi thoát ngay. Mỗi lần rolling update lại có vài request bị `connection refused`. Chọn các phát biểu đúng.",
    options: [
      { content: "Kubernetes chỉ gửi SIGTERM sau khi Pod đã được gỡ khỏi mọi endpoint, nên nguyên nhân nằm ở cấu hình readiness probe sai" },
      { content: "Việc kubelet dừng Pod và việc control plane gỡ Pod khỏi EndpointSlice diễn ra đồng thời, nên Pod có thể còn nhận request sau khi đã nhận SIGTERM", correct: true },
      { content: "Thêm `preStop` chạy `sleep 5` (image có `sleep`) làm SIGTERM tới muộn hơn, giúp endpoint kịp được gỡ trước khi app đóng cổng", correct: true },
      { content: "`terminationGracePeriodSeconds` chỉ bắt đầu đếm sau khi `preStop` chạy xong, nên `preStop` dài bao nhiêu thì Pod cũng không bị SIGKILL sớm" },
    ],
  },
  {
    domain: "Health, debugging & operations",
    difficulty: "hard", type: "single_choice",
    stem: "Role sau được gán cho `lan` bằng RoleBinding trong namespace `dev`:\n\n```yaml\nkind: Role\nmetadata:\n  name: pod-reader\n  namespace: dev\nrules:\n- apiGroups: [\"\"]\n  resources: [\"pods\"]\n  verbs: [\"get\", \"list\"]\n```\n\n`lan` chạy `kubectl logs web-1 -n dev` và bị `Forbidden`. Cách sửa tối thiểu đúng là gì?",
    options: [
      { content: "Thêm verb `watch` vào rule, vì `kubectl logs` theo dõi luồng log nên cần quyền `watch`" },
      { content: "Đổi Role thành ClusterRole, vì đọc log là thao tác ở phạm vi cả cluster" },
      { content: "Thêm tài nguyên `pods/log` với verb `get` vào rules, vì log là subresource riêng cần được cấp quyền", correct: true },
      { content: "Thêm verb `create` cho `pods`, vì mở kết nối lấy log tạo một yêu cầu mới tới API server" },
    ],
  },
];
