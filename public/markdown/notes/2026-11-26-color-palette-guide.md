# [设计] 实用配色指南（开箱即用）

做幻灯片、海报或网页时，直接套用网上的色卡常常达不到预期。单个颜色本身没有问题，放到同一个界面里却容易出现文字难以辨认、区块边界模糊的情况。

本文整理了几个选色和排版的实用原则，后面附十套可直接取用的配色方案。

## 配色要分主次

页面显得杂乱，通常出于两个原因：大面积背景使用了高饱和度的亮色，容易引起视觉疲劳；或者相邻元素的明暗程度过于接近，标题、正文和底色之间缺乏区分。

大面积底色应当保持低调以衬托文字，高饱和度的强调色只留给少数重点位置。下面两组卡片采用同一色系的蓝绿色，区别在于背景明暗与饱和度的控制：

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:20px 0;">
  <div style="background:#1c8a82;border:1px solid #35b5ab;border-radius:10px;padding:18px;color:#e6fffd;">
    <div style="font-size:12px;color:#c2f5ef;margin-bottom:6px;">反例</div>
    <div style="font-size:16px;font-weight:600;color:#ffffff;margin-bottom:8px;">亮色铺满背景</div>
    <div style="font-size:13px;line-height:1.65;color:#d6faf6;margin-bottom:14px;">底色过于鲜艳，文字和边框与背景明暗接近，重点按钮难以突出。</div>
    <div style="display:inline-block;padding:5px 12px;border-radius:6px;background:#4fd1c5;color:#ffffff;font-size:12px;font-weight:600;">重点标记</div>
  </div>
  <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.18);border-radius:10px;padding:18px;color:#e3eeec;">
    <div style="font-size:12px;color:#9fb6b8;margin-bottom:6px;">正例</div>
    <div style="font-size:16px;font-weight:600;color:#e3eeec;margin-bottom:8px;">暗底配合少量亮色</div>
    <div style="font-size:13px;line-height:1.65;color:#c5d5d4;margin-bottom:14px;">背景压暗后，正文自然清晰，仅用一小块浅色即可形成焦点。</div>
    <div style="display:inline-block;padding:5px 12px;border-radius:6px;background:#b9e8de;color:#0b242d;font-size:12px;font-weight:600;">重点标记</div>
  </div>
</div>

## 选色的三个原则

### 1. 压低背景饱和度

高饱和度的颜色视觉冲击力强，适合用作小面积点缀。大面积的背景和卡片底色混入一定比例的灰色后，整体会更耐看，也更适合长时间阅读。

### 2. 用黑白视图检查明暗

页面层次清晰与否，主要取决于明度对比。一个直接的检验方法是将页面转为灰度观察：抽离色彩后，如果标题、正文和卡片边界依然分明，说明明暗结构成立；如果糊成一片，仅靠更换色相无法解决。

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:18px 0;">
  <div style="background:#f7f4ed;border:1px solid rgba(38,36,32,0.12);border-radius:10px;padding:16px;">
    <div style="font-size:12px;color:#6e6a61;margin-bottom:10px;">原色</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#f7f4ed;border:1px solid rgba(38,36,32,0.16);"></span>
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#d6cfc2;"></span>
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#2b5b6c;"></span>
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#262420;"></span>
    </div>
  </div>
  <div style="background:#f3f3f3;border:1px solid rgba(0,0,0,0.10);border-radius:10px;padding:16px;">
    <div style="font-size:12px;color:#686868;margin-bottom:10px;">转为黑白后，深浅层次依然清晰</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#f3f3f3;border:1px solid rgba(0,0,0,0.16);"></span>
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#cecece;"></span>
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#4f4f4f;"></span>
      <span style="display:inline-block;width:36px;height:36px;border-radius:6px;background:#252525;"></span>
    </div>
  </div>
</div>

### 3. 避免纯黑和纯白

纯粹的 `#000000` 和 `#ffffff` 反差过强，长时间阅读容易刺眼。如在白色底中加入少量暖黄或冷灰，在黑色底中加入深青或深棕，画面会柔和不少。本站当前的暗色主题即采用偏青的深色底，夜间阅读时不会显得沉闷。

