/**
 * 合同内商品的下单限定方式
 */
enum LimitType {
  /**
   * 下单不超过单项的总金额
   */
  ITEM_AMOUNT = 'ITEM_AMOUNT',
  /**
   * 下单不超过单项总数限定
   */
  ITEM_COUNT = 'ITEM_COUNT',
  /**
   * 下单不超过合同的总额
   */
  CONTRACT_AMOUNT = 'CONTRACT_AMOUNT'
}

/**
 * 合同条目
 */
interface ContractItem {
  /**
   * 物料编码
   */
  material: string
  /**
   * 限额类型
   */
  limitType: LimitType

  /**
   * 物料签约价格
   */
  price: number

  /**
   * 最大购买金额
   */
  maxAmount: number
  /**
   * 最大购买数量
   */
  maxCount: number

  /**
   * 单项剩余金额，此条目用于计算扣减，同步时不需要
   */
  balanceAmount: number

  /**
   * 单项剩余数量，此条目用于计算扣减，同步时不需要
   */
  balanceCount: number
}

/**
 * 合同明细
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Contract {
  /**
   * 合同名称
   */
  name: string

  /**
   * 合同编码
   */
  number: string

  /**
   * 合同所属客户
   */
  customer: string

  /**
   * 合同所属组织
   */
  organization: string

  /**
   * 合同执行日期
   */
  startDate: Date

  /**
   * 合同终止日期
   */
  endDate: Date

  /**
   * 总合同额
   */
  amount: number

  /**
   * 合同剩余金额，此属性用于计算扣减，同步时不需要
   */
  balanceAmount: number

  /**
   * 合同条目
   */
  items: ContractItem[]
}

/**
 * 说明：合同不用分类，一个就行。将限定模式分解到小项目中。这样就可用兼容各种不同的合同模式
 *
 * 下单限定规则。
 * 下单时，逐条检查物料的限定模式。
 * 如该该物料是ITEM_AMOUNT(单项限额模式)，则下单时，不能超过该合同该物料已下单的总金额。并且下单时不会扣减合同总余额。
 * 如果该物料是ITEM_COUNT(单项限量模式)，则下单时，不能超过该合同该物料已下单的总数量。下单时会忽略价格因素，不会扣减合同余额
 * 如果该物料是CONTRACT_AMOUNT(合同限额模式)，则下单时，不能超过该合同剩余金额。下单时会扣减合同总余额
 */
