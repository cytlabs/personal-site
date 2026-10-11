# 个人云工作环境：搭建与维护记录

更新：2026-10-11。配套文章：[把工作环境搬到线上](../../posts/cloud-workspace-from-phone.md)。

本文是持续维护的操作记录。区分“实际完成”“候选配置”“待验证”，不能将示例直接当作生产现状。公网地址、实际主机公钥、私钥、OAuth、API key、微信身份和个人数据库不写入此仓库。以下 `PUBLIC_SERVER_IP`、`VERIFIED_HOST_KEY`、`WUYING_PUBLIC_KEY` 均须从私有清单替换。

## 1. 当前状态与验收边界

| 项目 | 当前证据 | 尚未完成 |
| --- | --- | --- |
| 旧公网服务器 | OpenClaw、Nginx active；OpenViking running/healthy，localhost health 200 | 后端迁出 |
| 无影 | 用户提供 Ubuntu 24.04.4 LTS、x86_64、8 核 16G；79G 根盘、约 60G 可用；有 sudo | Docker、磁盘总迁移量、长期在线策略核验 |
| Codex 登录 | OpenClaw CLI 明确返回登录成功；OpenViking 独立 OAuth 更新成功 | 新账号下微信完整往返另验 |
| OpenViking 整理模型 | `gpt-6-luna`、`reasoning_effort=low`；一次虚构 JSON 提取调用约 2.5 秒成功；配置已保存并重启，health 200 | 完整异步写入、提取、召回及长期质量复验 |
| SSH 隧道 | 公钥认证成功；三个回环端口已监听；通过 22222 读到无影 OpenSSH 9.6p1 握手 | 无影管理登录、应用后端逐项响应、自动重连与重启恢复 |
| ChatGPT Linux | 官方预览版支持 Ubuntu 24.04、x64 | 尚未安装；手机直连 Linux 不在当前官方 Remote 主机支持列表 |
| 迁移 | 顺序和端口方案已确定 | 备份恢复、迁移、Nginx 切换均未执行 |

初次建立隧道不需要启动任何正式后端。`ExitOnForwardFailure=yes` 只检查远端转发监听建立，不能证明转发目标可访问。前台无输出也不是单独的成功证据。

## 2. 机器职责和三条网络路径

- 公网服务器保留 Nginx、TLS 证书及续期、SSH 隧道入口；当前业务仍在此运行。
- 无影计划承载开发环境、桌面和后端；由无影主动向公网服务器发起 SSH 连接。
- 手机使用微信、已支持的 ChatGPT/Codex 入口或无影客户端；各入口的账号、权限、文件和会话连接分别配置。

网站路径：公网 HTTPS 443 → Nginx → 服务器回环转发端口 → SSH → 无影本机后端。

维护路径：可信管理端 → 原服务器 SSH → `127.0.0.1:22222` → 无影 SSH。此路径还需要无影安装并配置 SSH 服务及独立管理登录，隧道账号本身不拥有云电脑管理权限。

模型出站路径：OpenClaw/OpenViking → 模型服务。旧机当前使用本机出站代理；迁移时不能照搬 `127.0.0.1:7891` 后假定新机已有同样服务。上述反向隧道并不会自动解决模型出站访问。

## 3. 配置位置与版本台账

以下是既有实例路径，路径本身不包含凭据。迁移时保持或明确记录新旧映射，不能随意更名。