## 画面面积比例

排布页面或幻灯片时，颜色面积可以大致按 **60 / 30 / 10** 分配：

<div style="margin:18px 0 12px;border:1px solid rgba(174,215,211,0.18);border-radius:10px;padding:16px;background:#081c23;">
  <div style="display:flex;height:28px;border-radius:6px;overflow:hidden;border:1px solid rgba(174,215,211,0.16);font-size:12px;font-weight:600;">
    <div style="width:60%;background:#0b242d;color:#e3eeec;display:flex;align-items:center;justify-content:center;">60% 底色</div>
    <div style="width:30%;background:#153844;color:#e3eeec;display:flex;align-items:center;justify-content:center;">30% 衬底和文字</div>
    <div style="width:10%;background:#b9e8de;color:#0b242d;display:flex;align-items:center;justify-content:center;">10%</div>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:12px;color:#9fb6b8;">
    <span>底色：背景和留白</span>
    <span>衬底和文字：卡片和正文</span>
    <span>点睛：每页仅保留一两处</span>
  </div>
</div>

最后 10% 的点睛色最容易使用过量。同一页面中仅出现一两处时效果最好；如果标题、按钮和标签全部使用同一亮色，重点反而会被稀释。

## 十套开箱即用的配色方案

以下十套方案涵盖不同的明暗和冷暖倾向，色号标在预览卡片下方，可直接用于幻灯片、文档或网页样式。

### 1. 夏夜海玻璃

本站当前使用的配色。深青色底面比纯黑柔和，适合个人主页、博客或夜间使用的工具界面。

<div style="background:#0b242d;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#102b34;border:1px solid rgba(174,215,211,0.16);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#9fb6b8;">深色主题 · 冷调</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(185,232,222,0.12);color:#b9e8de;">本站同款</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#e3eeec;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#c5d5d4;margin-bottom:16px;">正文示例：深青底色搭配柔白文字，夜间长段阅读时视觉压力较低。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#b9e8de;color:#0b242d;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#9fb6b8;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#102b34;border:1px solid rgba(174,215,211,0.14);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#0b242d;border:1px solid rgba(174,215,211,0.2);margin-bottom:6px;"></div><div style="font-size:11px;color:#e3eeec;font-weight:600;">底色</div><div style="font-size:11px;color:#9fb6b8;font-family:monospace;">#0b242d</div></div>
    <div style="background:#102b34;border:1px solid rgba(174,215,211,0.14);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#102b34;border:1px solid rgba(174,215,211,0.2);margin-bottom:6px;"></div><div style="font-size:11px;color:#e3eeec;font-weight:600;">衬底</div><div style="font-size:11px;color:#9fb6b8;font-family:monospace;">#102b34</div></div>
    <div style="background:#102b34;border:1px solid rgba(174,215,211,0.14);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#e3eeec;margin-bottom:6px;"></div><div style="font-size:11px;color:#e3eeec;font-weight:600;">主字</div><div style="font-size:11px;color:#9fb6b8;font-family:monospace;">#e3eeec</div></div>
    <div style="background:#102b34;border:1px solid rgba(174,215,211,0.14);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#9fb6b8;margin-bottom:6px;"></div><div style="font-size:11px;color:#e3eeec;font-weight:600;">辅字</div><div style="font-size:11px;color:#9fb6b8;font-family:monospace;">#9fb6b8</div></div>
    <div style="background:#102b34;border:1px solid rgba(174,215,211,0.14);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#b9e8de;margin-bottom:6px;"></div><div style="font-size:11px;color:#e3eeec;font-weight:600;">点睛</div><div style="font-size:11px;color:#9fb6b8;font-family:monospace;">#b9e8de</div></div>
  </div>
</div>

### 2. 旧书纸与松烟

暖米白底面配合深灰墨字，降低了日间屏幕的刺眼感，适合长文阅读、读书笔记及偏人文方向的演示稿。

