import type { Notice, SendMessage } from "../../common/types";

let isInitialized = false;
let sendMessage: SendMessage | null = null;

const sendMessageIfNotNull: SendMessage = (channel, ...args) => {
  if (sendMessage !== null) {
    sendMessage(channel, ...args);
  }
};

export const noticeApi = {
  initialize(deps: { sendMessage: SendMessage }) {
    if (isInitialized) {
      return;
    }

    sendMessage = deps.sendMessage;

    isInitialized = true;
  },

  createNotice(notice: Notice) {
    sendMessageIfNotNull('create-notice', notice);
  },
} as const;