| 组件 | 配置/数据位置 | 注意事项 |
| --- | --- | --- |
| OpenClaw | `/var/lib/arbor/.openclaw/`；工作区 `/srv/openclaw/personal` | 渠道登录、插件、会话和 Skill 需一并盘点 |
| OpenClaw 服务 | `openclaw-personal.service`，以 `arbor` 运行 | 检查 systemd 环境与服务账号，不以 root 的登录代替 |
| 主助手 Codex | `/var/lib/arbor/.codex/`；入口 `/usr/local/bin/codex` | `auth.json` 私有；包装脚本保留既有代理逻辑 |
| OpenViking Compose | `/opt/openviking/compose.yaml` | 固定镜像版本、挂载和资源限制；内容可能含私密环境配置 |
| OpenViking 主机数据 | `/srv/openviking` → 容器 `/app/.openviking` | 整体盘点，不只复制单个配置文件 |
| OpenViking 配置 | `/srv/openviking/ov.conf` | 含密钥，不能全文输出或提交 |
| OpenViking OAuth | `/srv/openviking/codex_auth.json` | 与主助手独立维护，不能让新旧两台机同时刷新同一份凭据 |
| OpenClaw 记忆 key | `/var/lib/arbor/.openclaw/openviking-secrets/personal.key` | 私有文件，服务账号需能读取 |
| 本地 Codex 记忆连接 | 使用该客户端的 `~/.openviking/ovcli.conf` | 入口保持相同并不等于所有新客户端自动接入 |
| Intent | `/opt/intent/releases/`、`/var/lib/intent/`、`/etc/intent/` | 以服务配置核对实际数据库、环境文件与当前发布路径 |
| Intent 备份 | `/var/lib/intent/backups` | 个人数据；数据库采用项目提供的 SQLite 在线备份流程 |
| SSH 服务端 | `/etc/ssh/sshd_config` 的 `managed wuying reverse tunnel` 块 | 追加在文件末尾，不改变其他用户配置 |
| 隧道公钥 | `/etc/ssh/authorized_keys/wuying-tunnel` | `root:root 0644`，只读共享、仅 root 可写 |
| 无影隧道私钥 | `/home/admin/.ssh/wuying_tunnel` | `admin` 持有、`0600`；不外传 |
| 无影服务器公钥 | `/home/admin/.ssh/wuying_server_known_hosts` | 来自已核验管理连接，严格校验 |

本轮核对 OpenViking 0.4.23、服务器 Codex 0.160.1；既有 OpenClaw 部署记录为 2026.9.8，正式迁移前再核对实际版本。无影 OpenSSH 为 9.6p1 Ubuntu-3ubuntu13.15。向量模型为 `doubao-embedding-vision-251215`、1024 维、multimodal，未更换。模型可用性以账号实际目录和调用为准，不写成所有订阅固定支持。

## 4. 环境盘点（已执行基础检查）

无影普通用户终端：

```bash
cat /etc/os-release
uname -m
df -h /
ssh -V
```

