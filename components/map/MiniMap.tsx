import dynamic from 'next/dynamic'
import type { SymbolType } from '@/lib/mapSymbols'

const Inner = dynamic(() => import('./MiniMapInner'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#e8f0e4] animate-pulse" />,
})

interface Props {
  center: [number, number]
  zoom?: number
  color: string
  symbolType?: SymbolType
  polyline?: [number, number][]
}

export default function MiniMap(props: Props) {
  return <Inner {...props} />
}
