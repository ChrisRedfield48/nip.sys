<div align="center">

<h1>NIP&nbsp;//&nbsp;latent</h1>

<p><i>training run — из веба в Python и нейросети</i></p>

<p>
<img src="https://img.shields.io/badge/build-none-2f9e8d?style=flat-square&labelColor=0c0f15" alt="no build">
<img src="https://img.shields.io/badge/dependencies-0-2f9e8d?style=flat-square&labelColor=0c0f15" alt="zero deps">
<img src="https://img.shields.io/badge/status-training-2f9e8d?style=flat-square&labelColor=0c0f15" alt="training">
<img src="https://img.shields.io/badge/lang-ru-2f9e8d?style=flat-square&labelColor=0c0f15" alt="russian">
</p>

<p><b>Живой сайт →</b> <code>https://chrisredfield48.github.io/&lt;repo&gt;/</code></p>

</div>

---

Личный сайт. Карта того, где я сейчас и куда иду. Вместо витрины достижений — **кривая обучения**: `loss` здесь это расстояние до цели, и чем дальше я иду, тем ниже он падает. Статусы навыков (`учу` · `в очереди` · `позже`) — честные, а не парадные. Сайт обновляется вместе со мной.

```text
  loss
    ▲
    │ ●
    │  ╲___
    │      ╲___
    │          ╲____
    │               ╲_____
    │                     ╲______
    │                            ╲________●
    └────┬────┬────┬────┬────┬────┬─────────▶  time
        e0   e1   e2   e3   e4   e5

   ● старт  ·  кривая — план спуска  ·  сейчас я на e1
```

| epoch | этап | статус |
|:-----:|------|--------|
| `e0` | html · css | готово |
| `e1` | javascript | **← сейчас** |
| `e2` | python | дальше |
| `e3` | математика · линал, матан, вероятность | параллельно |
| `e4` | ml / нейросети — от регрессии до трансформеров | цель |
| `e5` | relocate → europe | цель |

---

## Стек

Чистый ванильный фронтенд. Без зависимостей, без сборки, без фреймворков.

```text
html · css · javascript (es6)
шрифты — sora + ibm plex mono (google fonts)
интерфейс на русском
адаптив · доступность с клавиатуры · prefers-reduced-motion
```

## Структура

Три файла, ничего лишнего.

```text
.
├── index.html    разметка и весь контент — стек, вехи, кривая
├── style.css     палитра, типографика, сетки
└── script.js     рендер проектов и моделей, точки на кривой, навигация, меню
```

## Запуск

Открыть `index.html` двойным кликом достаточно. Чище — через локальный сервер:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Как обновлять

Контент живёт в двух местах: **данные** (проекты, модели) — в `script.js`, **структура** (стек, вехи, кривая) — в `index.html`.

#### Проекты — массив `projects` в `script.js`

```js
{ cat:'js', status:'shipped', title:'Название', icon:'[ ui ]',
  desc:'Короткое описание.',
  tags:['HTML','CSS','JS'], link:'https://...' }
```

`cat` раскидывает по вкладкам (`js` / `py`). Без `link` карточка покажет «скоро». Счётчики во вкладках считаются сами.

| `status` | на карточке |
|----------|-------------|
| `shipped` | задеплоено |
| `dev` | в разработке |
| `plan` | в планах |

#### Модели — массив `models` в `script.js`

```js
{ schem:'cnn', level:3, status:'plan', name:'CNN',
  desc:'Свёртки и пулинг.' }
```

`schem` — схема архитектуры: `reg` · `mlp` · `cnn` · `rnn` · `tr`. `level` — сложность `0–5`, рисует точки.

| `status` | подпись |
|----------|---------|
| `next` | следующий |
| `plan` | в планах |
| `lock` | заблокирован |

#### Стек — секция `#stack` в `index.html`

У каждого навыка `data-level="0–5"` на `<span class="lvl">` и статус-текст в `<span class="st ...">`: класс `accent` для активного, `muted` / `faint` для остального.

#### Вехи — блоки `.ms` (`e0`–`e5`) в `index.html`

Этап пройден — меняешь бейдж, например `now` → `done`:

```html
<span class="ms-badge done">готово</span>
```

Варианты: `done` · `now` · `next` · `goal`.

#### Кривая

Линия — это SVG-`path` в `index.html` (`id="curveLine"`, атрибут `d`). Точки-вехи `script.js` расставляет по линии сам — подстроятся под любую форму.

#### Цвет акцента

Основной — переменная `--accent` в `style.css`. Цвет кривой продублирован напрямую в SVG (`index.html`) и в отрисовке точек (`script.js`) — при смене акцента поправь и там.

## Деплой

GitHub Pages: **Settings → Pages**, ветка `main`, папка `/root`. Сайт статический — пушнул и готово.

---

<div align="center">
<sub>личный проект, для себя · код открыт — смотри и разбирай · дизайн и контент мои</sub>
</div>