# [设计] 画框里的平衡、留白和视线

铺开画纸或举起相机对准街角时，第一步都是划定边界——四条边线把连续的现实世界切下一块，装进一个矩形里。打从这一刻起，画面里的形状、明暗和人物朝向就不再孤立，彼此之间会互相拉扯，也会和四条画框边缘产生距离感。

## 居中与偏置

四条画框边缘对内部物体有一种隐性的牵引力。把主体放进正中央时，它到左右、上下的距离彼此抵消，画面会显得端正、沉稳，甚至带点仪式感，常见于肖像画、建筑立面和宗教祭坛画。

一旦把主体从中心移开，对称就被打破了。主体靠近的那一侧空间收窄，容易产生紧迫感或靠背般的踏实感；留出大面积空白的那一侧则显得空阔，适合容纳视线延伸、运动轨迹或空气感。绘画和摄影里常说的三分法，说白了就是把焦点放在偏离中心、又不至于贴到边缘的交叉点附近，用不对称换来一点活动余地。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 220" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="居中对称与偏置张力对比示意">
    <g transform="translate(20,16)">
      <rect x="0" y="0" width="256" height="160" rx="6" fill="#0b242d" stroke="rgba(174,215,211,0.32)" stroke-width="1.5" />
      <line x1="128" y1="8" x2="128" y2="152" stroke="rgba(174,215,211,0.22)" stroke-width="1" stroke-dasharray="4 4" />
      <line x1="8" y1="80" x2="248" y2="80" stroke="rgba(174,215,211,0.22)" stroke-width="1" stroke-dasharray="4 4" />
      <circle cx="128" cy="80" r="26" fill="#3b7278" stroke="#e3eeec" stroke-width="1.6" />
      <circle cx="128" cy="80" r="4" fill="#eb9f33" />
      <text x="128" y="182" text-anchor="middle" fill="#e3eeec" font-size="12">居中放置，四边受力均等</text>
    </g>
    <g transform="translate(324,16)">
      <rect x="0" y="0" width="256" height="160" rx="6" fill="#0b242d" stroke="rgba(174,215,211,0.32)" stroke-width="1.5" />
      <line x1="85.3" y1="0" x2="85.3" y2="160" stroke="rgba(174,215,211,0.18)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="170.6" y1="0" x2="170.6" y2="160" stroke="rgba(174,215,211,0.18)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="0" y1="53.3" x2="256" y2="53.3" stroke="rgba(174,215,211,0.18)" stroke-width="1" stroke-dasharray="3 3" />
      <line x1="0" y1="106.6" x2="256" y2="106.6" stroke="rgba(174,215,211,0.18)" stroke-width="1" stroke-dasharray="3 3" />
      <circle cx="85.3" cy="53.3" r="22" fill="#eb9f33" opacity="0.9" stroke="#e3eeec" stroke-width="1.6" />
      <path d="M 114 53.3 L 222 53.3" stroke="#9fb6b8" stroke-width="1.4" stroke-dasharray="4 4" />
      <polygon points="222,53.3 214,49.3 214,57.3" fill="#9fb6b8" />
      <circle cx="170.6" cy="106.6" r="7" fill="#438c8f" stroke="rgba(227,238,236,0.6)" stroke-width="1.2" />
      <text x="128" y="182" text-anchor="middle" fill="#e3eeec" font-size="12">偏置留白，给视线留出延伸空间</text>
    </g>
  </svg>
</div>

德国浪漫主义画家卡斯帕·大卫·弗里德里希的《雾海上的旅人》用中轴线用得很典型。旅人站在正中央的深色岩石上，形成一个稳固的三角形底座，左右两侧的大片云雾向两边铺开。人物虽然背对观者，中轴线却把目光定在画心，再往远处的群山送出去。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:16px;margin:20px 0;">
  <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
    <div style="flex:2 1 320px;min-width:0;">
      <img src="/img/notes/composition-gaze/wanderer-sea-of-fog.jpg" alt="卡斯帕·大卫·弗里德里希《雾海上的旅人》" style="width:100%;max-height:460px;object-fit:contain;border-radius:8px;display:block;background:#0b242d;" />
    </div>
    <div style="flex:1 1 180px;min-width:0;background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:14px;">
      <div style="font-size:13px;color:#e3eeec;font-weight:600;margin-bottom:8px;">弗里德里希《雾海上的旅人》（1818）</div>
      <div style="font-size:12px;color:#9fb6b8;line-height:1.7;">人物与脚下深色礁石压在垂直中轴线上，构成稳固的深色剪影；四周的浅色云海向两侧退开，既保持了中轴的肃穆，又靠明暗反差托出远景的开阔。</div>
    </div>
  </div>
