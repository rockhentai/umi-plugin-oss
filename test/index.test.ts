import 'jest';
import UmiPluginOss, { handleAcl, FileInfo, UmiApi } from '../src/index';

jest.mock('fs');

let messageQueue: Map<string, string[]> = new Map();

const umiApi: UmiApi = {
  config: {
    base: undefined,
    publicPath: 'https://cdn.imhele.com/',
    cssPublicPath: undefined,
  },
  paths: {
    outputPath: '/dist/',
    absOutputPath: '/home/dist/',
    pagesPath: '',
    absPagesPath: '',
    tmpDirPath: '',
    absTmpDirPath: '',
    absSrcPath: '',
    cwd: '',
  },
  routes: [],
  registerCommand: () => { },
  log: {
    success: (...messages: string[]) => {
      messageQueue.set(`${Date.now()}|success`, messages);
    },
    error: (...messages: string[]) => {
      messageQueue.set(`${Date.now()}|error`, messages);
    },
    debug: (...messages: string[]) => {
      messageQueue.set(`${Date.now()}|debug`, messages);
    },
    pending: (...messages: string[]) => {
      messageQueue.set(`${Date.now()}|pending`, messages);
    },
    watch: (...messages: string[]) => {
      messageQueue.set(`${Date.now()}|watch`, messages);
    },
  },
  debug: (message: string) => {
    messageQueue.set(`${Date.now()}|debug`, [message]);
  },
  onBuildSuccess: (callback) => { callback(); },
};

describe('test index', () => {
  test('api exist', () => {
    expect(UmiPluginOss).toBeTruthy();
    expect(handleAcl).toBeTruthy();
  });

  test('handleAcl', () => {
    const fileInfoArr: FileInfo[] = [['test.js', '/home/test.js', 'private']];
    expect(() => {
      handleAcl(['test.js'], fileInfoArr, 'public-read');
    }).not.toThrow();
    expect(fileInfoArr[0][2]).toBe('public-read');
  });

  test('UmiPluginOss without params', () => {
    expect(() => {
      UmiPluginOss(umiApi, {});
    }).toThrow();
    expect(messageQueue.size).toBe(0);
    messageQueue.clear();
  });

  test('UmiPluginOss with default options', () => {
    expect(() => {
      UmiPluginOss(umiApi, {
        accessKeyId: 'test',
        accessKeySecret: 'test',
      });
    }).not.toThrow();
    expect(messageQueue.size).toBe(1);
    const keys = Array.from(messageQueue.keys());
    expect(keys[0].endsWith('debug')).toBe(true);
    expect(messageQueue.get(keys[0])).toEqual(['/home/dist/umi.js', 'private']);
    messageQueue.clear();
  });

  test('UmiPluginOss without cname and bucket', () => {
    expect(() => {
      UmiPluginOss(
        {
          ...umiApi,
          config: {
            ...umiApi.config,
            publicPath: undefined,
          },
        },
        {
          accessKeyId: 'test',
          accessKeySecret: 'test',
        });
    }).toThrow();
    expect(messageQueue.size).toBe(0);
    messageQueue.clear();
  });

  test('UmiPluginOss with bucket', () => {
    expect(() => {
      UmiPluginOss(
        {
          ...umiApi,
          config: {
            ...umiApi.config,
            publicPath: undefined,
          },
        },
        {
          accessKeyId: 'test',
          accessKeySecret: 'test',
          bucket: {
            name: 'imhele',
            region: 'oss-cn-beijing',
          },
        });
    }).not.toThrow();
    expect(messageQueue.size).toBe(1);
    const keys = Array.from(messageQueue.keys());
    expect(keys[0].endsWith('debug')).toBe(true);
    expect(messageQueue.get(keys[0])).toEqual(['/home/dist/umi.js', 'private']);
    messageQueue.clear();
  });

  test('UmiPluginOss with RegExp acl rule', () => {
    expect(() => {
      UmiPluginOss(umiApi, {
        accessKeyId: 'test',
        accessKeySecret: 'test',
        acl: {
          publicRead: new RegExp('.js'),
        },
      });
    }).not.toThrow();
    expect(messageQueue.size).toBe(1);
    const keys = Array.from(messageQueue.keys());
    expect(keys[0].endsWith('debug')).toBe(true);
    expect(messageQueue.get(keys[0])).toEqual(['/home/dist/umi.js', 'public-read']);
    messageQueue.clear();
  });

  test('UmiPluginOss with ignore filter', () => {
    expect(() => {
      UmiPluginOss(umiApi, {
        accessKeyId: 'test',
        accessKeySecret: 'test',
        ignore: {
          sizeBetween: [[0, 1000]],
        },
      });
    }).not.toThrow();
    expect(messageQueue.size).toBe(0);
    messageQueue.clear();
  });

  test('UmiPluginOss with bijection', () => {
    expect(() => {
      UmiPluginOss(umiApi, {
        accessKeyId: 'test',
        accessKeySecret: 'test',
        bijection: true,
      });
    }).not.toThrow();
    expect(messageQueue.size).toBe(1);
    const keys = Array.from(messageQueue.keys());
    expect(keys[0].endsWith('debug')).toBe(true);
    expect(messageQueue.get(keys[0])).toEqual(['/home/dist/umi.js', 'private']);
    messageQueue.clear();
  });

});
