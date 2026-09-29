// Bootstrap module registry before anything renders
import "@/modules/index";

import { TopBar } from "@/components/layout/TopBar";
import { LayerSidebar } from "@/components/sidebar/LayerSidebar";
import { MapView } from "@/components/map/MapView";
import { FeaturePanel } from "@/components/feature/FeaturePanel";

export default function MapPage() {
  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 relative overflow-hidden">
        <LayerSidebar />
        <div className="flex-1 relative overflow-hidden">
          <MapView />
        </div>
        <FeaturePanel />
      </div>
    </main>
  );
}