</div>

## 画面里的视觉重量

画面的平衡很像一杆以画框中心为支点的天平。左右两边未必放上一样大的东西，只要两端的视觉分量接近，画面就不会向一侧倾倒。

人眼判断一个色块或物体“有多重”，主要看五个方面：

- **面积**，占地越大的块面越重，这是最直接的分量。
- **明度与反差**，在浅底上，深色块显得沉重；在深底上，一小块高对比亮斑同样很抓眼。
- **纯度与冷暖**，高纯度暖色（如朱红、亮黄）会向外膨胀，一小点就能压住大面积低纯度冷灰。
- **边缘锐度与细节**，轮廓清晰、纹理密集的区域比边缘虚化、平涂过渡的区域更重。
- **人物视线与方向**，人物目光所指、手势朝向或运动方向，会在视线落点处生出额外的心理重量。

如果一侧放着大面积柔和的冷灰远山，另一侧不需要同样大小的物体去抵消，只要在远离中心支点的位置放上一小块高对比暖色，或者一位看向远方的人物，整杆天平就会重新找回平衡。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 220" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="视觉重量的杠杆平衡示意">
    <rect x="16" y="12" width="568" height="196" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" stroke-width="1" />
    <line x1="90" y1="126" x2="510" y2="126" stroke="#9fb6b8" stroke-width="2.5" stroke-linecap="round" />
    <polygon points="300,128 286,158 314,158" fill="#3b7278" stroke="#e3eeec" stroke-width="1.4" />
    <line x1="175" y1="126" x2="175" y2="140" stroke="rgba(174,215,211,0.45)" stroke-width="1.2" />
    <line x1="470" y1="126" x2="470" y2="140" stroke="rgba(174,215,211,0.45)" stroke-width="1.2" />
    <text x="237" y="148" text-anchor="middle" fill="#9fb6b8" font-size="11">力臂短（靠近中心）</text>
    <text x="385" y="148" text-anchor="middle" fill="#9fb6b8" font-size="11">力臂长（靠近边缘）</text>
    <rect x="125" y="54" width="100" height="64" rx="8" fill="#365c66" opacity="0.88" />
    <text x="175" y="44" text-anchor="middle" fill="#9fb6b8" font-size="11">大面积 · 低纯度 · 柔边</text>
    <circle cx="470" cy="100" r="17" fill="#eb9f33" stroke="#e3eeec" stroke-width="2" />
    <text x="470" y="72" text-anchor="middle" fill="#e3eeec" font-size="11">小面积 · 高纯度 · 锐边</text>
    <text x="300" y="188" text-anchor="middle" fill="#9fb6b8" font-size="12">小而鲜明的高对比主体放在长力臂端，能稳稳托住大面积低纯度块面</text>
  </svg>
</div>

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <div style="font-size:12px;color:#e3eeec;font-weight:600;margin-bottom:8px;">明度反差</div>
      <div style="height:54px;border-radius:6px;background:#1d3b42;display:flex;align-items:center;justify-content:space-around;">
        <div style="width:28px;height:28px;border-radius:50%;background:#2b5159;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#e3eeec;"></div>
      </div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:8px;">暗底上的小白点比大灰圆更重</div>
    </div>
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <div style="font-size:12px;color:#e3eeec;font-weight:600;margin-bottom:8px;">边缘锐度</div>
      <div style="height:54px;border-radius:6px;background:#1d3b42;display:flex;align-items:center;justify-content:space-around;">
        <div style="width:28px;height:28px;border-radius:50%;background:#6fa8ae;filter:blur(4px);"></div>
        <div style="width:20px;height:20px;border-radius:3px;background:#6fa8ae;border:1.5px solid #e3eeec;"></div>
      </div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:8px;">硬边锐角天然把视线吸过去</div>
    </div>
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <div style="font-size:12px;color:#e3eeec;font-weight:600;margin-bottom:8px;">视线朝向</div>
      <div style="height:54px;border-radius:6px;background:#1d3b42;display:flex;align-items:center;justify-content:center;gap:10px;">
        <div style="width:18px;height:18px;border-radius:50%;background:#e3eeec;position:relative;"><div style="width:6px;height:6px;border-radius:50%;background:#102b34;position:absolute;right:2px;top:6px;"></div></div>
        <div style="width:46px;height:2px;border-top:2px dashed #eb9f33;"></div>
        <div style="width:8px;height:8px;border-radius:50%;background:#eb9f33;"></div>
      </div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:8px;">人物看向哪里，重量就延伸到哪里</div>
    </div>
  </div>
