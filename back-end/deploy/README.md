# Deploy back-end lên EC2

Push `main` (có thay đổi trong `back-end/`) → GitHub Actions lint + build → đẩy image `ghcr.io/tuanvdtd/skillpath-api` → nếu EC2 đang chạy thì deploy qua SSM. Máy đang tắt thì lần Start sau tự kéo bản mới (`skillpath.service`).

| File | Chạy ở đâu | Việc |
|---|---|---|
| `compose.yaml` | EC2 `/opt/skillpath` | `api` + `cloudflared` |
| `deploy.sh` | EC2 | pull → `prisma migrate deploy` → up → kiểm `GET /api` |
| `user-data.sh` | EC2, 1 lần khi launch | Docker, compose, swap 1GB, `skillpath.service` |
| `ci-deploy.sh` | GitHub Actions | Kiểm máy đang chạy, gửi lệnh SSM, chờ kết quả |

## Dựng lần đầu (làm 1 lần)

Region: `ap-southeast-1`. `<ACCOUNT_ID>` = 12 số ở góc phải trên console.

### 1. OIDC provider cho GitHub
IAM → Identity providers → Add provider → OpenID Connect
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2. Role cho EC2
IAM → Roles → Create role → AWS service → EC2 → policy `AmazonSSMManagedInstanceCore` → tên `skillpath-ec2`.

### 3. Launch EC2
EC2 → Launch instance
- Name `skillpath-api`, AMI **Amazon Linux 2023** (x86_64), type `t3.small`
- Key pair: **Proceed without a key pair**
- Network: Create security group, **bỏ tick mọi inbound rule** (không mở cổng nào)
- Storage: 20 GiB gp3
- Advanced details → IAM instance profile: `skillpath-ec2`; User data: dán toàn bộ `user-data.sh`
- Launch → ghi lại **Instance ID** (`i-...`)

Kiểm: đợi 2/2 status checks → Connect → Session Manager → Connect → `sudo docker compose version` và `free -h` (thấy Swap 1.0Gi).

### 4. Role cho GitHub Actions
IAM → Roles → Create role → Custom trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:tuanvdtd/LMS-Platform:ref:refs/heads/main"
      }
    }
  }]
}
```
Không gắn managed policy → tên `skillpath-github-deploy` → Create. Mở role → Add permissions → Create inline policy (JSON):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "ec2:DescribeInstances", "Resource": "*" },
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:ap-southeast-1:<ACCOUNT_ID>:instance/<INSTANCE_ID>",
        "arn:aws:ssm:ap-southeast-1::document/AWS-RunShellScript"
      ]
    },
    { "Effect": "Allow", "Action": "ssm:GetCommandInvocation", "Resource": "*" }
  ]
}
```
`DescribeInstances` không giới hạn được theo instance nên để `*`. Ghi lại **ARN** của role.

### 5. Cảnh báo chi phí
Billing → Budgets → Create budget → Monthly cost budget → $30 → email nhận cảnh báo.

### 6. Token Cloudflare Tunnel
Trên Mac: `cloudflared tunnel token skillpath` → copy chuỗi in ra.

Đích của tunnel phải là `http://localhost:4000` (Mac `pnpm dev:tunnel` và EC2 đều chạy API ở cổng 4000):
- Zero Trust → Networks → Tunnels → `skillpath`: nếu là **remotely managed** thì sửa public hostname `api-learn.tuandt.me` → `http://localhost:4000`.
- Nếu **locally managed**: compose đã truyền `--url http://localhost:4000`; trên Mac sửa lệnh hoặc `~/.cloudflared/config.yml` chạy tunnel nếu đang ghi 4001.

### 7. File `.env` trên máy
Session Manager:
```bash
sudo tee /opt/skillpath/.env > /dev/null   # dán nội dung, xong bấm Ctrl-D
sudo chmod 600 /opt/skillpath/.env
```
Nội dung = `.env` dev, sửa/thêm:
```
BETTER_AUTH_URL=https://api-learn.tuandt.me
FE_URL=https://learn.tuandt.me
COOKIE_DOMAIN=.tuandt.me
SENTRY_ENVIRONMENT=production
PISTON_URL=
TUNNEL_TOKEN=<chuỗi ở bước 6>
```
`PORT` không cần (compose ép 4000). Giá trị nào chứa `$` phải bọc nháy đơn: `KEY='abc$def'`.
Giữ một bản sao file này ở Mac (ngoài git) — Terminate máy là mất.

### 8. Đăng nhập GHCR trên máy
GitHub → Settings → Developer settings → Personal access tokens (classic) → scope **chỉ `read:packages`**, hạn dài (vd 1 năm).
```bash
sudo docker login ghcr.io -u tuanvdtd   # dán PAT khi hỏi password
```
Deploy chạy bằng root nên phải `sudo`. PAT hết hạn → deploy lỗi ở bước pull, container cũ vẫn chạy → tạo PAT mới, login lại.

### 9. Biến cho GitHub Actions
Repo → Settings → Secrets and variables → Actions → **Variables** (không nhạy cảm, không cần Secrets):
- `AWS_ROLE_ARN` = ARN ở bước 4
- `AWS_REGION` = `ap-southeast-1`
- `EC2_INSTANCE_ID` = Instance ID ở bước 3

### 10. Đối chiếu dịch vụ ngoài
Đã trỏ `api-learn.tuandt.me` từ thời `dev:tunnel`, chỉ cần kiểm:
- Stripe → Developers → Webhooks: endpoint `https://api-learn.tuandt.me/api/webhooks/stripe`, signing secret khớp `STRIPE_WEBHOOK_SECRET` trong `.env` máy.
- Google/GitHub OAuth: callback `https://api-learn.tuandt.me/api/auth/callback/google` / `.../github`.
- EventBridge API destination MediaConvert trỏ `https://api-learn.tuandt.me/...`.

### 11. Deploy lần đầu
Máy đang chạy → Actions → `back-end` → Run workflow (nhánh `main`). Kiểm `https://api-learn.tuandt.me/api`.

Lần đầu phải deploy lúc máy đang chạy: trước đó máy chưa có `deploy.sh`, service lúc boot sẽ bỏ qua.

## Vận hành hằng ngày

- Bật/tắt: EC2 console → Instance state → Start/Stop. Start xong ~1–2 phút app tự lên bản mới nhất.
- **EC2 đang bật thì không chạy `pnpm dev:tunnel` trên Mac** (chung tunnel, Cloudflare chia request ngẫu nhiên giữa 2 máy), và chạy dev với `RABBITMQ_CONSUMERS=off` (chung RabbitMQ, không thì Mac ăn mất message mail).
- DB dùng chung dev/prod: không tạo migration xoá/đổi tên cột trên nhánh chưa merge.
- Rollback: Actions → chọn run của commit cũ → Re-run all jobs (đẩy lại `latest` về commit đó rồi deploy).
- Log (qua Session Manager):
  - app: `sudo docker compose -f /opt/skillpath/compose.yaml logs -f api`
  - deploy lúc boot: `sudo journalctl -u skillpath`
  - RAM: `sudo docker stats --no-stream`
- Lỗ hổng image: tab Security → Code scanning (Trivy, chỉ báo cáo).