<div style="background:#f7f4ed;border:1px solid rgba(38,36,32,0.12);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#fffdf9;border:1px solid rgba(38,36,32,0.11);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#6e6a61;">浅色主题 · 暖白</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(43,91,108,0.10);color:#2b5b6c;">阅读向</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#262420;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#45413b;margin-bottom:16px;">正文示例：米白底色和浅纸白卡片之间拉开轻微明暗差，无需重阴影即可分清区块边界。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#2b5b6c;color:#fffdf9;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#6e6a61;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#fffdf9;border:1px solid rgba(38,36,32,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#f7f4ed;border:1px solid rgba(38,36,32,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#262420;font-weight:600;">底色</div><div style="font-size:11px;color:#6e6a61;font-family:monospace;">#f7f4ed</div></div>
    <div style="background:#fffdf9;border:1px solid rgba(38,36,32,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#fffdf9;border:1px solid rgba(38,36,32,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#262420;font-weight:600;">衬底</div><div style="font-size:11px;color:#6e6a61;font-family:monospace;">#fffdf9</div></div>
    <div style="background:#fffdf9;border:1px solid rgba(38,36,32,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#262420;margin-bottom:6px;"></div><div style="font-size:11px;color:#262420;font-weight:600;">主字</div><div style="font-size:11px;color:#6e6a61;font-family:monospace;">#262420</div></div>
    <div style="background:#fffdf9;border:1px solid rgba(38,36,32,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#6e6a61;margin-bottom:6px;"></div><div style="font-size:11px;color:#262420;font-weight:600;">辅字</div><div style="font-size:11px;color:#6e6a61;font-family:monospace;">#6e6a61</div></div>
    <div style="background:#fffdf9;border:1px solid rgba(38,36,32,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#2b5b6c;margin-bottom:6px;"></div><div style="font-size:11px;color:#262420;font-weight:600;">点睛</div><div style="font-size:11px;color:#6e6a61;font-family:monospace;">#2b5b6c</div></div>
  </div>
</div>

### 3. 晨露苔藓

绿色系饱和度偏高时，在浅底上容易刺眼。这套方案刻意降低了绿色的饱和度，适合待办清单和信息密度较高的资料页。

<div style="background:#f2f4ef;border:1px solid rgba(37,45,38,0.12);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#fbfcf9;border:1px solid rgba(37,45,38,0.11);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#647065;">浅色主题 · 灰绿</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(74,107,83,0.12);color:#4a6b53;">低饱和</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#252d26;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#414d42;margin-bottom:16px;">正文示例：整套色调保持低饱和度，列表条目密集时依然保持平稳的阅读秩序。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#4a6b53;color:#fbfcf9;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#647065;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#fbfcf9;border:1px solid rgba(37,45,38,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#f2f4ef;border:1px solid rgba(37,45,38,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#252d26;font-weight:600;">底色</div><div style="font-size:11px;color:#647065;font-family:monospace;">#f2f4ef</div></div>
    <div style="background:#fbfcf9;border:1px solid rgba(37,45,38,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#fbfcf9;border:1px solid rgba(37,45,38,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#252d26;font-weight:600;">衬底</div><div style="font-size:11px;color:#647065;font-family:monospace;">#fbfcf9</div></div>
    <div style="background:#fbfcf9;border:1px solid rgba(37,45,38,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#252d26;margin-bottom:6px;"></div><div style="font-size:11px;color:#252d26;font-weight:600;">主字</div><div style="font-size:11px;color:#647065;font-family:monospace;">#252d26</div></div>
    <div style="background:#fbfcf9;border:1px solid rgba(37,45,38,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#647065;margin-bottom:6px;"></div><div style="font-size:11px;color:#252d26;font-weight:600;">辅字</div><div style="font-size:11px;color:#647065;font-family:monospace;">#647065</div></div>
    <div style="background:#fbfcf9;border:1px solid rgba(37,45,38,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#4a6b53;margin-bottom:6px;"></div><div style="font-size:11px;color:#252d26;font-weight:600;">点睛</div><div style="font-size:11px;color:#647065;font-family:monospace;">#4a6b53</div></div>
  </div>
</div>

### 4. 炭灰陶土