</div>

## 引导线和视线回流

一幅画虽然静止，人眼阅读它的过程却有时间先后。好的构图往往会留一个清晰的入口（比如前景延伸的小径、地板拼缝或一道光带），让视线顺着引导线走进主体，再在画面深处遇到某种阻挡或转折，折返回画框内部。

最怕出现的情况是“漏气”——一条笔直的斜线或人物的视线直直冲向画框角落，没有任何遮挡或呼应，观者的目光就会顺着那条线滑出画外。画师常在边缘处放一块深色块、一棵向内倾斜的树，或者让次要人物的视线指回主角，把快跑出去的注意力重新兜回来。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 220" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="引导线滑出画框与视线回流对比示意">
    <g transform="translate(20,16)">
      <rect x="0" y="0" width="256" height="160" rx="6" fill="#0b242d" stroke="rgba(174,215,211,0.32)" stroke-width="1.5" />
      <path d="M 24 148 Q 110 100 256 18" fill="none" stroke="#d44731" stroke-width="2.2" stroke-dasharray="5 4" />
      <polygon points="258,16 247,17 252,25" fill="#d44731" />
      <circle cx="110" cy="96" r="14" fill="#3b7278" stroke="#e3eeec" stroke-width="1.4" />
      <text x="28" y="138" fill="#9fb6b8" font-size="11">入口</text>
      <text x="220" y="38" fill="#d44731" font-size="11">滑出</text>
      <text x="128" y="182" text-anchor="middle" fill="#e3eeec" font-size="12">缺少收束，斜线直冲角落带走视线</text>
    </g>
    <g transform="translate(324,16)">
      <rect x="0" y="0" width="256" height="160" rx="6" fill="#0b242d" stroke="rgba(174,215,211,0.32)" stroke-width="1.5" />
      <path d="M 26 146 Q 92 122 146 68 Q 186 30 214 58 Q 228 84 188 112 Q 146 134 114 96" fill="none" stroke="#6fd0da" stroke-width="2.2" />
      <polygon points="114,96 123,100 118,107" fill="#6fd0da" />
      <circle cx="104" cy="90" r="15" fill="#eb9f33" stroke="#e3eeec" stroke-width="1.5" />
      <rect x="216" y="24" width="20" height="96" rx="4" fill="#264b54" stroke="rgba(174,215,211,0.3)" stroke-width="1" />
      <text x="28" y="136" fill="#9fb6b8" font-size="11">入口</text>
      <text x="104" y="66" text-anchor="middle" fill="#e3eeec" font-size="11">焦点</text>
      <text x="226" y="136" text-anchor="middle" fill="#9fb6b8" font-size="11">挡块回流</text>
      <text x="128" y="182" text-anchor="middle" fill="#e3eeec" font-size="12">边缘挡块把目光折回画心</text>
    </g>
  </svg>
</div>

埃德加·德加的《舞蹈课》把这条路线铺得很自然。画面左下角留出大片斜向延伸的木地板，作为视线的入口；目光顺着地板拼缝与舞者队列斜穿过去，落在中景拄着木杖的芭蕾教师身上，再沿着墙面、镜框和右侧舞者向内收拢。画框边缘直接裁切掉部分舞者的裙摆和身体，也让整张画看起来像舞台幕间不经意瞥见的一瞬。

