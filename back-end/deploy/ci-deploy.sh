#!/usr/bin/env bash
# Chạy trên GitHub Actions (cwd = back-end/): gửi compose.yaml + deploy.sh lên EC2 qua SSM rồi chạy deploy.sh.
# Cần sẵn: INSTANCE_ID, quyền AWS (OIDC), aws cli, jq.
set -euo pipefail

state=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].State.Name' --output text)
if [ "$state" != "running" ]; then
  echo "::notice::Máy đang '$state'. Image đã lên GHCR, lần Start sau máy tự cập nhật."
  exit 0
fi

compose_b64=$(base64 -w0 deploy/compose.yaml)
deploy_b64=$(base64 -w0 deploy/deploy.sh)
params=$(jq -n --arg c "$compose_b64" --arg d "$deploy_b64" '{
  commands: [
    "set -e",
    "mkdir -p /opt/skillpath",
    "echo \($c) | base64 -d > /opt/skillpath/compose.yaml",
    "echo \($d) | base64 -d > /opt/skillpath/deploy.sh",
    "chmod +x /opt/skillpath/deploy.sh",
    "/opt/skillpath/deploy.sh"
  ],
  executionTimeout: ["900"]
}')

# Máy vừa Start: state đã running nhưng SSM agent có thể chưa đăng ký → thử lại tối đa 2 phút.
command_id=""
for _ in $(seq 1 12); do
  if command_id=$(aws ssm send-command --instance-ids "$INSTANCE_ID" \
      --document-name AWS-RunShellScript --comment "deploy ${GITHUB_SHA:0:7}" \
      --parameters "$params" --query Command.CommandId --output text 2> send.err); then
    break
  fi
  command_id=""
  grep -q InvalidInstanceId send.err || { cat send.err >&2; exit 1; }
  sleep 10
done
if [ -z "$command_id" ]; then
  echo "::notice::SSM agent chưa sẵn sàng. skillpath.service lúc boot sẽ tự deploy bản mới."
  exit 0
fi

# Không dùng `aws ssm wait command-executed`: nó chỉ chờ ~100s, ngắn hơn một lần pull + migrate.
status="Pending"
for _ in $(seq 1 120); do
  sleep 5
  # Ngay sau khi gửi, invocation có thể chưa tồn tại → coi như đang chờ; lỗi khác (vd thiếu quyền) thì dừng luôn.
  if ! status=$(aws ssm get-command-invocation --command-id "$command_id" --instance-id "$INSTANCE_ID" \
      --query Status --output text 2> poll.err); then
    grep -q InvocationDoesNotExist poll.err || { cat poll.err >&2; exit 1; }
    status="Pending"
  fi
  case "$status" in
    Pending|InProgress|Delayed) ;;
    *) break ;;
  esac
done

aws ssm get-command-invocation --command-id "$command_id" --instance-id "$INSTANCE_ID" \
  --query '[StandardOutputContent, StandardErrorContent]' --output text || true

if [ "$status" != "Success" ]; then
  echo "::error::Deploy kết thúc với trạng thái $status"
  exit 1
fi
