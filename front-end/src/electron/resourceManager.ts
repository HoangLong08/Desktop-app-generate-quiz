import osUtils from 'os-utils';
import fs from 'fs';
import os from 'os';
import { BrowserWindow } from 'electron';
import { ipcWebContentsSend } from './util.js';

const POLL_INTERVAL = 1000; // 1 second

export function pollResource(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const memoryUsage = getMemoryUsage();
    const storageData = getStorageData();
    ipcWebContentsSend('statistics', mainWindow.webContents, { cpuUsage, memoryUsage, storageData: storageData.usage });
  }, POLL_INTERVAL);
}

export function getStationData() {
  const totalStorage = getStorageData().total;
  const cpuModel = os.cpus()[0].model;
  const totalMemoryGB = Math.floor(os.totalmem() / (1024 * 1024 * 1024 )); // Convert to GB

  return {
    totalStorage,
    cpuModel,
    totalMemoryGB
  }
}


function getCpuUsage(): Promise<number> {
  // Implement CPU usage retrieval logic here
  return new Promise((resolve) => {
    osUtils.cpuUsage(resolve);
  });
}

function getMemoryUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageData() {
  // require node 18
  const stats = fs.statfsSync(process.platform === 'win32' ? 'C:\\' : '/');
  const total = stats.bsize * stats.blocks;
  const free = stats.bsize * stats.bfree;
  
  return {
    total: Math.floor(total / (1024 * 1024 * 1024)), // Convert to GB
    usage: 1- free / total
  }
}