# 출하 일정관리 - 서버 설치 및 실행 가이드

## 📁 최종 파일 구조
```
프로젝트/
├── src/
│   ├── App.jsx          ← 교체
│   ├── api.js           ← 신규 추가
│   ├── components.jsx   ← 교체
│   ├── excelParser.js   (기존 유지)
│   └── utils.js         (기존 유지)
├── server/
│   ├── server.js        ← 신규 추가
│   ├── package.json     ← 신규 추가
│   └── data/            ← 자동 생성 (db.json 저장됨)
└── package.json         (기존 React 프로젝트)
```

---

## 🚀 1단계: 서버 설치 & 실행

```bash
# server 폴더에서
cd server
npm install
node server.js
# → "✅ 서버 실행 중: http://localhost:3001" 출력되면 OK
```

---

## 🖥️ 2단계: React 개발 서버 실행 (PC에서 개발/테스트 시)

```bash
# 프로젝트 루트에서
npm run dev
# → http://localhost:5173 으로 접속
```

> React(5173)와 서버(3001)가 동시에 떠있어야 합니다.

---

## 📦 3단계: 빌드 후 서버 단독 실행 (배포 시)

```bash
# 프로젝트 루트에서 빌드
npm run build
# → dist/ 폴더 생성

# 이후 server만 실행하면 React+API 모두 3001에서 서빙
cd server
node server.js
# → http://[PC의 IP]:3001 으로 모바일 접속 가능
```

---

## 🌐 4단계: 외부(모바일)에서 접속하기

### 방법 A: 같은 와이파이 (간단)
1. PC의 내부 IP 확인: `ipconfig` (Windows) → IPv4 주소 (예: 192.168.0.10)
2. 모바일에서 `http://192.168.0.10:3001` 접속

### 방법 B: 외부 인터넷에서도 접속 (ngrok 사용)
```bash
# ngrok 설치: https://ngrok.com/download
ngrok http 3001
# → https://xxxx.ngrok.io 주소 생성 → 어디서든 접속 가능
```

### 방법 C: 공유기 포트포워딩 (고정 사용 시)
1. 공유기 관리자 페이지 → 포트포워딩
2. 외부포트 3001 → 내부 PC IP:3001 설정
3. 공인 IP로 접속: `http://[공인IP]:3001`

---

## 💾 데이터 저장 위치
- `server/data/db.json` 하나의 파일에 모든 데이터 저장
- 정기 백업: `db.json` 파일을 복사해두면 됩니다

---

## ⚙️ vite.config.js 수정 (개발 시 CORS 우회)
```js
// vite.config.js에 proxy 추가
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```
이렇게 하면 `api.js`의 BASE URL을 빈 문자열로 통일 가능합니다.