页面包含大量摄影作品或插图时，带明显冷暖倾向的底色会干扰图片原色。中性炭灰可以避免色偏，少量陶土色用于区分交互重点。

<div style="background:#161618;border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#202024;border:1px solid rgba(255,255,255,0.10);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#9898a0;">深色主题 · 中性灰</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(217,119,87,0.15);color:#d97757;">相册/作品集</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#ededef;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#c8c8cf;margin-bottom:16px;">正文示例：中性炭灰不带冷暖倾向，能够完整保留图片原有的色彩关系。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#d97757;color:#161618;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#9898a0;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#202024;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#161618;border:1px solid rgba(255,255,255,0.16);margin-bottom:6px;"></div><div style="font-size:11px;color:#ededef;font-weight:600;">底色</div><div style="font-size:11px;color:#9898a0;font-family:monospace;">#161618</div></div>
    <div style="background:#202024;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#202024;border:1px solid rgba(255,255,255,0.16);margin-bottom:6px;"></div><div style="font-size:11px;color:#ededef;font-weight:600;">衬底</div><div style="font-size:11px;color:#9898a0;font-family:monospace;">#202024</div></div>
    <div style="background:#202024;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#ededef;margin-bottom:6px;"></div><div style="font-size:11px;color:#ededef;font-weight:600;">主字</div><div style="font-size:11px;color:#9898a0;font-family:monospace;">#ededef</div></div>
    <div style="background:#202024;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#9898a0;margin-bottom:6px;"></div><div style="font-size:11px;color:#ededef;font-weight:600;">辅字</div><div style="font-size:11px;color:#9898a0;font-family:monospace;">#9898a0</div></div>
    <div style="background:#202024;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#d97757;margin-bottom:6px;"></div><div style="font-size:11px;color:#ededef;font-weight:600;">点睛</div><div style="font-size:11px;color:#9898a0;font-family:monospace;">#d97757</div></div>
  </div>
</div>

### 5. 海盐晴空

投影仪容易丢失浅色细节，导致灰字不够清晰。冷白底配合深藏青文字在幕布上辨识度高，适合正式汇报、技术答辩和图表较多的页面。

<div style="background:#f4f7fb;border:1px solid rgba(19,35,56,0.10);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#ffffff;border:1px solid rgba(19,35,56,0.10);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#5b6d82;">浅色主题 · 冷白</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(36,81,166,0.10);color:#2451a6;">正式汇报</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#132338;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#33465e;margin-bottom:16px;">正文示例：冷白背景与深藏青文字的对比度充足，投影到幕布上时笔画依然清晰。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#2451a6;color:#ffffff;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#5b6d82;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#ffffff;border:1px solid rgba(19,35,56,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#f4f7fb;border:1px solid rgba(19,35,56,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#132338;font-weight:600;">底色</div><div style="font-size:11px;color:#5b6d82;font-family:monospace;">#f4f7fb</div></div>
    <div style="background:#ffffff;border:1px solid rgba(19,35,56,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#ffffff;border:1px solid rgba(19,35,56,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#132338;font-weight:600;">衬底</div><div style="font-size:11px;color:#5b6d82;font-family:monospace;">#ffffff</div></div>
    <div style="background:#ffffff;border:1px solid rgba(19,35,56,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#132338;margin-bottom:6px;"></div><div style="font-size:11px;color:#132338;font-weight:600;">主字</div><div style="font-size:11px;color:#5b6d82;font-family:monospace;">#132338</div></div>
    <div style="background:#ffffff;border:1px solid rgba(19,35,56,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#5b6d82;margin-bottom:6px;"></div><div style="font-size:11px;color:#132338;font-weight:600;">辅字</div><div style="font-size:11px;color:#5b6d82;font-family:monospace;">#5b6d82</div></div>
    <div style="background:#ffffff;border:1px solid rgba(19,35,56,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#2451a6;margin-bottom:6px;"></div><div style="font-size:11px;color:#132338;font-weight:600;">点睛</div><div style="font-size:11px;color:#5b6d82;font-family:monospace;">#2451a6</div></div>
  </div>
</div>

### 6. 燕麦焦糖

