import { app } from 'electron';
import path from 'node:path';

export const getUserDataPath = () =>
  path.join(app.getPath('appData'), `defeat-fit${app.isPackaged ? '' : '-dev'}`);
