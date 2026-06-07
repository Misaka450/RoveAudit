import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建/更新报告请求参数
 */
export class CreateReportDto {
  @ApiProperty({ description: '清单编码' })
  @IsString()
  @IsNotEmpty({ message: '编码不能为空' })
  reportCode: string;

  @ApiProperty({ description: '清单名称' })
  @IsString()
  @IsNotEmpty({ message: '名称不能为空' })
  reportName: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'SQL模板', required: false })
  @IsOptional()
  @IsString()
  sqlContent?: string;

  @ApiProperty({ description: '连接配置ID', required: false })
  @IsOptional()
  @IsNumber()
  connectionId?: number;

  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

/**
 * 更新报告请求参数
 */
export class UpdateReportDto {
  @ApiProperty({ description: '清单名称', required: false })
  @IsOptional()
  @IsString()
  reportName?: string;

  @ApiProperty({ description: '分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'SQL模板', required: false })
  @IsOptional()
  @IsString()
  sqlContent?: string;

  @ApiProperty({ description: '连接配置ID', required: false })
  @IsOptional()
  @IsNumber()
  connectionId?: number;

  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ description: '状态：1-启用 0-禁用', required: false })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

/**
 * 创建异常规则请求参数
 */
export class CreateWarningRuleDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  @IsNotEmpty({ message: '规则名称不能为空' })
  ruleName: string;

  @ApiProperty({ description: '规则类型' })
  @IsString()
  @IsNotEmpty({ message: '规则类型不能为空' })
  ruleType: string;

  @ApiProperty({ description: '检测SQL' })
  @IsString()
  @IsNotEmpty({ message: 'SQL内容不能为空' })
  sqlContent: string;

  @ApiProperty({ description: '风险等级：high/medium/low', required: false })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}

/**
 * 创建角色请求参数
 */
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

/**
 * 创建菜单请求参数
 */
export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称' })
  @IsString()
  @IsNotEmpty({ message: '菜单名称不能为空' })
  menuName: string;

  @ApiProperty({ description: '路由路径', required: false })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ description: '组件路径', required: false })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiProperty({ description: '图标', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '父级ID', required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}