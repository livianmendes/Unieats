# UniEats - como rodar e apresentar

## Pasta deste computador

Abra no VS Code:

```txt
C:\Users\livian.mendes\Documents\Codex\2026-05-29\files-mentioned-by-the-user-unieats\Unieats-main
```

## Rodar no dia da apresentacao

Use dois terminais no VS Code.

Terminal 1 - backend e banco:

```bash
npm run backend
```

Terminal 2 - aplicativo web:

```bash
npm run web
```

Depois abra:

```txt
http://localhost:8081
```

Para apresentar comprador e vendedor como dois celulares, abra:

```txt
http://localhost:8081/demo-celulares
```

Na tela do comprador, clique em `Preencher com conta demo` > `comprador` e depois em `Entrar como comprador`.

Na tela do vendedor, clique em `Preencher com conta demo` > `vendedor` e depois em `Entrar como vendedor`.

## Levar para outro computador

No notebook, instale Node.js e Git. Depois rode:

```bash
git clone https://github.com/livianmendes/Unieats.git
cd Unieats
npm install
cd backend
npm install
cd ..
npm run backend
```

Abra outro terminal na mesma pasta e rode:

```bash
npm run web
```

Se der erro de porta ocupada, feche os terminais antigos e rode de novo.