整体偏暖的日间配色，用深棕色替代常规黑色正文，适合游记、日常记录或暖色调摄影专题。若页面内以冷色调界面截图为主，则不太适配。

<div style="background:#f5efe6;border:1px solid rgba(45,36,30,0.12);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#fcf9f4;border:1px solid rgba(45,36,30,0.10);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#78695e;">浅色主题 · 暖棕</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(156,86,51,0.12);color:#9c5633;">生活/游记</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#2d241e;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#4d3f35;margin-bottom:16px;">正文示例：深棕色文字配合奶白卡面，整体色调偏暖，视觉反差比黑字白底柔和。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#9c5633;color:#fcf9f4;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#78695e;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#fcf9f4;border:1px solid rgba(45,36,30,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#f5efe6;border:1px solid rgba(45,36,30,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#2d241e;font-weight:600;">底色</div><div style="font-size:11px;color:#78695e;font-family:monospace;">#f5efe6</div></div>
    <div style="background:#fcf9f4;border:1px solid rgba(45,36,30,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#fcf9f4;border:1px solid rgba(45,36,30,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#2d241e;font-weight:600;">衬底</div><div style="font-size:11px;color:#78695e;font-family:monospace;">#fcf9f4</div></div>
    <div style="background:#fcf9f4;border:1px solid rgba(45,36,30,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#2d241e;margin-bottom:6px;"></div><div style="font-size:11px;color:#2d241e;font-weight:600;">主字</div><div style="font-size:11px;color:#78695e;font-family:monospace;">#2d241e</div></div>
    <div style="background:#fcf9f4;border:1px solid rgba(45,36,30,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#78695e;margin-bottom:6px;"></div><div style="font-size:11px;color:#2d241e;font-weight:600;">辅字</div><div style="font-size:11px;color:#78695e;font-family:monospace;">#78695e</div></div>
    <div style="background:#fcf9f4;border:1px solid rgba(45,36,30,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#9c5633;margin-bottom:6px;"></div><div style="font-size:11px;color:#2d241e;font-weight:600;">点睛</div><div style="font-size:11px;color:#78695e;font-family:monospace;">#9c5633</div></div>
  </div>
</div>

### 7. 梅雨烟紫

紫色调低饱和度后显得克制安静，不会流于艳俗，适合歌单索引、随笔专栏或个人资料整理。

<div style="background:#f4f2f7;border:1px solid rgba(37,33,44,0.12);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#fcfbfe;border:1px solid rgba(37,33,44,0.10);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#6b6478;">浅色主题 · 烟紫</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(98,79,130,0.12);color:#624f82;">低饱和紫</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#25212c;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#433c4f;margin-bottom:16px;">正文示例：淡紫灰背景退居底层，烟紫色按钮比亮紫更加沉稳。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#624f82;color:#fcfbfe;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#6b6478;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#fcfbfe;border:1px solid rgba(37,33,44,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#f4f2f7;border:1px solid rgba(37,33,44,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#25212c;font-weight:600;">底色</div><div style="font-size:11px;color:#6b6478;font-family:monospace;">#f4f2f7</div></div>
    <div style="background:#fcfbfe;border:1px solid rgba(37,33,44,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#fcfbfe;border:1px solid rgba(37,33,44,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#25212c;font-weight:600;">衬底</div><div style="font-size:11px;color:#6b6478;font-family:monospace;">#fcfbfe</div></div>
    <div style="background:#fcfbfe;border:1px solid rgba(37,33,44,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#25212c;margin-bottom:6px;"></div><div style="font-size:11px;color:#25212c;font-weight:600;">主字</div><div style="font-size:11px;color:#6b6478;font-family:monospace;">#25212c</div></div>
    <div style="background:#fcfbfe;border:1px solid rgba(37,33,44,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#6b6478;margin-bottom:6px;"></div><div style="font-size:11px;color:#25212c;font-weight:600;">辅字</div><div style="font-size:11px;color:#6b6478;font-family:monospace;">#6b6478</div></div>
    <div style="background:#fcfbfe;border:1px solid rgba(37,33,44,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#624f82;margin-bottom:6px;"></div><div style="font-size:11px;color:#25212c;font-weight:600;">点睛</div><div style="font-size:11px;color:#6b6478;font-family:monospace;">#624f82</div></div>
  </div>
