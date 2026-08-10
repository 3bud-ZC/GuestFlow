declare module 'node-ical' {
  export const async: {
    parseICS(ics: string): Promise<any>;
  };
}
