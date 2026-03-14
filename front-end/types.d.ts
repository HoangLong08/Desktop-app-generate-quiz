type Statistics = { cpuUsage: number, memoryUsage: number, storageData: number }

type StationData = { 
  totalStorage: number, 
  cpuModel: string, 
  totalMemoryGB: number 
}

type EventPayloadMapping = {
  statistics: Statistics;
  getStaticData: StaticData;
  changeView: View;
  sendFrameAction: FrameWindowAction;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction,
    getStaticData: () => Promise<StationData>
  }
}