import { type CustomerUserDto as _CustomerUserDto, type TenantUserDto as _TenantUserDto } from './market'

export * from './market'

export interface CustomerUserDto extends _CustomerUserDto {
  repassword?: string
}

export interface TenantUserDto extends _TenantUserDto {
  repassword?: string
}
