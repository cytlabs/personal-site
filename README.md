# Personal Site

这是第一版个人网站，目标是承接个人定位、简历、案例和内容，不做登录、不做数据库、不引入构建工具。

## 文件结构

```text
personal-site/
  index.html
  styles.css
  script.js
  assets/
    workflow-map.svg
  content/
    profile.md
    resume.md
    cases.md
    posts.md
```

## 使用方式

直接打开 `index.html` 可以查看。

如果希望从 `content/*.md` 动态读取内容，可以在当前目录启动静态服务：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://localhost:4173
```
