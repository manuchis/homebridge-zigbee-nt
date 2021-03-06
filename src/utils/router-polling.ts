import { sleep } from './sleep';
import { ZigBee } from '../zigbee/zigbee';
import Timeout = NodeJS.Timeout;
import { Logger } from 'homebridge';

const DEFAULT_POLL_INTERVAL = 60 * 1000;

function isDeviceRouter(device) {
  let power = 'unknown';
  if (device.powerSource) {
    power = device.powerSource.toLowerCase().split(' ')[0];
  }
  if (power !== 'battery' && power !== 'unknown' && device.type === 'Router') {
    return true;
  }
}

export class RouterPolling {
  private readonly log: Logger;
  private pollingTimeout: Timeout;
  private readonly interval: number;
  private readonly zigBee: ZigBee;

  constructor(zigBee: ZigBee, log: Logger, interval: number) {
    this.zigBee = zigBee;
    this.log = log;
    this.interval = interval || DEFAULT_POLL_INTERVAL;
  }

  start() {
    this.stop();
    this.pollingTimeout = setTimeout(() => {
      const devices = this.zigBee.list().filter(isDeviceRouter);
      devices.forEach(async device => {
        try {
          if (this.log) {
            this.log.debug(
              `[RouterPolling] ping device: ${device.ieeeAddr} ${device.manufacturerName}: ${device.modelID}`
            );
          }
          await this.zigBee.ping(device.ieeeAddr);
          return sleep(1000);
        } catch (e) {
          this.log.error(
            `[RouterPolling] ping device error: ${device.ieeeAddr} ${device.manufacturerName}: ${device.modelID}`,
            e
          );
        }
      });
      this.pollingTimeout.refresh();
    }, this.interval);
  }

  stop() {
    clearTimeout(this.pollingTimeout);
    this.pollingTimeout = null;
  }
}