迁移前还需检查内存、磁盘总用量、目标包可用性、服务账号和出站网络。关闭不适合常驻工作的断连关机、无操作休眠策略，核对套餐费用，断开客户端后实测后台服务仍响应。[无影策略说明](https://help.aliyun.com/zh/edsp/user-guide/set-scheduled-task-upon-disconnection)

## 5. 专用密钥（已执行）

在无影以 `admin` 运行，不覆盖已有同名私钥：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
if [ ! -f ~/.ssh/wuying_tunnel ]; then
  ssh-keygen -t ed25519 -f ~/.ssh/wuying_tunnel -N '' -C 'wuying-tunnel'
fi
chmod 600 ~/.ssh/wuying_tunnel
cat ~/.ssh/wuying_tunnel.pub
```

只把 `.pub` 公钥交给服务器维护者。此专用私钥无口令是为后续无人值守重连准备，其权限由服务端的账号和 key 限制约束；不复用到个人管理账号。

## 6. 公网服务器 SSH 配置（已执行）

实际使用账号 `wuying-tunnel`，系统用户、home `/var/lib/wuying-tunnel`、shell `/usr/sbin/nologin`。新装时可使用以下命令；当前账号已存在，不重复创建：

```bash
sudo useradd --system --create-home --home-dir /var/lib/wuying-tunnel \
  --shell /usr/sbin/nologin wuying-tunnel
sudo install -d -o root -g root -m 0755 /etc/ssh/authorized_keys
```

授权文件内容是一整行，替换 `WUYING_PUBLIC_KEY` 为完整 `ssh-ed25519 …` 公钥：

```text
restrict,port-forwarding,permitlisten="127.0.0.1:22222",permitlisten="127.0.0.1:21933",permitlisten="127.0.0.1:23180" WUYING_PUBLIC_KEY
```

公钥文件必须让认证用户可读，保持 root 独占写权限：

```bash
sudo chown root:root /etc/ssh/authorized_keys/wuying-tunnel
sudo chmod 644 /etc/ssh/authorized_keys/wuying-tunnel
sudo -u wuying-tunnel test -r /etc/ssh/authorized_keys/wuying-tunnel
```

备份原配置后，在 `/etc/ssh/sshd_config` **末尾**添加以下块；不把 Match 块插到后续还有全局专用指令的位置。当前实例已有此块，维护时原位检查，不能反复追加：

```text
# BEGIN managed wuying reverse tunnel
Match User wuying-tunnel
    AuthorizedKeysFile /etc/ssh/authorized_keys/%u
    AuthenticationMethods publickey
    PubkeyAuthentication yes
    PasswordAuthentication no
    KbdInteractiveAuthentication no
    AllowTcpForwarding remote
    AllowStreamLocalForwarding no
    GatewayPorts no
    PermitListen 127.0.0.1:22222 127.0.0.1:21933 127.0.0.1:23180
    PermitOpen none
    AllowAgentForwarding no
    X11Forwarding no
    PermitTTY no
    PermitTunnel no
    PermitUserRC no
    MaxSessions 0
    ClientAliveInterval 30
    ClientAliveCountMax 3
# END managed wuying reverse tunnel
```

`MaxSessions 0` 禁止 shell、命令和子系统会话，仍允许转发；`AllowTcpForwarding remote` 拒绝本地转发，`PermitListen` 限定服务端监听位置。它不能证明客户端把这些端口映射到哪个目标，所以仍需信任并保护无影上的隧道密钥。[sshd 配置说明](https://man.openbsd.org/sshd_config)

本次变更保存了 `/etc/ssh/sshd_config.before-wuying-<UTC时间>`，并在变更前后比较了 root 的有效配置，结果一致。常规操作是先保存备份与有效配置，再编辑，最后检查：

```bash
sudo sshd -t
sudo sshd -T -C user=wuying-tunnel,host=localhost,addr=127.0.0.1
sudo sshd -T -C user=root,host=localhost,addr=127.0.0.1
```

只有校验通过、其他用户配置未意外改变后，才运行 `sudo systemctl reload ssh`。保持原管理会话打开，再开一个独立会话验证登录。不要为了应用这一项设置重启整台机器。

## 7. 主机校验与首次隧道（已建立监听）

维护者通过已有可信连接，在公网服务器上读取：

```bash
sudo cat /etc/ssh/ssh_host_ed25519_key.pub
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

通过可信通道交给无影。不要把未经核对的 `ssh-keyscan` 输出当成身份依据，也不要设置 `StrictHostKeyChecking=no`。

无影 `~/.ssh/wuying_server_known_hosts` 内容为一整行：

```text
PUBLIC_SERVER_IP ssh-ed25519 VERIFIED_HOST_KEY
```

设权限 `0600`。将下方示例地址替换成自己的公网服务器地址，首次在前台运行：

```bash
ssh -F /dev/null -NT \
  -i ~/.ssh/wuying_tunnel \
  -o IdentitiesOnly=yes \
  -o BatchMode=yes \
  -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile="$HOME/.ssh/wuying_server_known_hosts" \
  -o ExitOnForwardFailure=yes \
  -o ConnectTimeout=15 \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -R 127.0.0.1:22222:127.0.0.1:22 \
  -R 127.0.0.1:21933:127.0.0.1:1933 \
  -R 127.0.0.1:23180:127.0.0.1:3180 \
  wuying-tunnel@PUBLIC_SERVER_IP
```

服务器侧检查：

```bash
sudo ss -lntp '( sport = :22222 or sport = :21933 or sport = :23180 )'
sudo journalctl -u ssh --since '10 minutes ago' --no-pager
```

预期三个端口均是 `127.0.0.1`。日志应出现该用户公钥认证成功；查看或转发日志前去掉无关登录信息。OpenViking 迁到无影后，才可用 `curl --fail --max-time 10 http://127.0.0.1:21933/health` 验证后端健康。管理通道还需无影 SSH 服务和管理公钥；此时不要尝试使用隧道账号登录无影。

## 8. 真实故障：Permission denied (publickey)

时间：2026-10-11。首次连接失败，服务器日志明确显示 `Could not open user ... authorized keys ... Permission denied`。

原因：公钥文件由 root 持有且为 `0600`，认证用户读不到；并非公钥内容错误。修复为 `root:root 0644`，以隧道用户执行 `test -r` 通过，`sshd -t` 通过。用户重试保持运行，服务器验证认证成功、三个回环监听均存在，并通过 `22222` 读取到无影的 `SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.15` 握手。尚未进行无影管理账号登录。

排查顺序：

```bash
sudo namei -l /etc/ssh/authorized_keys/wuying-tunnel
sudo -u wuying-tunnel test -r /etc/ssh/authorized_keys/wuying-tunnel
sudo ssh-keygen -lf /etc/ssh/authorized_keys/wuying-tunnel
```

对比无影的 `ssh-keygen -lf ~/.ssh/wuying_tunnel.pub`。若日志不同，按日志继续查账号、key 限制或文件属主，不要重复套用 chmod。尤其不要把私钥、OAuth 或 API key 文件改成 `0644`。

## 9. 后台运行与断线恢复（候选，尚未安装）

待前台链路和目标服务验证后，在无影创建 `/etc/systemd/system/wuying-tunnel.service`，替换地址：

```ini
[Unit]
Description=Private reverse SSH tunnel to public server
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=0

[Service]
User=admin
ExecStart=/usr/bin/ssh -F /dev/null -NT -i /home/admin/.ssh/wuying_tunnel -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/home/admin/.ssh/wuying_server_known_hosts -o ExitOnForwardFailure=yes -o ConnectTimeout=15 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 127.0.0.1:22222:127.0.0.1:22 -R 127.0.0.1:21933:127.0.0.1:1933 -R 127.0.0.1:23180:127.0.0.1:3180 wuying-tunnel@PUBLIC_SERVER_IP
Restart=always
RestartSec=10
TimeoutStopSec=15
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=read-only
UMask=0077

[Install]
WantedBy=multi-user.target
```

先 `sudo systemd-analyze verify /etc/systemd/system/wuying-tunnel.service`，再在前台 SSH 窗口按 Ctrl+C 结束本次隧道，防止两条连接争抢同一远端端口，然后：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wuying-tunnel.service
sudo systemctl status wuying-tunnel.service --no-pager
sudo journalctl -u wuying-tunnel.service -n 50 --no-pager
```

逐项验证：关闭终端仍连通；受控重启隧道服务后恢复；约定维护时间内重启无影后自动恢复；断开远程桌面后不休眠。正常连接一次不能代表这些项目通过。重复失败先检查端口争用、主机 key、出站网络和休眠策略，不提高重试频率。

## 10. 模型登录恢复（本轮已执行）

服务 active、health 200、CLI 显示已登录与模型调用成功是不同证据。订阅到期也不必然导致 systemd 或容器停止。本轮未确认此前失败的唯一根因。

OpenClaw 使用服务用户的原生 Codex home：

```bash
sudo -u arbor env HOME=/var/lib/arbor CODEX_HOME=/var/lib/arbor/.codex \
  /usr/local/bin/codex login status
```

确实需要换账号时，先私下备份该用户的 `auth.json`，再同环境运行 `codex login --device-auth`，由本人到官方页面登录新账号。不要先注销唯一可用登录，不索取账号密码，不记录验证码。

OpenViking 0.4.23 有独立 OAuth 存储。本轮在原容器内运行：

```bash
docker exec -i openviking python -u -c \
  'from openviking.models.vlm.backends.codex_auth import login_codex_with_device_code; login_codex_with_device_code()'
```

此为已安装版本的内部 Python 入口，升级后先核验接口，不当作跨版本稳定 CLI。备份 `/srv/openviking/codex_auth.json`，登录后只检查更新时间、来源和到期状态，不打印 token。两边分别登录，避免多进程竞争刷新同一份外部凭据。

这次在账号模型列表确认轻量模型后，用 OpenViking 自身适配器做了一次短虚构提取，限时、无工具、不写个人记忆、不发微信。通过后只改 `ov.conf` 的 `vlm.model` 与 `vlm.reasoning_effort`，保留向量设置及其他字段，先校验并备份，再重启 OpenViking。该次配置备份为同目录 `ov.conf.before-light-model-20261011`。本轮结果不代表新账号的微信回复链路和全量记忆处理都已验收。

不要根据旧目录或文章假定新账号支持某个模型；每次换账号先查实际可用模型。也不要因更换整理模型而改 embedding 模型或维度，否则已有向量索引可能需要重建。

## 11. 服务迁移方案（尚未执行）

1. 盘点体积、版本、镜像、账号 UID/GID、目录权限、挂载、定时任务、外部网络及凭据依赖。记录各个服务当前写入哪台机器。
2. 在无影安装相同已验证版本并准备私有目录；先验证远端模型可达，不自动升级依赖，不启用微信消费者或生产定时任务。
3. 迁 OpenViking：约定短暂停写窗口；暂停捕获/新提交，处理或记录在途任务，停止原容器后备份完整持久化目录。备份保存在受限目录，校验后通过加密通道恢复至无影。不对正在写入的索引目录直接打包后宣称一致。
4. 在新实例的隔离测试账号验证存储、向量、模型整理、会话提交与召回，检查队列恢复及日志，再切换原服务器代理和内部调用地址。旧 OpenClaw 若仍在原机，需要先指向本机隧道端口；不能遗漏这种过渡连接。
5. 迁 OpenClaw：确认工作区、Skill、插件、渠道登录和 Codex home 均已迁移。先停止旧消息消费者，再启动新实例，验证一次真实往返。不要同时启用两份微信轮询、提醒或执行报告任务。
6. 迁 Intent：使用项目已有 SQLite 在线备份/恢复流程，不能只复制活动 `.db` 而漏掉 WAL。保留原文、版本、请求去重、租约和通知状态；扫描、备份、判断、投递定时器逐项盘点，防止双实例写入或重复消息。
7. 切换 Nginx：备份当前片段，只改所需 upstream；OpenViking 由 `127.0.0.1:1933` 改为 `127.0.0.1:21933`，Intent 由 `127.0.0.1:3180` 改为 `127.0.0.1:23180`。保留 Host/Origin、API key、路径白名单、流式响应和禁止自动重放等现有规则；先 `nginx -t`，成功才 reload。
8. 公网验证：有效身份可用，未授权仍被拒绝，原 URL 可访问，长连接正常；核验凭据不会进 URL/日志。再记录本次备份及回退点。

OpenViking、OpenClaw、Intent 的顺序允许逐项切换，不能把任意服务的 health 成功当成整个迁移完成。磁盘快照、Git 和备份各有用途；Git 不包含私人数据库和凭据，不能单独恢复个人环境。

## 12. 常见故障分层检查

| 现象 | 先看什么 | 处理与限制 |
| --- | --- | --- |
| SSH 连接超时 | 无影出站连接、原服务器 SSH 和安全组 | 先区分 TCP 不通与认证失败，不新增不必要的公网端口 |
| `Permission denied (publickey)` | ssh 日志、授权文件可读性、公钥指纹 | 本次为 root 0600；不据相同客户端提示推断所有故障同因 |
| host key 不匹配 | 云端主机身份是否真实变化 | 通过可信管理通道重新核验，不能跳过校验 |
| `remote port forwarding failed` | 旧前台隧道或重复 systemd 实例占用端口、PermitListen | 只处理已确认属于本任务的连接，不批量杀 SSH |
| 有监听但 HTTP 不通 | 无影后端是否运行及绑定相应端口 | 隧道不会替你启动应用 |
| 网页 502/504 | Nginx upstream、回环转发、后端日志 | 按顺序查，不通过取消鉴权来试通 |
| 服务健康但 AI 不回复 | 实际模型请求、订阅/额度、OAuth、出站代理 | 登录和模型权限分开确认；不凭猜测重装服务 |
| 记忆能读、不能提取 | VLM 调用、异步队列、embedding 与日志 | health 不证明模型成功；用隔离样本而非污染真实记忆 |
| 关闭无影客户端后掉线 | 休眠策略、systemd、套餐状态 | 常驻可用需实际断连验证 |
| 重启后重复微信消息 | 新旧消费者、定时器、持久去重状态 | 先停止多余消费者，不盲目重发未知送达消息 |

OpenViking 本机检查可以使用 `curl --fail --max-time 10 http://127.0.0.1:1933/health`。`/ready` 可能包含外部依赖探测；当前公网代理不一定开放它，公网 404 不等同于服务损坏。鉴权和自动保存应使用对应客户端 doctor 及隔离端到端验证；不公开完整诊断报告里的身份和凭据。

## 13. 回退原则

隧道尚未承接业务时：无影前台 Ctrl+C，或停用 `wuying-tunnel.service`，不会改变旧后端。删除服务器配置前，先核对完整 Match 块边界及之后是否新增其他配置，校验后 reload；不要恢复过期的整份 sshd_config 覆盖别人后续修改。

切换后：先暂停新写入，确认哪份数据最新；核对代理备份，恢复对应 upstream 并校验。若新机已接受业务写入，必须先做一致性处理，不能直接启用旧库造成数据回退。OpenClaw 必须先停新消费者，再启旧消费者。

模型配置回退：按字段恢复先前 VLM 模型与推理强度并校验；保留最新 OAuth，不把旧登录备份盲目覆盖回来。原模型仍需当前账号有权限。

私有台账保留备份完整路径、时间、校验值、权限、对应版本和恢复结果；本仓库只记录脱敏步骤。备份保留与异地副本需要另行落实，不能用同一台机器上的备份冒充灾难恢复。

## 14. ChatGPT 桌面与手机验证（待做）

先从 [OpenAI Linux 官方文档](https://learn.chatgpt.com/docs/linux/linux-app) 下载 Ubuntu x64 对应包，再安装。该文档确认 Linux 预览版支持 Ubuntu 24.04，但 Computer Use 桌面控制尚不可用。不要凭历史记忆写成“Linux 没有客户端”，也不要把支持客户端推导成支持所有功能。

[Remote 文档](https://learn.chatgpt.com/docs/remote-connections)目前列出的远程桌面主机是 Mac/Windows；[手机文档](https://learn.chatgpt.com/docs/mobile)区分 Cloud 和已连接电脑。Linux 直连手机应继续标注未支持/未验证，不能用 SSH 隧道冒充官方 Remote 配对。

分别验收：安装登录、项目文件权限、一次本机 Codex 工作；手机可用的 Cloud/受支持连接；手机通过无影客户端进入桌面；退出桌面连接后后台持续运行；同一项实际工作从发起到查看结果。记录每条路径真正执行在哪台机器、文件如何同步、需要本人介入的环节。

## 15. 变更记录

| 日期 | 实际改动 | 验证 | 下一步 |
| --- | --- | --- | --- |
| 2026-10-11 | 两套 Codex 登录分别更换；OV 使用轻量模型 | 独立 OAuth、单次虚构提取、容器健康 | 完整业务往返和长期质量 |
| 2026-10-11 | 无影系统与 SSH 客户端盘点、生成专用 key | 用户终端输出 | 后端安装与在线策略 |
| 2026-10-11 | 原服务器增加受限隧道账号及三个回环转发许可 | sshd 校验、root 有效配置未变、原服务健康 | 无影连接 |
| 2026-10-11 | 公钥文件从 root 0600 修复为 root 0644 | 可读性通过；用户重试；三个回环监听存在 | 后端验证、自启与恢复 |

后续每次更新记录操作位置、变更原因、配置路径、实际验证和回退点。没有执行或验证的部分保留待办，不把候选配置变成完成记录。

## 16. 本次文档验证

在 personal-site 的 `c2a6a6c` 基础上使用独立工作副本，未修改生产部署配置。`SITE_URL=https://www.xiamu.cc npm run check` 通过：既有测试、完整构建和 34 个 HTML 页面的 623 个站内链接/资源检查均通过，草稿不进入输出。

另在独立临时文章目录为本稿设置仅用于预览的日期与发布标记，构建得到 18 篇文章、9 个案例；检查 35 个 HTML 页面、642 个站内链接/资源，以及新文章正文、canonical、搜索索引、RSS 和 sitemap。仓库源稿始终保持 `publish: false`，未推送临时发布标记或构建产物。Shell 示例通过语法检查，不等于候选迁移或 systemd 服务已实际执行。
