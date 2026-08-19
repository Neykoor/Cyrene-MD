type OwnerEntry = [string, string?, boolean?];

interface WaGlobals {
  downloadContentFromMessage: (...args: any[]) => any;
}

declare global {
  // eslint-disable-next-line no-var
  var prefix: string;
  // eslint-disable-next-line no-var
  var owner: OwnerEntry[];
  // eslint-disable-next-line no-var
  var allowedPrefixes: string[];
  // eslint-disable-next-line no-var
  var isOwner: (user: string) => boolean;
  // eslint-disable-next-line no-var
  var setPrefix: (newPrefix: string) => void;
  // eslint-disable-next-line no-var
  var opts: Record<string, any>;
  // eslint-disable-next-line no-var
  var wa: WaGlobals;
}

export {};
