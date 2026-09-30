'use client'
import { createLayerComponent, createElementObject, extendContext } from '@react-leaflet/core'
import L from 'leaflet'
import 'leaflet.markercluster'
import { clusterIcon } from '@/lib/mapSymbols'

// Wraps leaflet.markercluster for use inside react-leaflet v4.
// Renders children (Marker components) into the cluster group.
//
// `color` styles the cluster chip. Each of the four Wartung/Kontrolle sub-layers has
// its own group, so a cluster is always one category and can wear that category's
// colour — the default markercluster chips are blue regardless, which made a cluster
// of red "in Bearbeitung" tasks look like completed work.
interface ClusterProps {
  /** Category colour for the cluster chip. */
  color?: string
  children?: React.ReactNode
}

const MarkerClusterGroup = createLayerComponent<L.LayerGroup, ClusterProps>(
  (props, ctx) => {
    const { color, children: _children, ...rest } = props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = (L as any).markerClusterGroup({
      ...rest,
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iconCreateFunction: color
        ? (cluster: any) => clusterIcon(color, cluster.getChildCount())
        : undefined,
    })
    return createElementObject(instance, extendContext(ctx, { layerContainer: instance }))
  },
  (instance, props) => {
    // No dynamic prop updates needed
  },
)

export default MarkerClusterGroup
