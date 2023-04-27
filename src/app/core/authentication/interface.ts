// export interface User {
//   [prop: string]: any;

//   id?: number | string | null;
//   name?: string;
//   email?: string;
//   avatar?: string;
//   roles?: any[];
//   permissions?: any[];
// }

// export interface Token {
//   [prop: string]: any;

//   access_token: string;
//   token_type?: string;
//   expires_in?: number;
//   exp?: number;
//   refresh_token?: string;
// }

export interface Result<T> {
  data: T;
  errcode: number;
  errmsg: string;
}

export interface Token {
  [prop: string]: any;
  userid: number;
  name: string;
  token: string;
  sig: string;
  info: User;
}

export interface User {
  userid?: number;
  name?: string;
  cnname?: string;
  openid?: string;
  email_ant?: string;
  phone_ant?: string;
  passwd?: string;
  im?: string;
  qq?: string;
  rolecard?: null;
  sex?: string;
  touxiang?: string;
  birthday?: number;
  sign?: string;
  dice_id?: number;
  person_auth?: number;
  manager?: number;
  created?: string;
  updated?: string;
  vip?: boolean;
  vip_expire?: number;
  badge_resource_id?: number;
  qq_name?: string;
  qq_touxiang?: string;
  wx_name?: string;
  wx_touxiang?: string;
  first_enter_room?: number;
  first_make_map?: number;
}
