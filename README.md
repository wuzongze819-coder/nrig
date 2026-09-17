# NRIG 数字表示直觉 · 进制大冒险

5 世界 × 45 关体素风进制学习游戏（React + TypeScript + Vite + Three.js）

- 程序化生成原创体素素材（纹理/音效），无第三方版权资源
- 确定性种子出题（mulberry32 + FNV-1a）
- 简化掌握系统 M0-M4，localStorage 本地存档

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署到子路径

```bash
npx vite build --base=/nrig/ --outDir dist-nrig
```
