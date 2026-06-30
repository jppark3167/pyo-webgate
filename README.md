# pyo-webgate · 출하 일정관리

출하의뢰 / 재고 / 생산계획 / KCE 입고일정을 합쳐 **품목별 예상재고와 재고부족 여부**를 보여주는 사내 대시보드입니다.

## 기술 스택

- 프론트: React 19 + Vite
- 백엔드: Express + MongoDB
- 엑셀 파싱: xlsx (SheetJS)
- 배포: Render

## 구조

```
src/        프론트엔드 (React)
  App.jsx     메인 · 예상재고/상태 계산 로직
  components/ 화면 컴포넌트
server/
  server.js   Express + MongoDB API
```

## 핵심 로직

품목별로 `예상재고 = 현재고 + 생산입고 + KCE입고 − 누적수요` 를 계산해
재고부족 / 중복출하 확인 / KCE 입고예정 등을 자동 표시합니다.

## 실행

```bash
# 설치
npm install
cd server && npm install && cd ..

# 백엔드 (포트 3001) — MONGODB_URI, APP_PASSWORD 환경변수 필요
npm run start

# 프론트 개발 서버 (포트 5173)
npm run dev
```

## 빌드

```bash
npm run build   # dist/ 정적 빌드 (운영에선 Express가 서빙)
```
