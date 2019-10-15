import { Signale } from 'signale';
interface SendPrivateMsgResponse {
    message_id: number;
}
interface SendGroupMsgResponse {
    message_id: number;
}
declare type GetGroupListResponse = Array<{
    group_id: number;
    group_name: string;
}>;
declare type GetGroupMemberListResponse = Array<{
    group_id: number;
    user_id: number;
    nickname: string;
    card: string;
    sex: 'male' | 'female' | 'unknown';
    age: number;
    area: string;
    join_time: number;
    last_sent_time: string;
    level: string;
    role: 'owner' | 'admin' | 'member';
    unfriendly: boolean;
    title: string;
    title_expire_time: number;
    card_changeable: boolean;
}>;
interface GetImageResponse {
    file: string;
}
interface PluginConfig {
    accessToken?: string;
}
export declare class HttpPlugin {
    logger: Signale;
    endpoint: string;
    config: PluginConfig;
    constructor(endpoint: string, config?: PluginConfig);
    sendPrivateMsg(personQQ: number, message: string, escape?: boolean): Promise<SendPrivateMsgResponse>;
    sendGroupMsg(groupQQ: number, message: string, escape?: boolean): Promise<SendGroupMsgResponse>;
    getGroupList(): Promise<GetGroupListResponse>;
    getGroupMemberList(groupQQ: number): Promise<GetGroupMemberListResponse>;
    downloadImage(cqFile: string): Promise<GetImageResponse>;
    private getResponseData;
}
export {};
