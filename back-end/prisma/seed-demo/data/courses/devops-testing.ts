import type { SeedCourse } from '../types.ts';

const PLAYWRIGHT_STARTER = String.raw`const input = require('fs').readFileSync(0, 'utf8');

// lines: "<title>|<attempt1>,<attempt2>,..." entries (the first line with n is already removed)
function summarize(lines) {
  const out = [];
  // TODO: classify each test as passed / flaky / failed / skipped
  // TODO: return the summary line, then FAILED lines, then FLAKY lines, in input order
  return out;
}

const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
const n = Number(lines[0]);
console.log(summarize(lines.slice(1, n + 1)).join('\n'));
`;

const PLAYWRIGHT_SOLUTION = String.raw`const input = require('fs').readFileSync(0, 'utf8');

function summarize(lines) {
  const counts = { passed: 0, flaky: 0, failed: 0, skipped: 0 };
  const failed = [];
  const flaky = [];
  for (const line of lines) {
    // The title itself may contain "|", so split on the last one.
    const sep = line.lastIndexOf('|');
    const title = line.slice(0, sep).trim();
    const attempts = line.slice(sep + 1).split(',').map((s) => s.trim());
    const k = attempts.length;
    const last = attempts[k - 1];
    if (last === 'skipped') {
      counts.skipped++;
    } else if (last === 'passed' && k === 1) {
      counts.passed++;
    } else if (last === 'passed') {
      counts.flaky++;
      flaky.push('FLAKY ' + title + ' (passed on attempt ' + k + ')');
    } else {
      counts.failed++;
      failed.push('FAILED ' + title + ' (' + k + (k === 1 ? ' attempt)' : ' attempts)'));
    }
  }
  const head =
    'passed: ' + counts.passed + ', flaky: ' + counts.flaky +
    ', failed: ' + counts.failed + ', skipped: ' + counts.skipped;
  return [head, ...failed, ...flaky];
}

const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
const n = Number(lines[0]);
console.log(summarize(lines.slice(1, n + 1)).join('\n'));
`;

const SELENIUM_STARTER = String.raw`import sys


def wait_for(appear_ms, timeout_ms, poll_ms):
    """Return (found_at_ms or None, number_of_checks)."""
    # TODO: check at t = 0, poll, 2*poll, ... while t <= timeout
    return None, 0


def main():
    lines = [l.strip() for l in sys.stdin.read().split("\n") if l.strip()]
    timeout_ms, poll_ms = map(int, lines[0].split())
    m = int(lines[1])
    for line in lines[2:2 + m]:
        locator, appear = line.rsplit(" ", 1)
        # TODO: call wait_for and print one line per locator, then the summary
        pass


main()
`;

const SELENIUM_SOLUTION = String.raw`import sys


def wait_for(appear_ms, timeout_ms, poll_ms):
    checks = 0
    t = 0
    while t <= timeout_ms:
        checks += 1
        if appear_ms is not None and t >= appear_ms:
            return t, checks
        t += poll_ms
    return None, checks


def plural(k):
    return f"{k} check" if k == 1 else f"{k} checks"


def main():
    lines = [l.strip() for l in sys.stdin.read().split("\n") if l.strip()]
    timeout_ms, poll_ms = map(int, lines[0].split())
    m = int(lines[1])
    found = 0
    for line in lines[2:2 + m]:
        # Locators may contain spaces, the appear time is always the last token.
        locator, appear = line.rsplit(" ", 1)
        appear_ms = None if appear == "never" else int(appear)
        at, checks = wait_for(appear_ms, timeout_ms, poll_ms)
        if at is None:
            print(f"{locator}: TimeoutException after {plural(checks)}")
        else:
            found += 1
            print(f"{locator}: found at {at}ms after {plural(checks)}")
    print(f"found: {found}/{m}")


main()
`;