葛饰北斋的《神奈川冲浪里》是另一种回流。左侧巨浪高高隆起，浪尖分裂成向内弯曲的浪爪，把视线猛地拽向右下方的船只，顺着船身和翻涌的浪谷，再送到远景中静止的富士山。动荡的弧线和静止的三角形互相咬住，眼睛在浪尖和山峰之间来回游走，不会跑出画框外。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;">
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <img src="/img/notes/composition-gaze/degas-dance-class.jpg" alt="德加《舞蹈课》" style="width:100%;height:240px;object-fit:cover;border-radius:8px;display:block;" />
      <div style="font-size:12px;color:#e3eeec;font-weight:600;margin-top:10px;">德加《舞蹈课》（约 1874）</div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:4px;line-height:1.6;">前景斜向地板打开入口，视线沿队列推进到教师处，再被右侧墙面与人物挡回画内。</div>
    </div>
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <img src="/img/notes/composition-gaze/great-wave.jpg" alt="葛饰北斋《神奈川冲浪里》" style="width:100%;height:240px;object-fit:cover;border-radius:8px;display:block;" />
      <div style="font-size:12px;color:#e3eeec;font-weight:600;margin-top:10px;">葛饰北斋《神奈川冲浪里》（约 1831）</div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:4px;line-height:1.6;">巨浪向左下方扣合，把目光压入浪谷中的小船，再直线引向右侧低矮稳固的富士山。</div>
    </div>
  </div>
</div>

## 正形与负形

我们习惯先看画里的“物体”（正形），往往忽略物体之间以及物体与画框之间的“空隙”（负形）。在二维平面上，正形和负形同时成立：把瓶罐画准的同时，瓶罐之间漏出来的那块空气也就定型了。

如果负形被挤成几条宽度雷同的窄缝，或者在角落里卡出零碎难看的尖角，整幅画就会显得局促。反之，当留白本身拥有清晰、舒展的轮廓时，哪怕正形只是几个简单的剪影，画面依然耐看。中国画里常说的“计白当黑”，把空白看作和墨色同等重要的形体去经营，说的就是这件事。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 205" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="正形与负形空间关系示意">
    <g transform="translate(20,14)">
      <rect x="0" y="0" width="256" height="150" rx="6" fill="#0b242d" stroke="rgba(174,215,211,0.32)" stroke-width="1.5" />
      <rect x="18" y="18" width="66" height="114" rx="4" fill="#3b7278" />
      <rect x="95" y="18" width="66" height="114" rx="4" fill="#3b7278" />
      <rect x="172" y="18" width="66" height="114" rx="4" fill="#3b7278" />
      <text x="128" y="172" text-anchor="middle" fill="#e3eeec" font-size="12">负形均等，空隙变成重复窄条</text>
    </g>
    <g transform="translate(324,14)">
      <rect x="0" y="0" width="256" height="150" rx="6" fill="#e3eeec" stroke="rgba(174,215,211,0.32)" stroke-width="1.5" />
      <path d="M 0 0 L 96 0 L 96 42 C 96 56 76 64 76 82 C 76 108 104 124 104 150 L 0 150 Z" fill="#183b3f" />
      <path d="M 256 0 L 160 0 L 160 42 C 160 56 180 64 180 82 C 180 108 152 124 152 150 L 256 150 Z" fill="#183b3f" />
      <text x="44" y="82" text-anchor="middle" fill="#9fb6b8" font-size="11">正形</text>
      <text x="128" y="82" text-anchor="middle" fill="#102b34" font-size="11" font-weight="600">负形器皿</text>
      <text x="212" y="82" text-anchor="middle" fill="#9fb6b8" font-size="11">正形</text>
      <text x="128" y="172" text-anchor="middle" fill="#e3eeec" font-size="12">留白本身具备明确造型</text>
    </g>
  </svg>
</div>

## 眯眼和倒置检查

写生或拍照时，有一个很简单的检验办法：把眼睛眯起来，忽略五官、叶脉和砖缝之类的细节，只看画面里剩下几大块明暗、重块落在哪里，以及四周留白的形状是否舒服。

另一件有用的小事，是把草稿上下颠倒过来，或者在镜子里看一眼。熟悉的对象一旦失去原本的语义，人眼就会被迫只看线条走向、块面轻重和边缘拥挤程度——哪里觉得堵、哪里滑出了画框，马上就能看出来。
