/* eslint-disable @typescript-eslint/unbound-method */
import { assertType, getType } from '@xhmm/utils';
import { Messages } from './CQHelper';
import { HttpPlugin } from './HttpPlugin';

// 命令生效范围
export enum Scope {
  user = 'user', // 仅在和机器人私聊时刻触发该命令
  group = 'group', // 仅在群组内发消息时刻触发该命令
  both = 'both', // 私聊和群内都可触发该命令
}
// 群组内时命令触发方式
export enum TriggerType {
  at = 'at', // at表示需要艾特机器人并输入内容方可触发
  noAt = 'noAt', //noAt表示需要直接输入内容不能艾特
  both = 'both', // both表示两种皆可
}
// 常用的三种号码信息
export interface Numbers {
  fromUser: number | null; // 为null表明是匿名消息
  fromGroup: number;
  robot: number; // 机器人qq
}

interface BaseParams extends Numbers {
  directives: string[];
  messages: Messages;
  httpPlugin: HttpPlugin;
}

export interface ParseParams extends BaseParams {}
export type ParseReturn = any;

type SetNextFn = (sessionName: string, expireSeconds?: number) => Promise<void>; // 设置session name和过期时间
type SetEndFn = () => Promise<void>; // 删除session

export interface UserHandlerParams extends BaseParams {
  setNext: SetNextFn;
}
export interface GroupHandlerParams extends BaseParams {
  isAt: boolean;
  setNext: SetNextFn;
}
export interface SessionHandlerParams {
  setNext: SetNextFn;
  setEnd: SetEndFn;
  fromUser: number | null;
  fromGroup: number;
  robot: number;
  messages: Messages;
  historyMessages: Record<string, Messages>;
}
export type HandlerReturn =
  | {
      atSender: boolean;
      content: string;
    }
  | string[]
  | string
  | void;

type OrPromise<T> = T | Promise<T>;

export abstract class Command<C = unknown, D = unknown> {
  context: C; // 在RobotFactory中被注入，值为create时传入的内容，默认为null
  data: D; // 在RobotFactory中被注入，值为parse函数的返回值，默认为null

  directives: string[]; // 使用Command.normalizeDirectives函数进行填充

  includeGroup?: number[]; // 给group函数使用@include注入
  excludeGroup?: number[]; // 给group函数使用@exclude注入
  includeUser?: number[]; // 给user函数使用@include注入
  excludeUser?: number[]; // 给user函数使用@exclude注入
  triggerType?: TriggerType; // 给group使用@trigger进行设置，默认按at处理。请勿对其赋值，会导致修饰器无效！！！

  scope: Scope; // // 在构造函数内被初始化。使用该属性来判断该命令的作用域

  constructor() {
    if (this.directive) assertType(this.directive, 'function');
    if (this.parse) assertType(this.parse, 'function');
    if (!this.directive && !this.parse) throw new Error('请为Command的继承类提供directive函数或parse函数');
    const hasUserHandler = getType(this.user) === 'function';
    const hasGroupHandler = getType(this.group) === 'function';
    if (hasGroupHandler && hasUserHandler) this.scope = Scope.both;
    else {
      if (!hasUserHandler && !hasGroupHandler) throw new Error('为Command的继承类提供user函数或group函数');
      if (hasGroupHandler) this.scope = Scope.group;
      if (hasUserHandler) this.scope = Scope.user;
    }
  }

  // must be called manually before using command
  public static normalizeDirectives(cmd: Command): void {
    const defaultDirective = cmd.constructor.name + 'Default';
    if (typeof cmd.directive === 'function') {
      const directives = cmd.directive();
      if (getType(directives) === 'array' || directives.length !== 0) {
        cmd.directives = directives;
        return;
      } else cmd.directives = [defaultDirective];
    } else cmd.directives = [defaultDirective];
  }

  directive?(): string[];
  parse?(params: ParseParams): OrPromise<ParseReturn>;

  // 下面俩函数必须提供一个
  user?(params: UserHandlerParams): OrPromise<HandlerReturn>;
  group?(params: GroupHandlerParams): OrPromise<HandlerReturn>;
}

// 指定该选项时，只有这里面的qq/qq群可触发该命令
// TODO: 后期改为可接受(异步)函数
export function include(include: number[]) {
  return function(proto, name, descriptor) {
    if (name === 'group') proto.includeGroup = include;
    if (name === 'user') proto.includeUser = include;
  };
}

// 指定该选项时，这里面的qq/qq群不可触发该命令。指定该选项则include无效
export function exclude(exclude: number[]) {
  return function(proto, name, descriptor) {
    if (name === 'group') proto.excludeGroup = exclude;
    if (name === 'user') proto.excludeUser = exclude;
  };
}

// 对group使用有效，设置群组内命令触发方式
export function trigger(type: TriggerType) {
  return function(proto, name, descriptor) {
    proto.triggerType = type;
  };
}