</div>

### 8. 黑胶

偏暖的暗色方案，底色带有微弱棕调，适合不习惯冷蓝暗黑模式的夜间阅读或音乐类界面。

<div style="background:#191614;border:1px solid rgba(239,234,228,0.12);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#24201c;border:1px solid rgba(239,234,228,0.10);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#a3988d;">深色主题 · 暖调</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(216,155,92,0.15);color:#d89b5c;">暖暗底</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#efeae4;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#cfc5ba;margin-bottom:16px;">正文示例：深棕黑底配合暖白文字，在暗光环境下观感比冷色暗底更温和。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#d89b5c;color:#191614;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#a3988d;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#24201c;border:1px solid rgba(239,234,228,0.09);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#191614;border:1px solid rgba(239,234,228,0.16);margin-bottom:6px;"></div><div style="font-size:11px;color:#efeae4;font-weight:600;">底色</div><div style="font-size:11px;color:#a3988d;font-family:monospace;">#191614</div></div>
    <div style="background:#24201c;border:1px solid rgba(239,234,228,0.09);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#24201c;border:1px solid rgba(239,234,228,0.16);margin-bottom:6px;"></div><div style="font-size:11px;color:#efeae4;font-weight:600;">衬底</div><div style="font-size:11px;color:#a3988d;font-family:monospace;">#24201c</div></div>
    <div style="background:#24201c;border:1px solid rgba(239,234,228,0.09);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#efeae4;margin-bottom:6px;"></div><div style="font-size:11px;color:#efeae4;font-weight:600;">主字</div><div style="font-size:11px;color:#a3988d;font-family:monospace;">#efeae4</div></div>
    <div style="background:#24201c;border:1px solid rgba(239,234,228,0.09);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#a3988d;margin-bottom:6px;"></div><div style="font-size:11px;color:#efeae4;font-weight:600;">辅字</div><div style="font-size:11px;color:#a3988d;font-family:monospace;">#a3988d</div></div>
    <div style="background:#24201c;border:1px solid rgba(239,234,228,0.09);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#d89b5c;margin-bottom:6px;"></div><div style="font-size:11px;color:#efeae4;font-weight:600;">点睛</div><div style="font-size:11px;color:#a3988d;font-family:monospace;">#d89b5c</div></div>
  </div>
</div>

### 9. 靛蓝与月白

比第一套更偏向纯蓝的深色配置，浅蓝强调色避开了刺眼的亮蓝，适合技术文档和状态面板。

<div style="background:#111625;border:1px solid rgba(196,205,224,0.14);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#192033;border:1px solid rgba(196,205,224,0.12);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#8d98b2;">深色主题 · 靛蓝</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(143,179,232,0.14);color:#8fb3e8;">文档/面板</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#e6eaf4;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#c4cde0;margin-bottom:16px;">正文示例：深靛蓝底面保持克制，浅蓝仅用于区分按钮和状态标记，层级清晰。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#8fb3e8;color:#111625;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#8d98b2;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#192033;border:1px solid rgba(196,205,224,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#111625;border:1px solid rgba(196,205,224,0.18);margin-bottom:6px;"></div><div style="font-size:11px;color:#e6eaf4;font-weight:600;">底色</div><div style="font-size:11px;color:#8d98b2;font-family:monospace;">#111625</div></div>
    <div style="background:#192033;border:1px solid rgba(196,205,224,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#192033;border:1px solid rgba(196,205,224,0.18);margin-bottom:6px;"></div><div style="font-size:11px;color:#e6eaf4;font-weight:600;">衬底</div><div style="font-size:11px;color:#8d98b2;font-family:monospace;">#192033</div></div>
    <div style="background:#192033;border:1px solid rgba(196,205,224,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#e6eaf4;margin-bottom:6px;"></div><div style="font-size:11px;color:#e6eaf4;font-weight:600;">主字</div><div style="font-size:11px;color:#8d98b2;font-family:monospace;">#e6eaf4</div></div>
    <div style="background:#192033;border:1px solid rgba(196,205,224,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#8d98b2;margin-bottom:6px;"></div><div style="font-size:11px;color:#e6eaf4;font-weight:600;">辅字</div><div style="font-size:11px;color:#8d98b2;font-family:monospace;">#8d98b2</div></div>
    <div style="background:#192033;border:1px solid rgba(196,205,224,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#8fb3e8;margin-bottom:6px;"></div><div style="font-size:11px;color:#e6eaf4;font-weight:600;">点睛</div><div style="font-size:11px;color:#8d98b2;font-family:monospace;">#8fb3e8</div></div>
  </div>
