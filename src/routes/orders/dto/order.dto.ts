export default class OrderDto {
  order_number: number = undefined;
  billingMethodId: string | number = undefined;
  comments: string = undefined;
  account_id: string | number = undefined;
  items: {
    product_sku: string;
    price_total: number;
    quantity?: number;
    price?: number;
    discount_total?: number;
    variant_name?: string;
  }[] = undefined;

  shipping?: {
    service_id?: number;
    service_name?: string;
    price: number;
    address1?: string;
    city?: string;
    time: string;
    //delivery discount
    discount_total?: number;
    price_total?: number;
  } = undefined;
}
