export default class AccountUpdateDataDto {
  id?: number = undefined;
  swell_id?: string = undefined;

  first_name?: string = undefined;
  subscribed?: boolean = undefined;
  phone?: string = undefined;
  shipping?: {
    address1?: string;
    state?: string;
    city?: string;
  } = undefined;
}
