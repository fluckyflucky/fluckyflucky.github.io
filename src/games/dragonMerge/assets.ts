import dragon0 from './images/dragon-0.jpg'
import dragon1 from './images/dragon-1.jpg'
import dragon2 from './images/dragon-2.jpg'
import dragon3 from './images/dragon-3.jpg'
import dragon4 from './images/dragon-4.jpg'
import dragon5 from './images/dragon-5.jpg'
import dragon6 from './images/dragon-6.jpg'
import dragon7 from './images/dragon-7.jpg'
import dragon8 from './images/dragon-8.jpg'
import dragon9 from './images/dragon-9.jpg'
import dragon10 from './images/dragon-10.jpg'
import dragon11 from './images/dragon-11.jpg'
import dragon12 from './images/dragon-12.jpg'
import frog0 from './images/frog-0.jpg'
import frog1 from './images/frog-1.jpg'
import frog2 from './images/frog-2.jpg'
import frog3 from './images/frog-3.jpg'
import frog4 from './images/frog-4.jpg'
import frog5 from './images/frog-5.jpg'
import frog6 from './images/frog-6.jpg'
import frog7 from './images/frog-7.jpg'
import frog8 from './images/frog-8.jpg'
import frog9 from './images/frog-9.jpg'
import frog10 from './images/frog-10.jpg'
import frog11 from './images/frog-11.jpg'
import frog12 from './images/frog-12.jpg'
import { RADII } from './levels'

export type DragonVariant = 'dragon' | 'frog'

export interface MergeLevel {
  name: string
  radius: number
  color: string
  image: string
}

const colors = ['#ffedd1', '#ffe2cf', '#fff0b6', '#e4efc1', '#fce0e6', '#dceeed', '#dbebfb', '#e8def6', '#ffe8b9', '#ffdd91', '#f5bd66', '#eaa548', '#dc8a32'] as const

function levels(images: string[], names: string[]): MergeLevel[] {
  return images.map((image, index) => ({
    name: names[index]!,
    radius: RADII[index]!,
    color: colors[index]!,
    image,
  }))
}

const dragonLevels = levels(
  [dragon0, dragon1, dragon2, dragon3, dragon4, dragon5, dragon6, dragon7, dragon8, dragon9, dragon10, dragon11, dragon12],
  ['呆呆龙', '委屈龙', '绿帽龙', '白眼龙', '吐舌龙', '圣诞龙', '背影龙', '躺平龙', '大奶龙', '眨眼龙', '欢呼龙', '捏肚龙', '比耶龙'],
)

const frogLevels = levels(
  [frog0, frog1, frog2, frog3, frog4, frog5, frog6, frog7, frog8, frog9, frog10, frog11, frog12],
  ['呆呆蛙', '侧身蛙', '蹲蹲蛙', '倒立蛙', '杂技蛙', '飞踢蛙', '胖胖蛙', '西装蛙', '大奶蛙', '啃脚蛙', '比耶蛙', '惊鸿一瞥', '狂笑蛙'],
)

export function getLevels(variant: DragonVariant): MergeLevel[] {
  return variant === 'frog' ? frogLevels : dragonLevels
}
