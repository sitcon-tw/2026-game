# 如何啟動

## 先啟動 database:

```bash
docker compose -f compose.dev.yml up -d
```

## 再啟動 backend:

```bash
make run
```

如果你看到類似：
```
2026-02-04T12:25:27.940+0800    INFO    cmd/main.go:48  Starting server {"port": "8000", "env": "dev"}
```
那就代表你成功啟動這個 backend server 了