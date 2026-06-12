#!/usr/bin/env bash
# scripts/ec2-bootstrap.sh — run once on a fresh Ubuntu 22.04 EC2 t2.micro instance
# Usage: curl -fsSL <raw-url> | sudo bash
set -euo pipefail

APP_DIR="/opt/auditsmart"
APP_USER="ubuntu"

echo "=== AuditSmart EC2 Bootstrap ==="

# ── 1. System updates ─────────────────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl git unzip jq htop \
  ca-certificates gnupg lsb-release

# ── 2. Install Docker ─────────────────────────────────────────────────────────
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add ubuntu user to docker group (so we can run docker without sudo)
usermod -aG docker "$APP_USER"
systemctl enable docker
systemctl start docker

# ── 3. Swap file (t2.micro has 1GB RAM — swap prevents OOM kills) ─────────────
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Tune swappiness for low-RAM server
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  sysctl -p
fi

# ── 4. Clone the repo ─────────────────────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
  git clone https://github.com/nsvoriginals/auditsmart.git "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── 5. Create .env from SSM Parameter Store ───────────────────────────────────
# Requires EC2 instance role with ssm:GetParametersByPath permission
if command -v aws &>/dev/null; then
  aws ssm get-parameters-by-path \
    --path "/auditsmart/prod" \
    --with-decryption \
    --query "Parameters[*].[Name,Value]" \
    --output text \
  | while IFS=$'\t' read -r name value; do
      key="${name##*/}"
      echo "${key}=${value}"
    done > "$APP_DIR/.env"
  echo "Loaded env from SSM Parameter Store"
else
  echo "WARNING: aws CLI not found — copy .env manually to $APP_DIR/.env"
fi

# ── 6. TLS via Let's Encrypt (certbot) ───────────────────────────────────────
apt-get install -y certbot
# Run: certbot certonly --standalone -d yourdomain.com
# Then mount /etc/letsencrypt into nginx container (see docker-compose.prod.yml)
echo "Reminder: run 'certbot certonly --standalone -d YOUR_DOMAIN' to obtain TLS cert"

# ── 7. Systemd service for auto-start ────────────────────────────────────────
cat > /etc/systemd/system/auditsmart.service << 'EOF'
[Unit]
Description=AuditSmart Docker Compose
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=ubuntu
WorkingDirectory=/opt/auditsmart
ExecStart=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f docker-compose.yml -f docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable auditsmart

# ── 8. Automatic security updates ────────────────────────────────────────────
apt-get install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades

# ── 9. UFW firewall ───────────────────────────────────────────────────────────
apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "=== Bootstrap complete ==="
echo "Next steps:"
echo "  1. Copy your .env file to $APP_DIR/.env (or load from SSM)"
echo "  2. Run: certbot certonly --standalone -d yourdomain.com"
echo "  3. Run: systemctl start auditsmart"
echo "  4. Set up GitHub Actions secrets: EC2_HOST, EC2_SSH_KEY"
echo ""
