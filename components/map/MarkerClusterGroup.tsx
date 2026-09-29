'use client'
import { createLayerComponent, createElementObject, extendContext } from '@react-leaflet/core'
import L from 'leaflet'
import 'leaflet.markercluster'

// Wraps leaflet.markercluster for use inside react-leaflet v4.
// Renders children (Marker components) into the cluster group.
const MarkerClusterGroup = createLayerComponent(
  (props, ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = (L as any).markerClusterGroup(props)
    return createElementObject(instance, extendContext(ctx, { layerContainer: instance }))
  },
  (instance, props) => {
    // No dynamic prop updates needed
  },
)

export default MarkerClusterGroup
