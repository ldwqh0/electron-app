/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2025-03-28 16:26:26.

export interface FileInfoDto extends Serializable {
    id?: string;
    filename?: string;
    size?: string;
    sha256?: string;
    md5?: string;
    createdBy?: Auditor<string, string>;
    lastModifiedBy?: Auditor<string, string>;
    createTime?: Date;
    lastModifiedTime?: Date;
    path?: string;
}

export interface PackageFileDto extends Serializable {
    id?: string;
    type?: string;
    filename?: string;
    files?: string[];
}

export interface Range {
    end?: string;
    start?: string;
    contentLength?: string;
}

export interface AddressDto {
    customerNumber?: string;
    customer?: CustomerDto;
    id?: string;
    concat?: string;
    tel?: string;
    name?: string;
    address?: string;
    postAddress?: string;
    default?: boolean;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface Authorities {
    role_TENANT_USER?: TenantRoleDto;
    role_TENANT_ADMIN?: TenantRoleDto;
    authority_ANONYMOUS?: TenantRoleDto;
}

export interface ContractDto {
    tenantId?: string;
    id?: string;
    name?: string;
    type?: string;
    number?: string;
    customer?: CustomerDto;
    organization?: OrganizationDto;
    startDate?: Date;
    endDate?: Date;
    amount?: string;
    balanceAmount?: string;
    completed?: boolean;
    expired?: boolean;
    items?: ContractItemDto[];
    headers?: ContractHeaderDto[];
}

export interface ContractExportDto {
    number?: string;
}

export interface ContractHeaderDto {
    name?: string;
    number?: string;
    code?: string;
    specification?: string;
    unit?: string;
    count?: number;
    price?: number;
    amount?: number;
}

export interface ContractItemDto {
    material?: MaterialInfoDto;
    limitType?: LimitType;
    price?: string;
    maxAmount?: string;
    maxCount?: string;
    balanceAmount?: string;
    balanceCount?: string;
}

export interface ContractItemExportDto {
    number?: string;
}

export interface ContractOrderItemExportDto {
    number?: string;
}

export interface CtyunSessionToken {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
}

export interface CustomerDto {
    tenantId?: string;
    id?: string;
    number?: string;
    name?: string;
    province?: string;
}

export interface CustomerUserDto {
    tenantId?: string;
    id?: string;
    customers?: CustomerDto[];
    mobile?: string;
    password?: string;
    fullname?: string;
    enabled?: boolean;
    openid?: string;
    unionid?: string;
    nickName?: string;
    avatarUrl?: string;
    country?: string;
    province?: string;
    city?: string;
    gender?: number;
    language?: string;
}

export interface DepartmentDto extends Serializable {
    number?: string;
    name?: string;
}

export interface EmployeeDto extends Serializable {
    number?: string;
    name?: string;
    department?: DepartmentDto;
    mobile?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
}

export interface FavoriteDto {
    id?: string;
    material?: MaterialInfoDto;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface ImportedResult {
    code?: string;
    count?: string;
}

export interface MarketUserDetailsDto extends MarketUserDetails, UserDetails {
    tenantId?: string;
    id?: string;
    fullname?: string;
    expired?: boolean;
    locked?: boolean;
    credentialsExpired?: boolean;
    appid?: string;
    openid?: string;
}

export interface MaterialAttachmentDto {
    id?: string;
    type?: string;
    materialNo?: string;
    filename?: string;
    description?: string;
    createdTime?: Date;
}

export interface MaterialInfoDto {
    tenantId?: string;
    id?: string;
    organization?: string;
    number?: string;
    code?: string;
    name?: string;
    specification?: string;
    enabled?: boolean;
    hot?: boolean;
    top?: boolean;
    baseUnit?: string;
    price?: string;
    favId?: string;
    carCount?: number;
    attachments?: MaterialAttachmentDto[];
    covers?: MaterialAttachmentDto[];
    priceYuan?: string;
}

export interface MaterialPriceDto extends Serializable {
    id?: string;
    organization?: OrganizationDto;
    customer?: CustomerDto;
    material?: MaterialInfoDto;
    wholeSellePrice?: string;
    retailPrice?: string;
    startDate?: Date;
    endDate?: Date;
    enabled?: boolean;
    sourceNumber?: string;
    sourceModifyTime?: Date;
    createdTime?: Date;
    lastModifiedTime?: Date;
    version?: string;
    organizationId?: string;
    customerNumber?: string;
    materialNumber?: string;
}

export interface MenuPageDto {
    path?: string;
    match?: MatchType;
}

export interface MenuResourceDto {
    method?: HttpMethod;
    url?: string;
}

export interface MenuTreeDto {
    id?: string;
    name?: string;
    type?: MenuType;
    title?: string;
    enabled?: boolean;
    url?: string;
    icon?: string;
    order?: string;
    openInNewWindow?: boolean;
    parentId?: string;
    pages?: MenuPageDto[];
    children?: MenuTreeDto[];
}

export interface NoticeDto {
    id?: string;
    title?: string;
    cover?: string;
    content?: string;
    abstractContent?: string;
    published?: boolean;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface NoticeReadHistoryDto {
    tenantId?: string;
    noticeId?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface NotificationDto extends Serializable {
    id?: string;
    target?: CustomerDto;
    title?: string;
    content?: string;
    readed?: boolean;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface OrderContractDto {
    id?: string;
    name?: string;
    number?: string;
    type?: string;
}

export interface OrderDto {
    id?: string;
    tenantId?: string;
    organization?: OrganizationDto;
    customer?: CustomerDto;
    seller?: EmployeeDto;
    department?: DepartmentDto;
    items?: OrderItemDto[];
    realAmount?: string;
    distributionMethod?: string;
    address?: OrderAddress;
    remark?: string;
    title?: string;
    description?: string;
    itemCovers?: string[];
    state?: OrderState;
    reviews?: OrderReviewDto[];
    paymentVouchers?: FileInfoDto[];
    returnOrders?: ReturnOrderDto[];
    orderType?: string;
    u8Id?: string;
    contract?: OrderContractDto;
    returnStatus?: string;
    returnAmount?: string;
    cancelReason?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
    covers?: string[];
}

export interface OrderExportDto {
    orderId?: string;
    province?: string;
    customerNumber?: string;
    customerName?: string;
    orderType?: string;
    materialCode?: string;
    materialNumber?: string;
    materialName?: string;
    specification?: string;
    qty?: string;
    price?: number;
    createdTime?: string;
    state?: string;
    amount?: number;
    refundAmount?: number;
    contractNumber?: string;
}

export interface OrderItemAttachmentDto {
    id?: string;
    name?: string;
    type?: string;
    description?: string;
    createdTime?: Date;
}

export interface OrderItemDto {
    id?: string;
    materialId?: string;
    material?: OrderItemMaterialDto;
    price?: string;
    discountedPrice?: string;
    realPrice?: string;
    count?: string;
    shippedCount?: string;
    balance?: string;
    returnCount?: string;
    serial?: string;
    makedate?: Date;
    validdate?: Date;
    state?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
    realAmount?: string;
}

export interface OrderItemMaterialDto {
    id?: string;
    name?: string;
    number?: string;
    code?: string;
    type?: string;
    specification?: string;
    baseUnit?: string;
    covers?: OrderItemAttachmentDto[];
}

export interface OrderReviewDto {
    order?: OrderDto;
    id?: string;
    step?: number;
    auditState?: AuditState;
    note?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface OrganizationDto {
    id?: string;
    name?: string;
    code?: string;
    sourceModifiedTime?: Date;
    beyondAble?: boolean;
}

export interface PriceCalculateItem {
    materialId?: string;
    materialNumber?: string;
    count?: string;
    originPrice?: string;
    discountedPrice?: string;
    orderPrice?: string;
    originAmount?: string;
    orderAmount?: string;
    discountedAmount?: string;
}

export interface PriceCalculateResult {
    orderDiscount?: string;
    boundScale?: number;
    items?: PriceCalculateItem[];
    realAmount?: string;
    realAmountYuan?: string;
    originAmount?: string;
    orderAmount?: string;
    discountedAmount?: string;
    orderDiscountYuan?: string;
    discountedAmountYuan?: string;
    originAmountYuan?: string;
}

export interface PurchaseOrderDto {
    id?: string;
    customerNumber?: string;
    customer?: CustomerDto;
    organizationId?: string;
    organization?: OrganizationDto;
    name?: string;
    description?: string;
    typeCount?: number;
    itemCount?: string;
    amountSum?: string;
    items?: PurchaseOrderItemDto[];
    orderId?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
    amountSumYuan?: string;
}

export interface PurchaseOrderExportDto {
    orderName?: string;
    materialCode?: string;
    materialName?: string;
    specification?: string;
    qty?: number;
    price?: number;
    createdTime?: string;
    amount?: number;
}

export interface PurchaseOrderItemDto {
    id?: string;
    orderId?: string;
    order?: PurchaseOrderDto;
    materialId?: string;
    material?: MaterialInfoDto;
    count?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface QualityReportDto {
    id?: string;
    name?: string;
    note?: string;
    materials?: QualityReportMaterialBatchDto[];
    files?: FileInfoDto[];
    effectiveDate?: Date;
    expirationDate?: Date;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface QualityReportMaterialBatchDto {
    material?: MaterialInfoDto;
    batchNumber?: string;
}

export interface ReturnOrderDto {
    tenantId?: string;
    id?: string;
    orderId?: string;
    organization?: OrganizationDto;
    customer?: CustomerDto;
    items?: ReturnOrderItemDto[];
    realAmount?: string;
    distributionMethod?: string;
    remark?: string;
    title?: string;
    itemCovers?: string[];
    state?: OrderState;
    reviews?: OrderReviewDto[];
    orderType?: string;
    u8Id?: string;
    order?: OrderDto;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface ReturnOrderItemDto {
    id?: string;
    itemId?: string;
    material?: OrderItemMaterialDto;
    price?: string;
    discountedPrice?: string;
    realPrice?: string;
    count?: string;
    state?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface ReturnOrderReviewDto {
    id?: string;
    returnOrder?: ReturnOrderDto;
    step?: number;
    auditState?: AuditState;
    note?: string;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface ShoppingCartItemDto {
    id?: string;
    organizationId?: string;
    customerNo?: string;
    materialId?: string;
    count?: number;
    organization?: OrganizationDto;
    customer?: CustomerDto;
    material?: MaterialInfoDto;
    createdTime?: Date;
    lastModifiedTime?: Date;
    createdBy?: Auditor<string | undefined, string | undefined>;
    lastModifiedBy?: Auditor<string | undefined, string | undefined>;
}

export interface SyncActionDto {
    name?: string;
    startTime?: Date;
    endTime?: Date;
    actionTime?: Date;
}

export interface SysRoleDto {
    name?: string;
    title?: string;
    id?: string;
}

export interface SysUserDetailsDto extends UserDetails {
    id?: string;
    fullname?: string;
}

export interface SysUserDto {
    username?: string;
    roles?: SysRoleDto[];
    password?: string;
    fullname?: string;
    enabled?: boolean;
    id?: string;
}

export interface TenantAppDto {
    type?: AppType;
    name?: string;
    appid?: string;
    appSecret?: string;
}

export interface TenantConfigDto {
    serverUrl?: string;
    accountId?: string;
    username?: string;
    password?: string;
    lcid?: string;
}

export interface TenantDto extends Serializable {
    id?: string;
    code?: string;
    name?: string;
    fullname?: string;
    description?: string;
}

export interface TenantRoleDto extends GrantedAuthority {
    tenantId?: string;
    id?: string;
    group?: string;
    name?: string;
    description?: string;
    enabled?: boolean;
    grantedMenus?: string[];
}

export interface TenantUserDto {
    tenant?: TenantDto;
    id?: string;
    username?: string;
    mobile?: string;
    password?: string;
    fullname?: string;
    enabled?: boolean;
    openid?: string;
    unionid?: string;
    nickName?: string;
    avatarUrl?: string;
    country?: string;
    province?: string;
    city?: string;
    gender?: number;
    language?: string;
    empNumber?: string;
    provinceScope?: string[];
    roles?: string[];
}

export interface UpdatePasswordDto extends Serializable {
    oldPassword?: string;
    password?: string;
}

export interface ContractPatchRequest {
    completed?: boolean;
    note?: string;
}

export interface ContractQueryParam {
    customer?: string;
    keyword?: string;
    province?: string;
    type?: string;
    state?: string;
}

export interface FavoriteRequest {
    materialId?: string;
    customer?: string;
}

export interface MaterialPatchRequest {
    id?: string;
    enabled?: boolean;
    top?: boolean;
    hot?: boolean;
}

export interface MaterialPriceQueryParams {
    customer?: string;
    material?: string;
}

export interface MaterialPriceUpdateRequest {
    enabled?: boolean;
}

export interface MaterialQueryParams {
    organization?: string;
    customer?: string;
    enabled?: boolean;
    type?: string;
    keyword?: string;
}

export interface NotificationPatchRequest {
    customer?: string;
    readed?: boolean;
}

export interface NotificationQueryParams {
    keyword?: string;
    customer?: string;
    boolean?: boolean;
}

export interface OrderCancelRequest {
    id?: string;
    state?: OrderState;
    reason?: string;
}

export interface OrderItemRequestMaterial {
    id?: string;
    name?: string;
    number?: string;
    type?: string;
    specification?: string;
}

export interface OrderPaymentRequest {
    paymentVouchers?: FileInfoDto[];
}

export interface OrderQueryParams {
    customer?: string;
    organization?: string;
    type?: string;
    contract?: string;
    state?: (OrderState | undefined)[];
    province?: (string | undefined)[];
    timeRange?: (Date | undefined)[];
    keyword?: string;
}

export interface OrderRequest {
    purchaseOrderId?: string;
    contractId?: string;
    fapiaoType?: string;
    distributionMethod?: string;
    address?: OrderAddress;
    remark?: string;
    organizationId?: string;
    customerNumber?: string;
    items?: OrderRequestItem[];
}

export interface OrderRequestItem {
    material?: OrderItemRequestMaterial;
    price?: string;
    count?: string;
}

export interface OrderReviewQueryParam {
    organization?: string;
    state?: (AuditState | undefined)[];
    keyword?: string;
    type?: string;
    province?: (string | undefined)[];
    timeRange?: (Date | undefined)[];
}

export interface OrderReviewRequest {
    state?: AuditState;
    note?: string;
    sellerId?: string;
    departmentId?: string;
}

export interface OrderUpdateItem {
    id?: string;
    material?: OrderUpdateItemMaterial;
    realPrice?: string;
    count?: string;
}

export interface OrderUpdateItemMaterial {
    id?: string;
}

export interface OrderUpdateRequest {
    distributionMethod?: string;
    address?: OrderAddress;
    remark?: string;
    title?: string;
    description?: string;
    orderDiscount?: string;
    boundAmount?: string;
    items?: OrderUpdateItem[];
}

export interface QualityReportFileRequest {
    id?: string;
}

export interface QualityReportMaterialBatchRequest {
    material?: QualityReportMaterialRequest;
    batchNumber?: string;
}

export interface QualityReportMaterialRequest {
    id?: string;
}

export interface QualityReportRequest {
    name?: string;
    number?: string;
    note?: string;
    effectiveDate?: Date;
    expirationDate?: Date;
    materials?: QualityReportMaterialBatchRequest[];
    files?: QualityReportFileRequest[];
}

export interface ReturnOrderRequest {
    orderId?: string;
    remark?: string;
    items?: ReturnOrderRequestItem[];
}

export interface ReturnOrderRequestItem {
    id?: string;
    orderItemId?: string;
    realPrice?: string;
    count?: string;
}

export interface ReturnOrderReviewRequest {
    state?: AuditState;
    note?: string;
}

export interface ReturnOrderSubmitRequest {
    id?: string;
    submitted?: boolean;
}

export interface UserPatchRequest {
    password?: string;
    enabled?: boolean;
}

export interface WeAppUserBindingRequest {
    mobile?: string;
    password?: string;
    username?: string;
    openid?: string;
    unionid?: string;
    nickName?: string;
    avatarUrl?: string;
    country?: string;
    province?: string;
    city?: string;
    gender?: number;
    language?: string;
}

export interface WeAppUserBindingRequestKt {
}

export interface ErrorResponse {
    status?: number;
    timestamp?: Date;
    error?: string;
    message?: string;
    path?: string;
}

export interface ValidationResult extends Serializable {
    success?: boolean;
    message?: string;
}

export interface Page<T> extends Slice<T> {
    totalPages?: number;
    totalElements?: string;
}

export interface RangePage<T, M> extends Page<T> {
    max?: M;
}

export interface RangePageable<T> extends Pageable {
    max?: T;
}

export interface Auditor<ID, NAME> extends Serializable {
    userid?: ID;
    username?: NAME;
}

export interface Serializable {
}

export interface MarketUserDetails extends UserDetails {
    tenantId?: string;
}

export interface UserDetails extends Serializable {
    password?: string;
    accountNonLocked?: boolean;
    authorities?: GrantedAuthority[];
    username?: string;
    accountNonExpired?: boolean;
    credentialsNonExpired?: boolean;
    enabled?: boolean;
}

export interface OrderAddress {
    concat?: string;
    tel?: string;
    address?: string;
    postAddress?: string;
}

export interface GrantedAuthority extends Serializable {
    authority?: string;
}

export interface Pageable {
    pageSize?: number;
    pageNumber?: number;
    unpaged?: boolean;
    paged?: boolean;
    offset?: string;
    sort?: Sort;
}

export interface Sort extends Streamable<Order>, Serializable {
    unsorted?: boolean;
    sorted?: boolean;
}

export interface Slice<T> extends Streamable<T> {
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    pageable?: Pageable;
    size?: number;
    content?: T[];
    number?: number;
    sort?: Sort;
}

export interface Streamable<T> extends Iterable<T>, Supplier<Stream<T>> {
    empty?: boolean;
}

export interface Order extends Serializable {
    direction?: Direction;
    property?: string;
    ignoreCase?: boolean;
    nullHandling?: NullHandling;
    descending?: boolean;
    ascending?: boolean;
}

export interface Iterable<_T> {
}

export interface Supplier<_T> {
}

export interface Stream<T> extends BaseStream<T, Stream<T>> {
}

export interface BaseStream<_T, _S> extends AutoCloseable {
    parallel?: boolean;
}

export interface AutoCloseable {
}

export const enum LimitType {
    ITEM_AMOUNT = "ITEM_AMOUNT",
    ITEM_COUNT = "ITEM_COUNT",
    ITEM_CONTRACT_AMOUNT = "ITEM_CONTRACT_AMOUNT",
    CONTRACT_AMOUNT = "CONTRACT_AMOUNT",
}

export const enum MatchType {
    ANT_PATH = "ANT_PATH",
    REG_EXP = "REG_EXP",
}

export const enum HttpMethod {
    GET = "GET",
    HEAD = "HEAD",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE",
    OPTIONS = "OPTIONS",
    TRACE = "TRACE",
}

export const enum MenuType {
    COMPONENT = "COMPONENT",
    HYPERLINK = "HYPERLINK",
    SUBMENU = "SUBMENU",
}

export const enum OrderState {
    NEW = "NEW",
    AUDITING = "AUDITING",
    PROCESSING = "PROCESSING",
    PARTIAL_DELIVERIED = "PARTIAL_DELIVERIED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
}

export const enum AuditState {
    NEW = "NEW",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
}

export const enum AppType {
    WeApp = "WeApp",
}

export const enum Direction {
    ASC = "ASC",
    DESC = "DESC",
}

export const enum NullHandling {
    NATIVE = "NATIVE",
    NULLS_FIRST = "NULLS_FIRST",
    NULLS_LAST = "NULLS_LAST",
}
