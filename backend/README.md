# 如何啟動

## 如果你是寫前端的

你要看 OpenAPI docs 請打：

```bash
make run-docs
```

注意一下這邊什麼都沒有喔，他就只是個 html 你並沒有真的把後端跑起來 :D

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

# 整體架構介紹

原則上這個後端目前分為 user 跟 booth

user 要登錄的話必須要拿 OPass 的 token 來進行 login (/users/login) 來做到身份驗證，他會把你的 token 寫到 cookie 裡面，之後每次你要呼叫需要身份驗證的 API 的時候都會帶上這個 cookie，後端會去驗證這個 token 的有效性。

booth 的部分則是一樣傳送 token 給 /activities/booth/login 來進行身份驗證，一樣會把 token 寫到 cookie 裡面。但這兩個 cookie 是不衝突的，所以你可以同時是一般 user 又是 booth。