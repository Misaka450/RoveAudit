import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  roleName: string;

  @ApiProperty({ description: '角色标识（如 admin/manager/user）', required: false })
  @IsOptional()
  @IsString()
  roleCode?: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '菜单ID列表', required: false })
  @IsOptional()
  @IsArray()
  menuIds?: number[];

  @ApiProperty({ description: '权限ID列表', required: false })
  @IsOptional()
  @IsArray()
  permissionIds?: number[];
}

/** 更新角色 DTO — 所有字段可选 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