</div>

### 10. 宣纸绛红

浅暖灰底搭配压暗的绛红色，沉稳而不张扬，适合书单目录或文化类幻灯片。绛红色块面积不宜过大，控制在少数标记处即可。

<div style="background:#f6f2ef;border:1px solid rgba(41,32,31,0.12);border-radius:12px;padding:20px;margin:16px 0;">
  <div style="background:#fdfbfa;border:1px solid rgba(41,32,31,0.10);border-radius:10px;padding:18px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
      <span style="font-size:12px;color:#736462;">浅色主题 · 绛红</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(138,60,60,0.11);color:#8a3c3c;">书单/汇报</span>
    </div>
    <div style="font-size:17px;font-weight:600;color:#29201f;margin-bottom:8px;">主标题文字效果预览</div>
    <div style="font-size:14px;line-height:1.65;color:#4a3c3a;margin-bottom:16px;">正文示例：浅暖灰底面衬托暗红重点，少量点缀即可突出关键内容。</div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:6px;background:#8a3c3c;color:#fdfbfa;font-size:13px;font-weight:600;">主要按钮</span>
      <span style="font-size:13px;color:#736462;">次要信息</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-top:14px;">
    <div style="background:#fdfbfa;border:1px solid rgba(41,32,31,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#f6f2ef;border:1px solid rgba(41,32,31,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#29201f;font-weight:600;">底色</div><div style="font-size:11px;color:#736462;font-family:monospace;">#f6f2ef</div></div>
    <div style="background:#fdfbfa;border:1px solid rgba(41,32,31,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#fdfbfa;border:1px solid rgba(41,32,31,0.12);margin-bottom:6px;"></div><div style="font-size:11px;color:#29201f;font-weight:600;">衬底</div><div style="font-size:11px;color:#736462;font-family:monospace;">#fdfbfa</div></div>
    <div style="background:#fdfbfa;border:1px solid rgba(41,32,31,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#29201f;margin-bottom:6px;"></div><div style="font-size:11px;color:#29201f;font-weight:600;">主字</div><div style="font-size:11px;color:#736462;font-family:monospace;">#29201f</div></div>
    <div style="background:#fdfbfa;border:1px solid rgba(41,32,31,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#736462;margin-bottom:6px;"></div><div style="font-size:11px;color:#29201f;font-weight:600;">辅字</div><div style="font-size:11px;color:#736462;font-family:monospace;">#736462</div></div>
    <div style="background:#fdfbfa;border:1px solid rgba(41,32,31,0.10);border-radius:6px;padding:8px;"><div style="height:22px;border-radius:4px;background:#8a3c3c;margin-bottom:6px;"></div><div style="font-size:11px;color:#29201f;font-weight:600;">点睛</div><div style="font-size:11px;color:#736462;font-family:monospace;">#8a3c3c</div></div>
  </div>
</div>

## 几条实用经验

1. 画面显得沉闷时，往往是因为留白不足。适当增大卡片和段落间距，原有配色的通透感就会明显改善。
2. 卡片边框尽量避免使用生硬的实线灰黑框，改用 `10%–16%` 透明度的浅白或浅灰，足以区分边界。
3. 蓝色系页面中避免直接搭配亮黄色做提示，两者对比过于刺眼；区分状态时，警告用暗红、正常用灰绿更为协调。
4. 制作小标签时无需另寻背景色，直接将点睛色降至 `12%` 左右透明度作为底色，文字沿用点睛色本身即可。
