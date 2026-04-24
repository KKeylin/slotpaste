import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const SVG = 'public/SlotPaste.svg'
const ICONSET = 'build/icon.iconset'

mkdirSync(ICONSET, { recursive: true })

const sizes = [
  { file: 'icon_16x16.png',      size: 16  },
  { file: 'icon_16x16@2x.png',   size: 32  },
  { file: 'icon_32x32.png',      size: 32  },
  { file: 'icon_32x32@2x.png',   size: 64  },
  { file: 'icon_128x128.png',    size: 128 },
  { file: 'icon_128x128@2x.png', size: 256 },
  { file: 'icon_256x256.png',    size: 256 },
  { file: 'icon_256x256@2x.png', size: 512 },
  { file: 'icon_512x512.png',    size: 512 },
  { file: 'icon_512x512@2x.png', size: 1024 },
]

for (const { file, size } of sizes) {
  await sharp(SVG).resize(size, size).png().toFile(join(ICONSET, file))
  console.log(`✓ ${file} (${size}x${size})`)
}

execSync(`iconutil -c icns ${ICONSET} --output build/icon.icns`)
console.log('✓ build/icon.icns')