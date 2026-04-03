import { IsOptional, IsInt, Min, IsString, IsEnum, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsMongoId()
  teamId?: string;
}