export const COURSES: SeedCourse[] = [
  // O1
  {
    instructorEmail: 'anh.pham@skillpath.test',
    categorySlug: 'development-tools',
    topics: [{ slug: 'docker', primary: true }, { slug: 'devops' }, { slug: 'linux' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Docker từ zero đến production',
    subtitle: 'Đóng gói ứng dụng bằng Docker, chạy cả hệ thống với Compose và triển khai an toàn lên VPS Linux',
    description:
      'Bạn viết xong ứng dụng, chạy ngon trên máy mình, nhưng mang sang máy đồng nghiệp hoặc lên server thì gặp lỗi thiếu thư viện, sai phiên bản Node, khác cấu hình hệ điều hành. Docker sinh ra để chấm dứt câu "máy em chạy được mà". Khoá học này đưa bạn đi từ lệnh docker run đầu tiên đến lúc tự đóng gói và triển khai một ứng dụng web gồm backend, PostgreSQL và Redis lên một VPS Linux.\n\n' +
      'Khoá học đi theo một dự án xuyên suốt: một API quản lý đơn hàng viết bằng Node.js. Mỗi chương thêm một lớp: viết Dockerfile, tối ưu layer cache, tách multi-stage build để image gọn hơn, gắn volume cho dữ liệu, nối các container bằng network, rồi gom tất cả vào một file docker-compose.yml. Bạn sẽ hiểu vì sao từng dòng cấu hình tồn tại thay vì sao chép một đoạn YAML trên mạng rồi cầu may.\n\n' +
      'Học xong, bạn có thể:\n' +
      '• Viết Dockerfile sạch, build nhanh nhờ cache và không chứa công cụ build thừa\n' +
      '• Dùng Docker Compose để cả nhóm dựng môi trường dev bằng một lệnh\n' +
      '• Giữ dữ liệu cơ sở dữ liệu an toàn khi xoá hoặc tạo lại container\n' +
      '• Chạy container ở production với user không phải root, healthcheck và giới hạn CPU, RAM\n\n' +
      'Điểm khác của khoá là phần production được dạy nghiêm túc chứ không dừng ở mức chạy thử trên laptop. Mỗi bài có lệnh mẫu và file cấu hình để bạn gõ lại, kèm các lỗi hay gặp như port bị chiếm, container thoát ngay sau khi chạy hay image phình to vài GB, và cách đọc log để tìm nguyên nhân. Bạn chỉ cần biết dùng terminal ở mức cơ bản là theo được.',
    learningObjectives: [
      'Giải thích rõ khác biệt giữa image, container và registry, và vòng đời của một container',
      'Viết Dockerfile dùng layer cache và multi-stage build để image production nhỏ hơn đáng kể',
      'Dùng volume và bind mount để dữ liệu PostgreSQL không mất khi tạo lại container',
      'Dựng ứng dụng gồm API, PostgreSQL và Redis bằng một file docker-compose.yml',
      'Triển khai image lên VPS Linux với user không phải root, healthcheck và giới hạn tài nguyên',
    ],
    requirements: [
      'Biết dùng terminal ở mức cơ bản: cd, ls, chạy một lệnh',
      'Máy tính cài được Docker Desktop hoặc Docker Engine (RAM từ 8 GB trở lên là thoải mái)',
    ],
    targetAudience: [
      'Lập trình viên backend muốn đóng gói và triển khai ứng dụng nhất quán',
      'Sinh viên IT muốn bước đầu làm quen với DevOps',
    ],
    thumbnail: { label: 'Docker', tagline: 'Từ zero đến production' },
    sections: [
      {
        title: 'Làm quen với Docker',
        lectures: [
          'Giới thiệu khoá học và cài Docker trên Windows, macOS, Linux',
          'Image, container và registry: ba khái niệm cốt lõi',
        ],
      },
      {
        title: 'Đóng gói ứng dụng',
        lectures: [
          'Viết Dockerfile đầu tiên: FROM, COPY, RUN, CMD',
          'Layer cache và .dockerignore để build nhanh hơn',
          'Multi-stage build cho image production gọn nhẹ',
        ],
      },
      {
        title: 'Nhiều container làm việc cùng nhau',
        lectures: [
          'Volume và bind mount: giữ dữ liệu khi container bị xoá',
          'Network bridge và cách các container gọi nhau',
          'Docker Compose: chạy API, PostgreSQL và Redis bằng một lệnh',
        ],
      },
      {
        title: 'Đưa lên production',
        lectures: [
          'User không phải root, healthcheck và giới hạn CPU, RAM',
          'Đẩy image lên registry và triển khai lên VPS Linux',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Docker căn bản',
      description: 'Ôn lại image, Dockerfile, volume và Docker Compose.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Phát biểu nào đúng về quan hệ giữa image và container?',
          relatedLecture: 1,
          options: [
            {
              content: 'Container là một thực thể đang chạy được tạo từ image, image thì chỉ đọc',
              correct: true,
              explanation: 'Image là khuôn chỉ đọc gồm các layer; mỗi container thêm một lớp ghi riêng lên trên image đó.',
            },
            {
              content: 'Image là container đã dừng',
              explanation: 'Container dừng vẫn là container, vẫn giữ lớp ghi của nó; image là thứ hoàn toàn khác.',
            },
            {
              content: 'Mỗi image chỉ tạo được đúng một container',
              explanation: 'Từ một image có thể chạy bao nhiêu container cũng được, mỗi cái độc lập với nhau.',
            },
            {
              content: 'Sửa file trong container sẽ sửa luôn image gốc',
              explanation: 'Thay đổi chỉ nằm ở lớp ghi của container; image gốc không đổi trừ khi bạn build hoặc commit image mới.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao nên COPY package.json và chạy npm ci trước, rồi mới COPY toàn bộ mã nguồn?',
          relatedLecture: 3,
          options: [
            {
              content: 'Để layer cài dependency được cache lại khi chỉ mã nguồn thay đổi',
              correct: true,
              explanation: 'Docker chỉ build lại từ layer đầu tiên có thay đổi; package.json ít đổi nên bước npm ci thường được dùng lại từ cache.',
            },
            {
              content: 'Vì Docker bắt buộc COPY package.json trước mọi file khác',
              explanation: 'Docker không có quy định như vậy, đây chỉ là cách sắp xếp để tận dụng cache.',
            },
            {
              content: 'Để image cuối cùng không chứa thư mục node_modules',
              explanation: 'node_modules vẫn nằm trong image; muốn loại bỏ công cụ build cần multi-stage build.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Multi-stage build mang lại những lợi ích nào? (chọn tất cả đáp án đúng)',
          relatedLecture: 4,
          options: [
            {
              content: 'Image cuối nhỏ hơn vì chỉ copy kết quả build sang stage cuối',
              correct: true,
              explanation: 'Stage cuối dùng base image gọn và chỉ nhận file đã build, nên kích thước giảm rõ rệt.',
            },
            {
              content: 'Image production không chứa compiler và devDependencies',
              correct: true,
              explanation: 'Công cụ build chỉ tồn tại ở stage trước, giảm bề mặt tấn công của image chạy thật.',
            },
            {
              content: 'Build luôn nhanh hơn trong mọi trường hợp',
              explanation: 'Số stage tăng không làm build nhanh hơn; tốc độ phụ thuộc chủ yếu vào cache.',
            },
            {
              content: 'Tự động quét lỗ hổng bảo mật trong image',
              explanation: 'Quét lỗ hổng là việc của công cụ riêng, multi-stage build không làm điều đó.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Sau khi chạy docker compose down rồi up lại, dữ liệu PostgreSQL biến mất. Cách khắc phục đúng là gì?',
          relatedLecture: 5,
          options: [
            {
              content: 'Gắn named volume vào /var/lib/postgresql/data',
              correct: true,
              explanation: 'Named volume tồn tại độc lập với container, nên container mới vẫn dùng lại dữ liệu cũ.',
            },
            {
              content: 'Thêm restart: always cho service database',
              explanation: 'restart chỉ khởi động lại container khi nó dừng, không giữ dữ liệu khi container bị xoá.',
            },
            {
              content: 'Luôn dùng docker compose stop thay vì down',
              explanation: 'Chỉ né vấn đề tạm thời; lần sau container bị tạo lại thì dữ liệu vẫn mất.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong docker-compose.yml có hai service api và db. Biến DATABASE_HOST của api nên đặt là gì?',
          relatedLecture: 7,
          options: [
            {
              content: 'db',
              correct: true,
              explanation: 'Compose tạo network chung và DNS nội bộ phân giải tên service thành IP của container.',
            },
            {
              content: 'localhost',
              explanation: 'localhost bên trong container api trỏ về chính container api, không phải database.',
            },
            {
              content: 'Địa chỉ IP của máy host',
              explanation: 'Có thể chạy được nếu publish port, nhưng phụ thuộc máy và bỏ qua network nội bộ của Compose.',
            },
          ],
        },
      ],
    },
  },

  // O2
  {
    instructorEmail: 'anh.pham@skillpath.test',
    categorySlug: 'development-tools',
    topics: [{ slug: 'kubernetes', primary: true }, { slug: 'docker' }, { slug: 'devops' }],
    language: 'vi',
    level: 'advanced',
    priceAmount: 999_000,
    status: 'published',
    title: 'Kubernetes cho DevOps Engineer',
    subtitle: 'Vận hành ứng dụng trên Kubernetes: triển khai, tự phục hồi, autoscale, Helm và xử lý sự cố bằng kubectl',
    description:
      'Bạn đã đóng gói được ứng dụng bằng Docker, nhưng khi hệ thống có hàng chục service, cần tự phục hồi khi một node chết, cần cập nhật phiên bản mà không gián đoạn người dùng, thì chạy docker run trên từng máy không còn đủ. Kubernetes giải bài toán đó, đổi lại nó có rất nhiều khái niệm và file YAML khiến người mới dễ bỏ cuộc. Khoá học này dành cho người đã làm DevOps hoặc backend và muốn hiểu Kubernetes đủ sâu để tự vận hành, không chỉ apply manifest người khác viết sẵn.\n\n' +
      'Chúng ta bắt đầu từ kiến trúc: control plane, etcd, scheduler, kubelet và cơ chế reconcile, vì hiểu vòng lặp này thì mọi tài nguyên khác trở nên dễ đoán. Sau đó bạn triển khai một ứng dụng gồm API, worker và PostgreSQL lên cluster chạy bằng kind ngay trên máy mình: Deployment với rolling update, Service và Ingress, ConfigMap và Secret, StatefulSet có PersistentVolumeClaim.\n\n' +
      'Phần vận hành là trọng tâm của khoá:\n' +
      '• Đặt requests, limits đúng để tránh OOMKilled và node bị quá tải\n' +
      '• Cấu hình liveness, readiness probe để rolling update không làm rớt request\n' +
      '• Tự động scale với HorizontalPodAutoscaler theo CPU\n' +
      '• Đóng gói manifest thành Helm chart dùng chung cho staging và production\n' +
      '• Giới hạn quyền bằng RBAC và chặn lưu lượng giữa các namespace bằng NetworkPolicy\n\n' +
      'Mỗi chương kết thúc bằng một tình huống sự cố dựng sẵn, ví dụ Pod kẹt ở CrashLoopBackOff, Service không có endpoint hay PVC nằm mãi ở trạng thái Pending, để bạn luyện quy trình chẩn đoán với kubectl describe, kubectl logs và kubectl get events. Đây là kỹ năng phân biệt người biết viết YAML với người vận hành được cluster thật.',
    learningObjectives: [
      'Giải thích vai trò của API server, etcd, scheduler, kubelet và vòng lặp reconcile trong cluster',
      'Triển khai Deployment có rolling update, rollback và probe để cập nhật không gián đoạn',
      'Cấu hình Service, Ingress, ConfigMap và Secret cho một ứng dụng nhiều thành phần',
      'Đặt requests, limits và HorizontalPodAutoscaler phù hợp với tải thực tế của ứng dụng',
      'Đóng gói manifest thành Helm chart với values riêng cho staging và production',
      'Chẩn đoán CrashLoopBackOff, Pending và lỗi Service bằng kubectl describe, logs và events',
    ],
    requirements: [
      'Đã dùng Docker: viết Dockerfile, build và chạy container',
      'Quen thao tác Linux qua terminal và đọc được file YAML',
    ],
    targetAudience: [
      'DevOps Engineer hoặc SRE chuẩn bị vận hành hệ thống trên Kubernetes',
      'Backend developer muốn tự triển khai service của mình lên cluster',
    ],
    thumbnail: { label: 'Kubernetes', tagline: 'Vận hành cluster thật' },
    sections: [
      {
        title: 'Kiến trúc Kubernetes',
        lectures: [
          'Giới thiệu khoá học và dựng cluster thực hành với kind',
          'Control plane, kubelet và vòng lặp reconcile',
        ],
      },
      {
        title: 'Triển khai ứng dụng',
        lectures: [
          'Pod, ReplicaSet và Deployment: rolling update và rollback',
          'Service, Ingress và DNS nội bộ cluster',
          'ConfigMap, Secret và biến môi trường',
        ],
      },
      {
        title: 'Vận hành ổn định',
        lectures: [
          'Requests, limits và QoS class',
          'Liveness, readiness probe và HorizontalPodAutoscaler',
          'StatefulSet và PersistentVolumeClaim cho cơ sở dữ liệu',
        ],
      },
      {
        title: 'Đóng gói và bảo mật',
        lectures: [
          'Helm chart: template hoá manifest cho nhiều môi trường',
          'RBAC, NetworkPolicy và quy trình xử lý sự cố với kubectl',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Vận hành Kubernetes',
      description: 'Ôn lại Deployment, Service, tài nguyên, probe và StatefulSet.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Bản mới vừa rollout gây lỗi 500. Lệnh nào đưa Deployment về phiên bản trước nhanh nhất?',
          relatedLecture: 2,
          options: [
            {
              content: 'kubectl rollout undo deployment/api',
              correct: true,
              explanation: 'Deployment lưu lịch sử ReplicaSet, rollout undo chuyển về ReplicaSet của revision trước.',
            },
            {
              content: 'kubectl delete pod -l app=api',
              explanation: 'Pod bị xoá sẽ được tạo lại từ đúng template mới, lỗi vẫn còn nguyên.',
            },
            {
              content: 'kubectl scale deployment/api --replicas=0',
              explanation: 'Lệnh này tắt hẳn ứng dụng chứ không quay về phiên bản cũ.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Loại Service nào chỉ cho phép truy cập từ bên trong cluster?',
          relatedLecture: 3,
          options: [
            {
              content: 'ClusterIP',
              correct: true,
              explanation: 'ClusterIP là loại mặc định, cấp một IP ảo chỉ định tuyến được bên trong cluster.',
            },
            {
              content: 'NodePort',
              explanation: 'NodePort mở một port trên mọi node, bên ngoài cluster gọi vào được.',
            },
            {
              content: 'LoadBalancer',
              explanation: 'LoadBalancer xin một load balancer bên ngoài để nhận traffic từ Internet.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Mọi container trong Pod đều có requests bằng limits cho cả CPU và memory. Pod thuộc QoS class nào?',
          relatedLecture: 5,
          options: [
            {
              content: 'Guaranteed',
              correct: true,
              explanation: 'Đây đúng là điều kiện của Guaranteed, class ít bị evict nhất khi node thiếu tài nguyên.',
            },
            {
              content: 'Burstable',
              explanation: 'Burstable là khi có đặt requests nhưng không thoả điều kiện requests bằng limits cho mọi container.',
            },
            {
              content: 'BestEffort',
              explanation: 'BestEffort là Pod không đặt requests hay limits nào, bị evict đầu tiên.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Khi readiness probe của một Pod thất bại liên tục, điều gì xảy ra? (chọn tất cả đáp án đúng)',
          relatedLecture: 6,
          options: [
            {
              content: 'Pod bị gỡ khỏi danh sách endpoint của Service',
              correct: true,
              explanation: 'Pod chưa ready thì Service ngừng gửi traffic tới nó.',
            },
            {
              content: 'Pod vẫn ở trạng thái Running',
              correct: true,
              explanation: 'Readiness không làm container dừng, Pod vẫn chạy nhưng được đánh dấu chưa sẵn sàng.',
            },
            {
              content: 'Kubelet khởi động lại container',
              explanation: 'Restart là hành vi của liveness probe, không phải readiness probe.',
            },
            {
              content: 'Deployment tự động rollback về bản trước',
              explanation: 'Kubernetes không tự rollback; rollout chỉ bị đứng lại cho tới khi bạn can thiệp.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao PostgreSQL nên chạy bằng StatefulSet thay vì Deployment?',
          relatedLecture: 7,
          options: [
            {
              content: 'Mỗi Pod có tên ổn định và PersistentVolumeClaim riêng đi theo nó',
              correct: true,
              explanation: 'Pod postgres-0 tạo lại vẫn tên postgres-0 và gắn lại đúng volume cũ, điều mà Deployment không đảm bảo.',
            },
            {
              content: 'StatefulSet tự sao lưu dữ liệu định kỳ',
              explanation: 'StatefulSet không có tính năng backup, việc đó cần công cụ hoặc job riêng.',
            },
            {
              content: 'Deployment không mount được volume',
              explanation: 'Deployment mount volume bình thường, nhưng các replica dùng chung template PVC nên không phù hợp cho database.',
            },
          ],
        },
      ],
    },
  },

  // O3
  {
    instructorEmail: 'anh.pham@skillpath.test',
    categorySlug: 'it-certification',
    topics: [{ slug: 'amazon-aws', primary: true }, { slug: 'software-architecture' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 799_000,
    status: 'published',
    title: 'Luyện thi AWS Solutions Architect Associate (SAA-C03)',
    subtitle: 'Nắm chắc kiến trúc AWS và kỹ năng phân tích câu hỏi tình huống để tự tin bước vào kỳ thi SAA-C03',
    description:
      'Kỳ thi AWS Certified Solutions Architect – Associate (SAA-C03) không hỏi bạn thuộc bao nhiêu tên dịch vụ, mà hỏi bạn chọn kiến trúc nào cho một tình huống cụ thể: cần chi phí thấp nhất, cần chịu được sự cố của một Availability Zone, hay cần tách rời các thành phần để xử lý tải tăng đột biến. Nhiều người ôn bằng cách đọc tài liệu từng dịch vụ rồi vẫn lúng túng trước những câu hỏi dài với bốn đáp án nghe đều hợp lý. Khoá học này được xây để giải đúng vấn đề đó.\n\n' +
      'Nội dung bám theo bốn nhóm kiến thức của đề thi: thiết kế kiến trúc an toàn, kiến trúc có khả năng phục hồi, kiến trúc hiệu năng cao và kiến trúc tối ưu chi phí. Với mỗi nhóm, bạn học các dịch vụ hay xuất hiện như IAM, VPC, EC2, Auto Scaling, Elastic Load Balancing, S3, RDS, Aurora, DynamoDB, Lambda, SQS, SNS và CloudFront, rồi so sánh chúng trong cùng một bài toán thay vì học rời rạc.\n\n' +
      'Sau khoá học, bạn sẽ:\n' +
      '• Đọc một câu hỏi tình huống và nhận ra từ khoá quyết định như "chi phí thấp nhất" hay "ít thay đổi mã nguồn nhất"\n' +
      '• Thiết kế VPC có subnet public, private và luồng ra Internet qua NAT Gateway\n' +
      '• Chọn đúng storage class S3 và loại cơ sở dữ liệu cho từng yêu cầu\n' +
      '• Áp dụng Well-Architected Framework để biện luận cho lựa chọn của mình\n\n' +
      'Chương cuối là buổi giải đề mẫu: mỗi câu được phân tích vì sao đáp án đúng và vì sao từng đáp án sai bị loại. Bạn nên có một tài khoản AWS dùng gói miễn phí để làm lại các bài lab về VPC, EC2 và S3, vì tự tay cấu hình một lần sẽ nhớ lâu hơn đọc lý thuyết nhiều lần.',
    learningObjectives: [
      'Thiết kế VPC nhiều Availability Zone với subnet public, private, NAT Gateway và Security Group',
      'Chọn giữa EC2, Lambda, SQS và SNS để xây kiến trúc tách rời, chịu tải tăng đột biến',
      'So sánh RDS Multi-AZ, read replica, Aurora và DynamoDB theo yêu cầu sẵn sàng và hiệu năng',
      'Tối ưu chi phí lưu trữ bằng S3 storage class và lifecycle policy',
      'Phân tích câu hỏi tình huống SAA-C03 và loại trừ đáp án sai dựa trên từ khoá của đề',
    ],
    requirements: [
      'Hiểu khái niệm mạng cơ bản: IP, subnet, DNS, HTTP',
      'Có tài khoản AWS (nên dùng gói miễn phí và nhớ xoá tài nguyên sau mỗi lab)',
    ],
    targetAudience: [
      'Developer và DevOps chuẩn bị thi chứng chỉ AWS Solutions Architect Associate',
      'Kỹ sư muốn thiết kế hệ thống trên AWS một cách có hệ thống',
    ],
    thumbnail: { label: 'AWS SAA-C03', tagline: 'Luyện thi Solutions Architect' },
    sections: [
      {
        title: 'Chuẩn bị cho kỳ thi',
        lectures: [
          'Giới thiệu khoá học, cấu trúc đề SAA-C03 và cách ôn hiệu quả',
          'IAM: user, role, policy và nguyên tắc least privilege',
        ],
      },
      {
        title: 'Compute và mạng',
        lectures: [
          'VPC, subnet public/private, NAT Gateway và Security Group',
          'EC2, Auto Scaling Group và Elastic Load Balancing',
          'Lambda, SQS và SNS cho kiến trúc tách rời',
        ],
      },
      {
        title: 'Lưu trữ và cơ sở dữ liệu',
        lectures: [
          'S3: storage class, lifecycle policy và versioning',
          'RDS Multi-AZ, read replica và Aurora',
          'DynamoDB và ElastiCache: chọn đúng cho từng bài toán',
        ],
      },
      {
        title: 'Thiết kế kiến trúc theo đề thi',
        lectures: [
          'Well-Architected Framework: độ tin cậy, chi phí và hiệu năng',
          'Giải đề mẫu: phân tích từ khoá và loại trừ đáp án',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Kiến trúc AWS theo đề SAA',
      description: 'Câu hỏi tình huống về IAM, VPC, S3, RDS và kiến trúc tách rời.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Ứng dụng chạy trên EC2 cần đọc file trong một bucket S3. Cách cấp quyền an toàn nhất là gì?',
          relatedLecture: 1,
          options: [
            {
              content: 'Gán IAM role cho instance qua instance profile',
              correct: true,
              explanation: 'Role cấp credential tạm thời tự xoay vòng, không phải lưu khoá nào trên máy.',
            },
            {
              content: 'Lưu access key của một IAM user trong file cấu hình trên EC2',
              explanation: 'Khoá dài hạn nằm trên máy dễ bị lộ và phải tự xoay vòng, đề thi luôn coi đây là cách kém an toàn.',
            },
            {
              content: 'Mở bucket ở chế độ public read',
              explanation: 'Ai cũng đọc được dữ liệu, vi phạm nguyên tắc least privilege.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'EC2 trong private subnet cần tải bản cập nhật từ Internet nhưng không được nhận kết nối từ ngoài vào. Cần thêm gì?',
          relatedLecture: 2,
          options: [
            {
              content: 'NAT Gateway đặt trong public subnet và route 0.0.0.0/0 của private subnet trỏ tới nó',
              correct: true,
              explanation: 'NAT Gateway chỉ cho kết nối đi ra và nhận phản hồi, không cho phép kết nối khởi tạo từ Internet.',
            },
            {
              content: 'Gán Elastic IP cho từng EC2 trong private subnet',
              explanation: 'Không có Internet Gateway route thì Elastic IP vô tác dụng, và làm vậy cũng để lộ máy ra ngoài.',
            },
            {
              content: 'Mở inbound 0.0.0.0/0 trong Security Group',
              explanation: 'Inbound rule không giúp kết nối ra ngoài mà còn làm tăng rủi ro bảo mật.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Dịch vụ nào giúp tách rời (decouple) dịch vụ nhận đơn hàng với dịch vụ xử lý đơn chậm? (chọn tất cả đáp án đúng)',
          relatedLecture: 4,
          options: [
            {
              content: 'Amazon SQS',
              correct: true,
              explanation: 'Hàng đợi giữ message khi bên xử lý chậm hoặc tạm dừng, hai bên không cần chạy cùng lúc.',
            },
            {
              content: 'Amazon SNS',
              correct: true,
              explanation: 'SNS phát sự kiện tới nhiều subscriber theo mô hình pub/sub, bên gửi không cần biết bên nhận.',
            },
            {
              content: 'Amazon EBS',
              explanation: 'EBS là ổ đĩa block gắn vào EC2, không phải công cụ truyền message.',
            },
            {
              content: 'AWS IAM',
              explanation: 'IAM quản lý quyền truy cập, không liên quan đến luồng dữ liệu giữa các dịch vụ.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Log ít được đọc sau 30 ngày nhưng phải giữ 7 năm với chi phí thấp nhất, chấp nhận chờ vài giờ khi cần lấy lại. Chọn gì?',
          relatedLecture: 5,
          options: [
            {
              content: 'Lifecycle policy chuyển object sang S3 Glacier Deep Archive sau 30 ngày',
              correct: true,
              explanation: 'Deep Archive có giá lưu trữ thấp nhất, thời gian khôi phục tính bằng giờ phù hợp với yêu cầu.',
            },
            {
              content: 'Giữ nguyên ở S3 Standard',
              explanation: 'Standard đắt nhất trong các lựa chọn cho dữ liệu hiếm khi truy cập.',
            },
            {
              content: 'Chuyển sang S3 Standard-IA',
              explanation: 'Rẻ hơn Standard nhưng vẫn đắt hơn nhiều so với Glacier cho dữ liệu lưu trữ dài hạn.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Mục đích chính của RDS Multi-AZ là gì?',
          relatedLecture: 6,
          options: [
            {
              content: 'Tăng tính sẵn sàng nhờ bản standby đồng bộ và failover tự động',
              correct: true,
              explanation: 'Khi primary hoặc AZ gặp sự cố, RDS chuyển sang standby ở AZ khác mà không cần đổi endpoint.',
            },
            {
              content: 'Tăng khả năng đọc bằng cách chia truy vấn cho standby',
              explanation: 'Standby của Multi-AZ kiểu truyền thống không nhận truy vấn đọc; muốn scale đọc cần read replica.',
            },
            {
              content: 'Giảm chi phí cơ sở dữ liệu',
              explanation: 'Multi-AZ chạy thêm một instance standby nên chi phí tăng chứ không giảm.',
            },
          ],
        },
      ],
    },
  },

  // O4
  {
    instructorEmail: 'anh.pham@skillpath.test',
    categorySlug: 'operating-systems',
    topics: [{ slug: 'linux', primary: true }, { slug: 'shell-scripting' }, { slug: 'system-administration' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Linux & Shell Scripting cho người làm hệ thống',
    subtitle: 'Làm chủ dòng lệnh Linux, quản trị server qua SSH và tự viết script Bash tự động hoá công việc',
    description:
      'Hầu hết server chạy web, cơ sở dữ liệu hay container đều chạy Linux, và người làm hệ thống, DevOps hay backend sớm muộn cũng phải SSH vào một máy chủ không có giao diện đồ hoạ. Lúc đó, việc tìm file log, xem tiến trình nào ngốn RAM hay sửa quyền thư mục mà không làm hỏng hệ thống đều phụ thuộc vào việc bạn có quen dòng lệnh hay không. Khoá học này dạy Linux từ con số không, theo cách người quản trị hệ thống thực sự dùng hằng ngày.\n\n' +
      'Bạn sẽ dựng một máy ảo Ubuntu Server để thực hành an toàn, rồi đi lần lượt qua cây thư mục, quản lý user và phân quyền, tiến trình và systemd, đọc log bằng journalctl và grep. Nửa sau khoá chuyển sang Bash scripting: biến, điều kiện, vòng lặp, pipe và redirect, cùng bộ ba công cụ xử lý văn bản awk, sed và cut.\n\n' +
      'Kết thúc khoá học, bạn có thể:\n' +
      '• Tự tin thao tác file, thư mục và phân quyền trên server Linux qua SSH\n' +
      '• Quản lý service bằng systemctl và tìm nguyên nhân lỗi qua log\n' +
      '• Viết script Bash có kiểm tra lỗi, ghi log và trả mã thoát đúng\n' +
      '• Lập lịch công việc định kỳ bằng cron và systemd timer\n\n' +
      'Dự án xuyên suốt là một script sao lưu thư mục ứng dụng và cơ sở dữ liệu: nén dữ liệu theo ngày, xoá bản cũ quá bảy ngày, ghi log và chạy tự động mỗi đêm. Bạn viết nó từ vài dòng đơn giản rồi làm cứng dần qua từng bài, để thấy rõ khác biệt giữa một script chạy được và một script đủ tin cậy để đặt lên server thật.',
    learningObjectives: [
      'Điều hướng cây thư mục Linux và thao tác file bằng ls, cp, mv, find một cách thành thạo',
      'Quản lý user, group và phân quyền bằng chmod, chown mà không mở quyền thừa',
      'Quản lý service bằng systemctl và truy vết lỗi qua journalctl, tail -f và grep',
      'Viết script Bash có biến, điều kiện, vòng lặp, xử lý lỗi với set -euo pipefail',
      'Lập lịch script sao lưu chạy tự động bằng cron và systemd timer',
    ],
    requirements: [
      'Không cần kinh nghiệm Linux trước đó',
      'Máy tính chạy được VirtualBox hoặc một VPS Linux giá rẻ để thực hành',
    ],
    targetAudience: [
      'Người mới muốn theo hướng quản trị hệ thống hoặc DevOps',
      'Lập trình viên thường xuyên phải SSH vào server để triển khai và xem log',
    ],
    thumbnail: { label: 'Linux & Bash', tagline: 'Quản trị server qua dòng lệnh' },
    sections: [
      {
        title: 'Làm quen với dòng lệnh',
        lectures: [
          'Giới thiệu khoá học và dựng máy ảo Ubuntu Server để thực hành',
          'Cây thư mục Linux và các lệnh ls, cd, cp, mv, find',
        ],
      },
      {
        title: 'Quản trị hệ thống cơ bản',
        lectures: [
          'User, group và phân quyền với chmod, chown',
          'Quản lý tiến trình: ps, top, kill và systemd service',
          'Đọc log với journalctl, tail -f và grep',
        ],
      },
      {
        title: 'Shell scripting với Bash',
        lectures: [
          'Biến, điều kiện if và vòng lặp for trong Bash',
          'Pipe, redirect và xử lý văn bản với awk, sed, cut',
          'Script sao lưu có mã thoát, ghi log và set -euo pipefail',
        ],
      },
      {
        title: 'Tự động hoá công việc',
        lectures: ['Lập lịch với cron và systemd timer'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Linux và Bash',
      description: 'Ôn lại phân quyền, tiến trình, redirect và lập lịch.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Sau khi chạy chmod 640 config.env, quyền của file là gì?',
          relatedLecture: 2,
          options: [
            {
              content: 'Owner đọc và ghi, group chỉ đọc, người khác không có quyền',
              correct: true,
              explanation: '6 = rw-, 4 = r--, 0 = ---, lần lượt cho owner, group và others.',
            },
            {
              content: 'Owner đọc, ghi và chạy; group đọc; người khác không có quyền',
              explanation: 'Quyền chạy (x) cần giá trị 7 cho owner, ở đây là 6.',
            },
            {
              content: 'Mọi người đều đọc được, chỉ owner được ghi',
              explanation: 'Chữ số cuối là 0 nên others không đọc được; đây là quyền 644.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Muốn yêu cầu một tiến trình dừng và cho nó cơ hội dọn dẹp tài nguyên, bạn dùng lệnh nào?',
          relatedLecture: 3,
          options: [
            {
              content: 'kill <pid> (gửi SIGTERM)',
              correct: true,
              explanation: 'SIGTERM là mặc định của kill, tiến trình có thể bắt tín hiệu này để đóng file, kết nối rồi thoát.',
            },
            {
              content: 'kill -9 <pid> (gửi SIGKILL)',
              explanation: 'SIGKILL không bắt được, kernel dừng tiến trình ngay nên nó không kịp dọn dẹp.',
            },
            {
              content: 'kill -STOP <pid>',
              explanation: 'SIGSTOP chỉ tạm dừng tiến trình, nó vẫn còn trong hệ thống.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong lệnh ./backup.sh > backup.log 2>&1, phần 2>&1 có tác dụng gì?',
          relatedLecture: 6,
          options: [
            {
              content: 'Chuyển stderr vào cùng nơi với stdout, tức là file backup.log',
              correct: true,
              explanation: 'File descriptor 2 (stderr) được trỏ tới nơi fd 1 (stdout) đang trỏ, nên lỗi cũng vào log.',
            },
            {
              content: 'Chạy script hai lần',
              explanation: 'Số 2 ở đây là file descriptor của stderr, không phải số lần chạy.',
            },
            {
              content: 'Ghi output vào file tên là 1',
              explanation: 'Dấu & cho biết 1 là file descriptor; thiếu & thì shell mới tạo file tên 1.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Dòng set -euo pipefail ở đầu script Bash làm những gì? (chọn tất cả đáp án đúng)',
          relatedLecture: 7,
          options: [
            {
              content: 'Thoát script ngay khi một lệnh trả mã lỗi khác 0',
              correct: true,
              explanation: 'Đó là tác dụng của -e, tránh việc script chạy tiếp trên trạng thái hỏng.',
            },
            {
              content: 'Báo lỗi khi dùng biến chưa được gán',
              correct: true,
              explanation: '-u bắt lỗi gõ sai tên biến, ví dụ rm -rf "$BACKUP_DIRR/" thành xoá nhầm thư mục gốc.',
            },
            {
              content: 'Pipeline trả mã lỗi nếu bất kỳ lệnh nào trong đó lỗi',
              correct: true,
              explanation: 'Mặc định pipeline chỉ lấy mã thoát của lệnh cuối; pipefail sửa điều đó.',
            },
            {
              content: 'Tự động ghi toàn bộ output ra file log',
              explanation: 'set không ghi log; muốn ghi log cần redirect hoặc dùng tee.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Dòng crontab 0 2 * * 1 /opt/scripts/backup.sh chạy script vào lúc nào?',
          relatedLecture: 8,
          options: [
            {
              content: '2 giờ sáng mỗi thứ Hai',
              correct: true,
              explanation: 'Các trường lần lượt là phút 0, giờ 2, mọi ngày, mọi tháng, thứ 1 trong tuần (thứ Hai).',
            },
            {
              content: 'Mỗi 2 phút vào ngày 1 hằng tháng',
              explanation: 'Trường đầu là phút, trường thứ hai là giờ; ngày trong tháng là trường thứ ba và đang là *.',
            },
            {
              content: '0 giờ 2 phút mỗi ngày',
              explanation: 'Thứ tự đúng là phút trước, giờ sau, và trường cuối giới hạn vào thứ Hai.',
            },
          ],
        },
      ],
    },
  },

  // O5
  {
    instructorEmail: 'tri.ho@skillpath.test',
    categorySlug: 'development-tools',
    topics: [{ slug: 'git', primary: true }, { slug: 'github' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Git & GitHub cho làm việc nhóm',
    subtitle: 'Tự tin dùng nhánh, xử lý conflict, mở pull request và cứu code khi lỡ tay trong dự án nhóm',
    description:
      'Dùng Git một mình thì chỉ cần add, commit, push là đủ. Nhưng khi vào nhóm, bạn gặp ngay những tình huống khó: hai người cùng sửa một file và bị conflict, lỡ commit nhầm lên nhánh main, pull về thì lịch sử rối tung, hay không biết viết pull request sao cho người review dễ đọc. Khoá học này tập trung vào đúng những kỹ năng Git và GitHub mà một lập trình viên cần trong những tuần đầu đi làm.\n\n' +
      'Phần đầu giải thích mô hình ba vùng của Git: working directory, staging area và repository, vì hiểu nó thì các lệnh khó như reset hay restore không còn đáng sợ. Tiếp theo là nhánh: tạo, merge, fast-forward, xử lý conflict từng bước, khi nào nên rebase và khi nào tuyệt đối không. Phần cuối chuyển sang GitHub với quy trình làm việc nhóm thực tế: fork, pull request, code review, branch protection và đồng bộ với upstream.\n\n' +
      'Học xong khoá này, bạn sẽ:\n' +
      '• Viết commit nhỏ, message rõ ràng để lịch sử dự án đọc được\n' +
      '• Tự xử lý merge conflict mà không sợ mất code của đồng đội\n' +
      '• Mở pull request đúng quy trình và phản hồi review một cách chuyên nghiệp\n' +
      '• Cứu lại commit bị mất bằng reflog, hoàn tác thay đổi đã push bằng revert\n\n' +
      'Toàn bộ khoá học thực hành trên một repository mẫu có sẵn các nhánh và tình huống conflict được dựng trước, nên bạn được va chạm với lỗi thật chứ không chỉ xem slide. Mỗi lệnh đều được minh hoạ bằng sơ đồ commit trước và sau khi chạy, giúp bạn hình dung chính xác Git đang làm gì với lịch sử của mình.',
    learningObjectives: [
      'Phân biệt working directory, staging area, repository và dùng add, commit, restore đúng chỗ',
      'Tạo nhánh, merge, rebase và tự xử lý merge conflict mà không làm mất thay đổi',
      'Mở pull request, review code và cấu hình branch protection cho nhánh main',
      'Đồng bộ fork với upstream và làm việc với nhiều remote',
      'Hoàn tác sai lầm bằng revert, reset và khôi phục commit bị mất bằng reflog',
    ],
    requirements: ['Biết dùng terminal cơ bản và có một tài khoản GitHub miễn phí'],
    targetAudience: [
      'Sinh viên chuẩn bị làm đồ án nhóm hoặc đi thực tập',
      'Lập trình viên mới đi làm còn ngại thao tác với nhánh và conflict',
    ],
    thumbnail: { label: 'Git & GitHub', tagline: 'Làm việc nhóm không sợ conflict' },
    sections: [
      {
        title: 'Git căn bản',
        lectures: [
          'Giới thiệu khoá học và cấu hình Git lần đầu',
          'Working directory, staging area và commit',
          'Viết commit message rõ ràng và dùng .gitignore',
        ],
      },
      {
        title: 'Nhánh và hợp nhất',
        lectures: [
          'Branch, merge và fast-forward',
          'Xử lý merge conflict từng bước',
          'Rebase, cherry-pick và khi nào không nên rebase',
        ],
      },
      {
        title: 'Làm việc nhóm trên GitHub',
        lectures: [
          'Fork, clone, remote và đồng bộ với upstream',
          'Pull request, code review và branch protection',
          'Khôi phục sai lầm: restore, reset, revert và reflog',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Git cho làm việc nhóm',
      description: 'Ôn lại staging, merge, rebase, revert và pull request.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Lệnh git add src/app.ts làm gì?',
          relatedLecture: 1,
          options: [
            {
              content: 'Đưa thay đổi hiện tại của file vào staging area để chuẩn bị commit',
              correct: true,
              explanation: 'add chụp lại nội dung file lúc đó vào index; commit kế tiếp sẽ lấy từ index.',
            },
            {
              content: 'Tạo commit mới chứa file đó',
              explanation: 'Commit chỉ được tạo khi chạy git commit.',
            },
            {
              content: 'Đẩy file lên GitHub',
              explanation: 'Đưa lên remote là việc của git push.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi nào git merge feature thực hiện fast-forward?',
          relatedLecture: 3,
          options: [
            {
              content: 'Khi nhánh hiện tại không có commit mới nào kể từ lúc feature tách ra',
              correct: true,
              explanation: 'Lúc đó Git chỉ cần dời con trỏ nhánh tới commit cuối của feature, không cần merge commit.',
            },
            {
              content: 'Khi hai nhánh không có conflict',
              explanation: 'Không conflict nhưng cả hai đều có commit mới thì Git vẫn tạo merge commit.',
            },
            {
              content: 'Khi dùng cờ --no-ff',
              explanation: '--no-ff làm ngược lại: luôn tạo merge commit kể cả khi fast-forward được.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao không nên rebase một nhánh đã push và đồng đội đang làm việc trên đó?',
          relatedLecture: 5,
          options: [
            {
              content: 'Rebase viết lại lịch sử, commit có hash mới nên lịch sử của đồng đội bị lệch',
              correct: true,
              explanation: 'Đồng đội phải xử lý commit trùng lặp và dễ ghi đè code của nhau khi force push.',
            },
            {
              content: 'Rebase xoá toàn bộ commit của nhánh',
              explanation: 'Rebase áp lại các commit lên base mới, không xoá chúng.',
            },
            {
              content: 'GitHub không cho phép rebase',
              explanation: 'GitHub không chặn rebase; vấn đề nằm ở việc lịch sử bị viết lại.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Branch protection trên GitHub có thể bắt buộc những điều gì cho nhánh main? (chọn tất cả đáp án đúng)',
          relatedLecture: 7,
          options: [
            {
              content: 'Mọi thay đổi phải qua pull request có ít nhất một approve',
              correct: true,
              explanation: 'Đây là tuỳ chọn require pull request reviews.',
            },
            {
              content: 'Các status check như CI phải pass trước khi merge',
              correct: true,
              explanation: 'Tuỳ chọn require status checks chặn merge khi pipeline thất bại.',
            },
            {
              content: 'Chặn force push lên nhánh',
              correct: true,
              explanation: 'Force push bị chặn mặc định trên nhánh được bảo vệ.',
            },
            {
              content: 'Tự động giải quyết merge conflict',
              explanation: 'Conflict luôn cần người quyết định, branch protection không làm thay việc đó.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Một commit lỗi đã được push lên main mà cả nhóm dùng chung. Cách hoàn tác an toàn nhất là gì?',
          relatedLecture: 8,
          options: [
            {
              content: 'git revert <hash> rồi push commit đảo ngược',
              correct: true,
              explanation: 'revert tạo commit mới hoàn tác thay đổi, không viết lại lịch sử chung.',
            },
            {
              content: 'git reset --hard HEAD~1 rồi force push',
              explanation: 'Viết lại lịch sử của nhánh dùng chung, đồng đội đã pull sẽ gặp rắc rối.',
            },
            {
              content: 'Xoá repository và tạo lại',
              explanation: 'Mất toàn bộ lịch sử, pull request và issue, hoàn toàn không cần thiết.',
            },
          ],
        },
      ],
    },
  },

  // O6
  {
    instructorEmail: 'tri.ho@skillpath.test',
    categorySlug: 'development-tools',
    topics: [{ slug: 'devops', primary: true }, { slug: 'github' }, { slug: 'docker' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 0,
    status: 'rejected',
    rejectReason:
      'Bài "Deploy lên server qua SSH và rollback khi lỗi" bị cắt ở phút 6:40, phần rollback nêu trong tiêu đề chưa được trình bày. Ở bài "Secrets, biến môi trường và environment có duyệt", màn hình lộ địa chỉ IP và private key của server từ phút 3:15, cần quay lại hoặc làm mờ trước khi gửi duyệt lại. Câu 4 của bài kiểm tra hỏi về khoá cache, nhưng bài liên quan chưa giải thích hashFiles.',
    title: 'CI/CD với GitHub Actions',
    subtitle: 'Tự động test, build Docker image và triển khai ứng dụng Node.js mỗi khi merge code bằng GitHub Actions',
    description:
      'Mỗi lần merge code, bạn vẫn phải tự chạy test, tự build Docker image rồi SSH vào server để kéo bản mới? Quy trình thủ công như vậy vừa tốn thời gian vừa dễ sót bước, và chỉ cần một lần quên chạy migration là cả hệ thống gặp sự cố. GitHub Actions cho phép tự động hoá toàn bộ chuỗi đó ngay trong repository, không cần dựng thêm máy chủ CI riêng.\n\n' +
      'Khoá học bắt đầu từ các khái niệm nền tảng: workflow, job, step, runner và các loại trigger như push, pull_request, schedule hay workflow_dispatch. Sau đó bạn dựng pipeline CI cho một ứng dụng Node.js: chạy lint và test trên nhiều phiên bản Node bằng matrix, cache dependency để rút ngắn thời gian chạy, lưu báo cáo test thành artifact. Phần CD hướng dẫn build Docker image, đẩy lên GitHub Container Registry và triển khai lên server qua SSH.\n\n' +
      'Sau khoá học, bạn có thể:\n' +
      '• Viết workflow YAML rõ ràng, tái sử dụng được giữa các repository\n' +
      '• Quản lý secrets và environment có bước duyệt trước khi deploy production\n' +
      '• Thiết lập pipeline chặn merge khi test thất bại\n' +
      '• Triển khai tự động và quay lại phiên bản trước khi bản mới gặp lỗi\n\n' +
      'Mọi ví dụ đều chạy trên một repository công khai để bạn xem lại log của từng lần chạy. Khoá học chú trọng các lỗi hay gặp như workflow không chạy vì sai tên nhánh, cache không bao giờ trúng, hay secret không đọc được trong pull request từ fork, và cách đọc log để xử lý chúng một cách có hệ thống.',
    learningObjectives: [
      'Viết workflow GitHub Actions với job, step, needs và trigger phù hợp từng tình huống',
      'Chạy lint và test trên nhiều phiên bản Node.js bằng matrix, có cache dependency',
      'Quản lý secrets và environment có người duyệt trước khi deploy production',
      'Build và push Docker image lên GitHub Container Registry với tag theo commit',
      'Triển khai lên server qua SSH và quay lại phiên bản trước khi bản mới lỗi',
    ],
    requirements: [
      'Đã dùng Git và GitHub: commit, push, pull request',
      'Biết Docker cơ bản và từng chạy một ứng dụng Node.js',
    ],
    targetAudience: [
      'Backend developer muốn tự dựng pipeline CI/CD cho dự án',
      'Người mới vào DevOps cần một công cụ CI/CD dễ bắt đầu',
    ],
    thumbnail: { label: 'GitHub Actions', tagline: 'CI/CD tự động từng commit' },
    sections: [
      {
        title: 'Nền tảng GitHub Actions',
        lectures: [
          'Giới thiệu khoá học và workflow đầu tiên',
          'Workflow, job, step và runner',
          'Trigger: push, pull_request, schedule và workflow_dispatch',
        ],
      },
      {
        title: 'CI cho ứng dụng Node.js',
        lectures: [
          'Chạy lint và test với matrix nhiều phiên bản Node',
          'Cache dependency và lưu artifact',
          'Secrets, biến môi trường và environment có duyệt',
        ],
      },
      {
        title: 'CD với Docker',
        lectures: [
          'Build và push image lên GitHub Container Registry',
          'Deploy lên server qua SSH và rollback khi lỗi',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: GitHub Actions',
      description: 'Ôn lại job, trigger, matrix, secrets và cache.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Các job trong cùng một workflow mặc định chạy như thế nào?',
          relatedLecture: 1,
          options: [
            {
              content: 'Song song, trừ khi khai báo phụ thuộc bằng needs',
              correct: true,
              explanation: 'Mỗi job chạy trên runner riêng; needs tạo thứ tự giữa các job.',
            },
            {
              content: 'Tuần tự theo thứ tự viết trong file',
              explanation: 'Thứ tự trong file không quyết định thứ tự chạy, chỉ needs mới làm được điều đó.',
            },
            {
              content: 'Cùng chạy trên một runner và chia sẻ file với nhau',
              explanation: 'Job khác nhau không chia sẻ filesystem; muốn chuyển file cần artifact hoặc cache.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Muốn workflow chạy mỗi khi có pull request mở vào nhánh main, khai báo trigger nào?',
          relatedLecture: 2,
          options: [
            {
              content: 'on: pull_request với branches: [main]',
              correct: true,
              explanation: 'branches của pull_request lọc theo nhánh đích của PR.',
            },
            {
              content: 'on: push với branches: [main]',
              explanation: 'Chỉ chạy khi có commit được push thẳng lên main, không chạy khi PR mở.',
            },
            {
              content: 'on: workflow_dispatch',
              explanation: 'workflow_dispatch chỉ chạy khi bấm tay hoặc gọi API.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Matrix có node: [20, 22, 24] và os: [ubuntu-latest, windows-latest] sinh ra bao nhiêu job?',
          relatedLecture: 3,
          options: [
            {
              content: '6',
              correct: true,
              explanation: 'Matrix tạo tích Descartes của các giá trị: 3 phiên bản × 2 hệ điều hành.',
            },
            {
              content: '5',
              explanation: 'Matrix không cộng số giá trị mà nhân chúng với nhau.',
            },
            {
              content: '1',
              explanation: 'Mỗi tổ hợp là một job riêng, chạy song song.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khoá (key) cho actions/cache nên dựa vào đâu để cache node_modules đúng lúc?',
          relatedLecture: 4,
          options: [
            {
              content: 'Hệ điều hành và hash của package-lock.json',
              correct: true,
              explanation: 'Lock file đổi thì dependency đổi, key mới buộc cache được tạo lại.',
            },
            {
              content: 'Số thứ tự lần chạy workflow',
              explanation: 'Mỗi lần chạy có số khác nhau nên cache không bao giờ trúng.',
            },
            {
              content: 'Một chuỗi cố định như "deps"',
              explanation: 'Dependency thay đổi mà cache vẫn trúng, bạn sẽ chạy với thư viện cũ.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Phát biểu nào đúng về secrets trong GitHub Actions? (chọn tất cả đáp án đúng)',
          relatedLecture: 5,
          options: [
            {
              content: 'Giá trị secret bị che thành *** trong log',
              correct: true,
              explanation: 'Runner tự che chuỗi trùng với secret khi in ra log.',
            },
            {
              content: 'Workflow chạy từ pull request của fork mặc định không đọc được secret',
              correct: true,
              explanation: 'Cơ chế này ngăn người lạ mở PR để đánh cắp secret của repository.',
            },
            {
              content: 'Có thể xem lại giá trị secret trên giao diện sau khi lưu',
              explanation: 'Secret chỉ ghi được, giao diện không bao giờ hiển thị lại giá trị.',
            },
            {
              content: 'Nên commit file .env vào repo để workflow đọc cho tiện',
              explanation: 'Commit .env làm lộ thông tin nhạy cảm cho bất kỳ ai đọc được repo.',
            },
          ],
        },
      ],
    },
  },

  // O7
  {
    instructorEmail: 'priya.raman@skillpath.test',
    categorySlug: 'software-testing',
    topics: [{ slug: 'playwright', primary: true }, { slug: 'automation-testing' }, { slug: 'typescript' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'published',
    title: 'Playwright End-to-End Testing with TypeScript',
    subtitle: 'Build a fast, reliable Playwright suite in TypeScript that runs in CI and tells flaky tests from real bugs',
    description:
      'End-to-end tests are supposed to give you confidence before a release, but many teams end up with suites that are slow, flaky and ignored. Tests fail because a button moved, because an animation took a few hundred milliseconds longer than usual, or because one test left data behind that broke the next one. This course shows you how to build a Playwright suite that your team actually trusts.\n\n' +
      'You will work on a realistic demo shop with login, product search, cart and checkout. Starting from a fresh Playwright and TypeScript project, you will learn how the test runner, fixtures and web-first assertions fit together, then move on to locators based on roles and labels, which keep working when the markup changes. Along the way you will refactor the tests into page objects so that a change in the UI touches one file instead of twenty.\n\n' +
      'By the end of the course you will be able to:\n' +
      '• Write resilient tests with getByRole, getByLabel and auto-waiting assertions instead of manual sleeps\n' +
      '• Log in once and reuse the authenticated state across the whole suite\n' +
      '• Mock slow or unreliable backend calls with page.route and test edge cases on demand\n' +
      '• Combine UI and API tests in one project using the request fixture\n' +
      '• Run tests in parallel across browsers, configure retries and investigate failures with Trace Viewer\n\n' +
      'The final chapter connects everything to a CI pipeline, including sharding, HTML reports and traces uploaded as artifacts, so a failed run can be diagnosed without reproducing it locally. Each chapter ends with a hands-on task on the demo shop, and the coding exercise asks you to summarize a test run with retries, using the same rules Playwright applies to decide whether a test passed, failed or was flaky.',
    learningObjectives: [
      'Write Playwright tests in TypeScript using role-based locators and web-first assertions',
      'Structure a growing suite with the Page Object Model and custom fixtures',
      'Reuse authenticated sessions with storageState to cut login time from every test',
      'Mock network responses with page.route to test error and empty states reliably',
      'Configure projects, parallel workers and retries, and debug failures with Trace Viewer',
    ],
    requirements: [
      'Comfortable with JavaScript or TypeScript basics: functions, async/await, modules',
      'Node.js 20 or newer installed on your machine',
    ],
    targetAudience: [
      'QA engineers moving from manual testing or Selenium to Playwright',
      'Frontend developers who want reliable end-to-end tests for their apps',
    ],
    thumbnail: { label: 'Playwright', tagline: 'Reliable E2E tests' },
    sections: [
      {
        title: 'Getting Started',
        lectures: [
          'Course introduction and installing Playwright with TypeScript',
          'Anatomy of a Playwright test: test, expect and fixtures',
        ],
      },
      {
        title: 'Writing Reliable Tests',
        lectures: [
          'Locators that survive UI changes: getByRole, getByLabel and getByTestId',
          'Auto-waiting and web-first assertions',
          'Page Object Model for a real checkout flow',
        ],
      },
      {
        title: 'Beyond the Browser UI',
        lectures: [
          'Reusing authentication state with storageState',
          'Mocking network calls with page.route',
          'API testing with the request fixture',
        ],
      },
      {
        title: 'Scaling the Suite',
        lectures: [
          'Parallel workers, projects and retries in playwright.config.ts',
          'Debugging failures with Trace Viewer and running Playwright in CI',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Reliable Playwright Tests',
      description: 'Check your understanding of locators, assertions, auth state, mocking and retries.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Which locator is most likely to keep working after the checkout page markup is redesigned?',
          relatedLecture: 2,
          options: [
            {
              content: "page.getByRole('button', { name: 'Place order' })",
              correct: true,
              explanation: 'It targets what the user sees and what assistive technology exposes, not the DOM structure.',
            },
            {
              content: "page.locator('div.checkout > div:nth-child(3) > button')",
              explanation: 'Any change in nesting or element order breaks this CSS path.',
            },
            {
              content: "page.locator('xpath=/html/body/div[2]/form/button[1]')",
              explanation: 'Absolute XPath depends on the full document structure and is the most brittle option.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: "What does await expect(page.getByText('Saved')).toBeVisible() do if the text appears after 800 ms?",
          relatedLecture: 3,
          options: [
            {
              content: 'It keeps retrying and passes once the text becomes visible, within the assertion timeout',
              correct: true,
              explanation: 'Web-first assertions poll the page until the condition holds or the timeout is reached.',
            },
            {
              content: 'It fails immediately because the text is not there yet',
              explanation: 'That is how a plain one-shot check behaves, not a web-first assertion.',
            },
            {
              content: 'It only works if you add page.waitForTimeout(1000) before it',
              explanation: 'Fixed sleeps are unnecessary here and make the suite slower and still flaky.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is the main benefit of saving storageState after a setup login?',
          relatedLecture: 5,
          options: [
            {
              content: 'Tests start already authenticated, so the login UI is not repeated in every test',
              correct: true,
              explanation: 'Cookies and local storage are restored into each new context, saving time and removing a source of flakiness.',
            },
            {
              content: 'It encrypts the password used by the tests',
              explanation: 'storageState is a plain JSON file of cookies and storage and should be kept out of version control.',
            },
            {
              content: 'It shares one browser page between all tests',
              explanation: 'Each test still gets its own isolated context; only the stored auth state is reused.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which of these can you do with page.route? (select all that apply)',
          relatedLecture: 6,
          options: [
            {
              content: 'Fulfill a request with mocked JSON',
              correct: true,
              explanation: 'route.fulfill returns a fake response without touching the real backend.',
            },
            {
              content: 'Abort requests, for example to block images',
              correct: true,
              explanation: 'route.abort stops the request, useful for speed or for simulating network errors.',
            },
            {
              content: 'Modify headers before letting the request continue',
              correct: true,
              explanation: 'route.continue accepts overrides for headers, method and post data.',
            },
            {
              content: "Change data directly in the server's database",
              explanation: 'Routing only intercepts traffic in the browser context; it has no access to the server.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'With retries set to 2, a test fails on the first attempt and passes on the second. How does Playwright report it?',
          relatedLecture: 8,
          options: [
            {
              content: 'As flaky',
              correct: true,
              explanation: 'A test that passes only after a retry is marked flaky so it does not hide in the passed count.',
            },
            {
              content: 'As passed, with no further note',
              explanation: 'Playwright deliberately separates flaky tests from tests that passed on the first attempt.',
            },
            {
              content: 'As failed',
              explanation: 'The final attempt passed, so the test does not fail the run.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Summarize a test run with retries',
      learningObjective: 'Apply the passed, flaky, failed and skipped rules that Playwright uses when retries are enabled',
      instructions:
        'Your CI collects the result of every attempt of each test. Write a program that summarizes the run.\n\n' +
        'Input (stdin):\n' +
        '• The first line is n, the number of tests.\n' +
        '• Each of the next n lines has the form "<title>|<attempts>", where attempts is a comma-separated list of statuses in order: passed, failed, timedOut or skipped. The title may itself contain "|", so split on the last one.\n\n' +
        'Rules:\n' +
        '• skipped: the last attempt is skipped\n' +
        '• passed: a single attempt that passed\n' +
        '• flaky: the last attempt passed after at least one earlier attempt that did not\n' +
        '• failed: the last attempt is failed or timedOut\n\n' +
        'Output (stdout):\n' +
        '• First line: "passed: P, flaky: F, failed: X, skipped: S"\n' +
        '• Then one line per failed test in input order: "FAILED <title> (<k> attempts)" (use "1 attempt" when k is 1)\n' +
        '• Then one line per flaky test in input order: "FLAKY <title> (passed on attempt <k>)"\n\n' +
        'Example input:\n' +
        '3\n' +
        'cart > adds item|passed\n' +
        'checkout > applies coupon|failed,passed\n' +
        'search > filters by price|failed,failed\n\n' +
        'Example output:\n' +
        'passed: 1, flaky: 1, failed: 1, skipped: 0\n' +
        'FAILED search > filters by price (2 attempts)\n' +
        'FLAKY checkout > applies coupon (passed on attempt 2)',
      hints: [
        'Use lastIndexOf to find the separator so titles containing "|" still work',
        'Only the last attempt and the number of attempts decide the category',
        'Collect failed and flaky lines in separate arrays so they print in the right order',
      ],
      solutionExplanation:
        'Each line is split on the last "|" into a title and a list of attempts. The last attempt decides the outcome: skipped stays skipped, passed is either passed (one attempt) or flaky (more than one), and failed or timedOut means failed. Counts are kept in an object, and the detail lines are gathered in two arrays so all failed tests are printed before the flaky ones, each in input order.',
      difficulty: 'easy',
      relatedLecture: 8,
      code: [{ language: 'javascript', starter: PLAYWRIGHT_STARTER, solution: PLAYWRIGHT_SOLUTION }],
      tests: [
        {
          input:
            '4\nlogin > shows error for wrong password|passed\ncheckout > applies coupon|failed,passed\nsearch > filters by price|failed,failed,failed\nprofile > uploads avatar|skipped\n',
          expectedOutput:
            'passed: 1, flaky: 1, failed: 1, skipped: 1\nFAILED search > filters by price (3 attempts)\nFLAKY checkout > applies coupon (passed on attempt 2)',
          isPublic: true,
        },
        {
          input: '2\nhome > renders hero banner|passed\ncart > removes item|passed\n',
          expectedOutput: 'passed: 2, flaky: 0, failed: 0, skipped: 0',
          isPublic: false,
        },
        {
          input:
            '3\napi | health check|timedOut\nsettings > saves theme|timedOut,passed\norders > paginates|failed,timedOut\n',
          expectedOutput:
            'passed: 0, flaky: 1, failed: 2, skipped: 0\nFAILED api | health check (1 attempt)\nFAILED orders > paginates (2 attempts)\nFLAKY settings > saves theme (passed on attempt 2)',
          isPublic: false,
        },
        {
          input: '0\n',
          expectedOutput: 'passed: 0, flaky: 0, failed: 0, skipped: 0',
          isPublic: false,
        },
      ],
    },
  },

  // O8
  {
    instructorEmail: 'priya.raman@skillpath.test',
    categorySlug: 'software-testing',
    topics: [{ slug: 'selenium-webdriver', primary: true }, { slug: 'pytest' }, { slug: 'python' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'published',
    title: 'Selenium WebDriver with Python & pytest',
    subtitle: 'Write maintainable browser tests in Python with Selenium 4, explicit waits, page objects and pytest fixtures',
    description:
      'Selenium WebDriver is still the backbone of browser automation in many companies, especially in teams that already use Python for their backend or data work. Yet a lot of Selenium code found online is fragile: hard-coded sleeps, absolute XPath expressions copied from the browser, and one giant script that is impossible to maintain. This course teaches you to write Selenium tests in Python the way a test automation engineer would, with pytest providing structure, fixtures and reporting.\n\n' +
      'We begin with a clean setup using Selenium 4, which manages browser drivers for you, and pytest. You will learn to pick stable locators with IDs and CSS selectors, use XPath only when it really helps, and replace sleeps with explicit waits based on expected conditions. Then we handle the awkward parts of real web apps: alerts, iframes, file uploads and multiple windows.\n\n' +
      'After this course you will be able to:\n' +
      '• Set up and tear down browsers cleanly with pytest fixtures and conftest.py\n' +
      '• Write explicit waits that are fast when the page is fast and patient when it is slow\n' +
      '• Turn one login test into a data-driven suite with pytest.mark.parametrize\n' +
      '• Organize tests with the Page Object Model so UI changes stay in one place\n' +
      '• Run tests headless and in parallel, with screenshots and HTML reports for every failure\n\n' +
      'The course is built around a demo web application with a login form, product listing and checkout, so every technique is applied to realistic pages. Each chapter ends with a practical task, and the coding exercise simulates how WebDriverWait polls for an element, so you understand exactly why a test waits as long as it does and how the timeout and polling interval shape the result.',
    learningObjectives: [
      'Choose stable locators with IDs and CSS selectors, and use XPath only where it adds value',
      'Replace time.sleep with WebDriverWait and expected_conditions for fast, stable tests',
      'Manage driver setup and teardown with pytest fixtures defined in conftest.py',
      'Build data-driven tests with pytest.mark.parametrize and the Page Object Model',
      'Run suites headless and in parallel with pytest-xdist, capturing screenshots on failure',
    ],
    requirements: [
      'Basic Python: functions, classes and modules',
      'Python 3.10 or newer and Chrome or Firefox installed',
    ],
    targetAudience: [
      'Manual testers starting with test automation in Python',
      'Python developers who need to add browser tests to their projects',
    ],
    thumbnail: { label: 'Selenium', tagline: 'Python & pytest automation' },
    sections: [
      {
        title: 'Setting Up',
        lectures: [
          'Course introduction and setting up Python, Selenium 4 and pytest',
          'Your first WebDriver script: opening pages, finding elements, clicking',
        ],
      },
      {
        title: 'Locators and Waits',
        lectures: [
          'Choosing locators: ID, CSS selectors and XPath',
          'Implicit vs explicit waits with WebDriverWait and expected_conditions',
          'Handling alerts, iframes and multiple windows',
        ],
      },
      {
        title: 'Structuring Tests with pytest',
        lectures: [
          'pytest fixtures for driver setup and teardown',
          'Parametrized tests and data-driven login scenarios',
          'Page Object Model in Python',
        ],
      },
      {
        title: 'Running at Scale',
        lectures: [
          'Headless runs, Selenium Grid and parallel execution with pytest-xdist',
          'HTML reports, screenshots on failure and running in CI',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Selenium and pytest Essentials',
      description: 'Review locators, waits, fixtures and parametrized tests.',
      questions: [
        {
          type: 'multiple_choice',
          stem: 'Which of these are valid locator strategies in Selenium 4 for Python? (select all that apply)',
          relatedLecture: 2,
          options: [
            {
              content: 'By.ID',
              correct: true,
              explanation: 'Finds an element by its id attribute, usually the most stable option.',
            },
            {
              content: 'By.CSS_SELECTOR',
              correct: true,
              explanation: 'CSS selectors are fast and readable for most locators.',
            },
            {
              content: 'By.XPATH',
              correct: true,
              explanation: 'XPath is supported and useful for cases like locating by text or by a parent element.',
            },
            {
              content: 'By.TEXT',
              explanation: 'There is no By.TEXT; to match text you use By.LINK_TEXT for links or an XPath expression.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Why is WebDriverWait with an expected condition better than time.sleep(5)?',
          relatedLecture: 3,
          options: [
            {
              content: 'It continues as soon as the condition is met and only waits the full timeout when something is wrong',
              correct: true,
              explanation: 'Polling makes tests fast on a fast page and still tolerant on a slow one.',
            },
            {
              content: 'It makes the page load faster',
              explanation: 'Waiting strategies do not change how fast the application responds.',
            },
            {
              content: 'It never raises an exception',
              explanation: 'If the condition is not met before the timeout, WebDriverWait raises TimeoutException.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is the risk of setting an implicit wait and also using explicit waits in the same test?',
          relatedLecture: 3,
          options: [
            {
              content: 'Wait times can add up in unpredictable ways, so the Selenium docs advise against mixing them',
              correct: true,
              explanation: 'Each poll of the explicit wait may itself block for the implicit wait, making timeouts hard to reason about.',
            },
            {
              content: 'Selenium raises an error immediately',
              explanation: 'Mixing them is allowed technically; the problem is the unpredictable timing.',
            },
            {
              content: 'The explicit wait is ignored',
              explanation: 'Both waits still apply, which is exactly why the total wait becomes hard to predict.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'In a pytest fixture that creates a driver and then uses yield driver, when does the code after yield run?',
          relatedLecture: 5,
          options: [
            {
              content: 'After the test that used the fixture finishes, even if the test failed',
              correct: true,
              explanation: 'Code after yield is the teardown, which is the right place for driver.quit().',
            },
            {
              content: 'Before the test starts',
              explanation: 'Code before yield is the setup; code after yield runs later.',
            },
            {
              content: 'Only when the test passes',
              explanation: 'Teardown runs whether the test passes or fails, so browsers are not left open.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'A test is decorated with @pytest.mark.parametrize("user,password", [...]) with three tuples. How many test cases does pytest collect?',
          relatedLecture: 6,
          options: [
            {
              content: '3',
              correct: true,
              explanation: 'Each tuple becomes a separate test case with its own ID in the report.',
            },
            {
              content: '1',
              explanation: 'Parametrize does not loop inside one test; it generates separate test items.',
            },
            {
              content: '6',
              explanation: 'The two parameter names belong to one tuple; they are not multiplied.',
            },
          ],
        },
      ],
    },
    exercise: {
      title: 'Simulate an explicit wait',
      learningObjective: 'Understand how timeout and polling interval decide when WebDriverWait finds an element or gives up',
      instructions:
        'WebDriverWait checks a condition repeatedly until it is true or the timeout runs out. In this simplified model, a wait checks at t = 0, poll, 2·poll, … for as long as t <= timeout. An element is found at the first check where t >= the time it appears.\n\n' +
        'Input (stdin):\n' +
        '• Line 1: two integers, timeout_ms and poll_ms\n' +
        '• Line 2: m, the number of locators\n' +
        '• Next m lines: "<locator> <appear_ms>", where appear_ms is an integer or the word never. The locator may contain spaces; the appear time is always the last token.\n\n' +
        'Output (stdout), one line per locator in input order:\n' +
        '• "<locator>: found at <t>ms after <k> checks" when found\n' +
        '• "<locator>: TimeoutException after <k> checks" when not found\n' +
        'Use "1 check" instead of "1 checks". The last line is "found: <found>/<m>".\n\n' +
        'Example input:\n' +
        '2000 500\n' +
        '2\n' +
        '#username 700\n' +
        '#error-banner never\n\n' +
        'Example output:\n' +
        '#username: found at 1000ms after 3 checks\n' +
        '#error-banner: TimeoutException after 5 checks\n' +
        'found: 1/2',
      hints: [
        'Use line.rsplit(" ", 1) to separate the locator from the appear time',
        'Loop while t <= timeout_ms and count every check, including the one at t = 0',
        'Represent never as None so the condition simply never becomes true',
      ],
      solutionExplanation:
        'wait_for simulates the polling loop: it starts at t = 0, counts a check, returns the current time if the element has appeared, and otherwise advances by the polling interval until t exceeds the timeout. The main function parses each locator with rsplit so locators with spaces work, prints either the found time or a TimeoutException with the number of checks, and keeps a counter for the final summary line.',
      difficulty: 'easy',
      relatedLecture: 3,
      code: [{ language: 'python', starter: SELENIUM_STARTER, solution: SELENIUM_SOLUTION }],
      tests: [
        {
          input: '10000 500\n3\n#login-button 0\n.toast-success 1200\n#spinner never\n',
          expectedOutput:
            '#login-button: found at 0ms after 1 check\n.toast-success: found at 1500ms after 4 checks\n#spinner: TimeoutException after 21 checks\nfound: 2/3',
          isPublic: true,
        },
        {
          input: '3000 1000\n2\ndiv.modal 3000\ntable#orders tbody tr never\n',
          expectedOutput:
            'div.modal: found at 3000ms after 4 checks\ntable#orders tbody tr: TimeoutException after 4 checks\nfound: 1/2',
          isPublic: false,
        },
        {
          input: '2000 300\n1\n[data-test=cart-badge] 2001\n',
          expectedOutput: '[data-test=cart-badge]: TimeoutException after 7 checks\nfound: 0/1',
          isPublic: false,
        },
      ],
    },
  },

  // O9
  {
    instructorEmail: 'priya.raman@skillpath.test',
    categorySlug: 'software-testing',
    topics: [{ slug: 'postman', primary: true }, { slug: 'automation-testing' }],
    language: 'en',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'API Testing with Postman',
    subtitle: 'Test REST APIs with Postman, from your first request to automated collections running with Newman in CI',
    description:
      'Most modern applications talk to each other through APIs, and many bugs live there long before they show up in the user interface. Testing APIs directly is faster and more stable than clicking through screens, yet many testers only use Postman to send a request and check the response by eye. This course turns Postman into a real testing tool, even if you have never tested an API before.\n\n' +
      'We start with the essentials of HTTP: methods, status codes, headers and JSON bodies, explained with requests to a demo REST API for a small online library. You will organize your work into collections, switch between development and staging with environments, and keep secrets out of shared files using variables. Then you will write test scripts that check status codes, response times and the shape of the JSON that comes back.\n\n' +
      'By the end of the course you will be able to:\n' +
      '• Read and design API requests with the correct method, headers and body\n' +
      '• Authenticate with API keys, Bearer tokens and OAuth 2.0\n' +
      '• Write assertions with pm.test and pm.expect for status, headers and payload\n' +
      '• Chain requests by saving a token or an ID for the next call\n' +
      '• Run data-driven tests from a CSV file and execute collections with Newman in a CI pipeline\n\n' +
      'No programming background is required, since the JavaScript used in test scripts is introduced step by step with small, readable examples. Every lesson includes a ready-made collection you can import and compare with your own, and the final chapter shows how to turn a manual exploratory session into a regression suite that runs automatically on every build of the project.',
    learningObjectives: [
      'Explain HTTP methods, status codes and headers, and choose the right ones for each request',
      'Organize requests into collections and environments with variables for each stage',
      'Write test scripts with pm.test and pm.expect to validate status, headers and JSON body',
      'Chain requests by storing tokens and IDs in variables between calls',
      'Run data-driven collections with CSV files and automate them in CI using Newman',
    ],
    requirements: ['No prior API or programming experience needed', 'The free Postman desktop app installed'],
    targetAudience: [
      'Manual testers who want to start with API testing',
      'Developers who need a quick, repeatable way to verify their endpoints',
    ],
    thumbnail: { label: 'Postman', tagline: 'API testing made simple' },
    sections: [
      {
        title: 'API Basics',
        lectures: ['Course introduction and installing Postman', 'HTTP methods, status codes and headers explained'],
      },
      {
        title: 'Working in Postman',
        lectures: [
          'Collections, environments and variables',
          'Authentication: API keys, Bearer tokens and OAuth 2.0',
          'Writing test scripts with pm.test and pm.expect',
        ],
      },
      {
        title: 'Automating API Tests',
        lectures: [
          'Chaining requests: saving a token and an ID for the next call',
          'Data-driven runs with the Collection Runner and CSV files',
          'Running collections from the command line with Newman in CI',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: API Testing Fundamentals',
      description: 'Review HTTP basics, variables, test scripts and request chaining.',
      questions: [
        {
          type: 'single_choice',
          stem: 'A POST /books request successfully creates a new book. Which status code should the API return?',
          relatedLecture: 1,
          options: [
            {
              content: '201 Created',
              correct: true,
              explanation: '201 signals that a new resource was created, often with a Location header pointing to it.',
            },
            {
              content: '200 OK',
              explanation: 'Acceptable for many responses, but 201 is the precise code for a newly created resource.',
            },
            {
              content: '204 No Content',
              explanation: '204 means success with no response body, typical for DELETE rather than creation.',
            },
            {
              content: '404 Not Found',
              explanation: '404 means the target resource does not exist, which is an error, not a successful creation.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which HTTP methods are idempotent according to the HTTP specification? (select all that apply)',
          relatedLecture: 1,
          options: [
            {
              content: 'GET',
              correct: true,
              explanation: 'Reading the same resource many times does not change server state.',
            },
            {
              content: 'PUT',
              correct: true,
              explanation: 'Replacing a resource with the same body repeatedly leaves it in the same final state.',
            },
            {
              content: 'DELETE',
              correct: true,
              explanation: 'After the first delete the resource is gone; repeating it does not change the state further.',
            },
            {
              content: 'POST',
              explanation: 'Sending the same POST twice typically creates two resources, so it is not idempotent.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'A variable baseUrl is defined both in the active environment and as a global. Which value does a request use?',
          relatedLecture: 2,
          options: [
            {
              content: 'The environment value',
              correct: true,
              explanation: 'Narrower scopes win: environment variables override globals with the same name.',
            },
            {
              content: 'The global value',
              explanation: 'Global is the broadest scope, so it has the lowest priority.',
            },
            {
              content: 'Postman shows an error because of the conflict',
              explanation: 'Duplicate names are allowed; Postman resolves them by scope priority.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Which line in a test script checks that the response status is 200?',
          relatedLecture: 4,
          options: [
            {
              content: 'pm.response.to.have.status(200);',
              correct: true,
              explanation: 'This is the built-in Chai-style assertion for the status code, usually wrapped in pm.test.',
            },
            {
              content: 'pm.request.status === 200;',
              explanation: 'pm.request describes the outgoing request; it has no status, and a bare comparison asserts nothing.',
            },
            {
              content: "pm.environment.set('status', 200);",
              explanation: 'This only stores a variable and does not check the response at all.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'The login request returns a JSON body with a token field. How do you make it available to the next requests?',
          relatedLecture: 5,
          options: [
            {
              content: "In the login request's test script, call pm.environment.set('token', pm.response.json().token)",
              correct: true,
              explanation: 'The next requests can then use {{token}}, for example in an Authorization: Bearer header.',
            },
            {
              content: 'Copy the token by hand into every request',
              explanation: 'This works once but breaks as soon as the token expires and cannot run in automation.',
            },
            {
              content: 'Postman shares response values between requests automatically',
              explanation: 'Nothing is shared unless you store it in a variable yourself.',
            },
          ],
        },
      ],
    },
  },

  // O10
  {
    instructorEmail: 'priya.raman@skillpath.test',
    categorySlug: 'software-testing',
    topics: [{ slug: 'istqb-certified-tester-foundation-level-ctfl', primary: true }, { slug: 'automation-testing' }],
    language: 'en',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'ISTQB CTFL v4.0 Exam Prep',
    subtitle: 'Master the ISTQB Foundation Level syllabus and test design techniques with exam-style practice questions',
    description:
      'The ISTQB Certified Tester Foundation Level (CTFL) is a common starting point for anyone who wants a recognized testing certificate, but the syllabus is dense and the exam questions are precise about terminology. Many candidates know testing from experience and still lose points because they mix up an error with a defect, or a test level with a test type. This course walks through the CTFL v4.0 syllabus chapter by chapter and explains each concept with practical examples from everyday software projects.\n\n' +
      'You will cover the fundamentals of testing and the seven principles, testing across the software development lifecycle, static testing and reviews, black-box, white-box and experience-based test techniques, test management and tool support. The test techniques chapter gets the most attention, because it carries many of the calculation-style questions: equivalence partitioning, boundary value analysis, decision tables, state transition testing, and statement and branch coverage.\n\n' +
      'After completing the course you will be able to:\n' +
      '• Use ISTQB terminology accurately in exam answers and in daily work\n' +
      '• Derive test cases with equivalence partitioning and boundary value analysis\n' +
      '• Build decision tables and state transition diagrams from a short specification\n' +
      '• Calculate statement and branch coverage for a small piece of code\n' +
      '• Explain risk-based testing and write a clear defect report\n\n' +
      'Every chapter ends with practice questions in the exam style, followed by a walkthrough of why each option is right or wrong. The last lesson is a full mock exam with a review of the trickiest questions, so you know how to manage your time on the day. The course is useful even if you do not plan to take the exam, because the same techniques make your everyday test design more systematic.',
    learningObjectives: [
      'Use ISTQB terms such as error, defect, failure, test level and test type correctly',
      'Derive test cases with equivalence partitioning and two-value boundary value analysis',
      'Build decision tables and state transition tests from a short requirement',
      'Calculate statement and branch coverage for a small code snippet',
      'Answer CTFL v4.0 exam-style questions within the time limit using elimination',
    ],
    requirements: ['No prior certification needed; some exposure to software projects helps'],
    targetAudience: [
      'Testers and QA engineers preparing for the ISTQB Foundation Level exam',
      'Developers and business analysts who want a solid testing vocabulary',
    ],
    thumbnail: { label: 'ISTQB CTFL', tagline: 'Foundation Level exam prep' },
    sections: [
      {
        title: 'Fundamentals of Testing',
        lectures: [
          'Course introduction and how the CTFL v4.0 exam works',
          'Why testing is necessary and the seven testing principles',
          'Errors, defects and failures: getting the terms right',
        ],
      },
      {
        title: 'Testing Throughout the SDLC',
        lectures: ['Test levels and test types', 'Static testing and reviews'],
      },
      {
        title: 'Test Techniques',
        lectures: [
          'Equivalence partitioning and boundary value analysis',
          'Decision tables and state transition testing',
          'Statement coverage and branch coverage',
        ],
      },
      {
        title: 'Managing the Test Activities',
        lectures: [
          'Test planning, risk-based testing and defect reports',
          'Tool support for testing and a full mock exam walkthrough',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: CTFL Foundations',
      description: 'Exam-style questions on principles, terminology, static testing and test techniques.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Running the same regression tests unchanged for months finds fewer and fewer new defects. Which principle describes this?',
          relatedLecture: 1,
          options: [
            {
              content: 'Tests wear out',
              correct: true,
              explanation: 'Repeated tests lose their ability to find new defects, so they need to be reviewed and updated.',
            },
            {
              content: 'Exhaustive testing is impossible',
              explanation: 'This principle is about not being able to test every combination, not about repetition.',
            },
            {
              content: 'Defects cluster together',
              explanation: 'This says most defects are found in a small number of modules.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'A developer misreads a requirement and codes ">" instead of ">=". What is the wrong condition in the code called?',
          relatedLecture: 2,
          options: [
            {
              content: 'A defect',
              correct: true,
              explanation: 'A defect (bug, fault) is the flaw in the work product, here the source code.',
            },
            {
              content: 'An error',
              explanation: 'The error is the human mistake of misreading the requirement, which caused the defect.',
            },
            {
              content: 'A failure',
              explanation: 'A failure is the incorrect behavior observed when the defective code is executed.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which statements about static testing are true? (select all that apply)',
          relatedLecture: 4,
          options: [
            {
              content: 'Reviews of requirements are a form of static testing',
              correct: true,
              explanation: 'Static testing examines work products without executing them, and requirements are a work product.',
            },
            {
              content: 'Static analysis of source code is a form of static testing',
              correct: true,
              explanation: 'Tools analyze the code without running it, for example to find unreachable code.',
            },
            {
              content: 'It can find defects before any code is executed',
              correct: true,
              explanation: 'That is its main advantage: defects found early are cheaper to fix.',
            },
            {
              content: 'Running unit tests is a form of static testing',
              explanation: 'Unit tests execute the code, so they are dynamic testing.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'An age field accepts whole numbers from 18 to 60 inclusive. Using two-value boundary value analysis, which values should you test?',
          relatedLecture: 5,
          options: [
            {
              content: '17, 18, 60, 61',
              correct: true,
              explanation: 'Each boundary is tested with the boundary value and its closest neighbour in the adjacent partition.',
            },
            {
              content: '18 and 60',
              explanation: 'These are the valid boundaries only; the invalid neighbours 17 and 61 are missing.',
            },
            {
              content: '17, 18, 19, 59, 60, 61',
              explanation: 'This is three-value boundary value analysis, not the two-value variant asked for.',
            },
            {
              content: '0, 18, 60, 100',
              explanation: '0 and 100 are not adjacent to the boundaries, so they do not test the edges.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'A test suite achieves 100% branch coverage. What can you conclude about statement coverage?',
          relatedLecture: 7,
          options: [
            {
              content: 'It is also 100%',
              correct: true,
              explanation: 'Exercising every branch means every statement on those branches is executed too.',
            },
            {
              content: 'It is at least 50%',
              explanation: 'Branch coverage guarantees more than that; full branch coverage implies full statement coverage.',
            },
            {
              content: 'Nothing, the two measures are unrelated',
              explanation: 'They are related: branch coverage subsumes statement coverage.',
            },
          ],
        },
      ],
    },
  },
];
