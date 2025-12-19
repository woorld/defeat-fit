export const oscSetting = {
  host: '127.0.0.1',
  port: 11337,
};

export const useLog = (prefix) => (str) => console.log(prefix + ': ' + str);
