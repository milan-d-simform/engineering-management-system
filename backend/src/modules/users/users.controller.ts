import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordAdminDto } from './dto/reset-password-admin.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from './enums/user-role.enum';
import type { UserDocument } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    // Admins can only create MEMBER or ADMIN roles for their team
    if (
      currentUser.role === UserRole.ADMIN &&
      createUserDto.role === UserRole.SUPERADMIN
    ) {
      createUserDto.role = UserRole.MEMBER;
    }
    if (currentUser.role === UserRole.ADMIN) {
      const tid = currentUser.teamId;
      createUserDto.teamId = tid
        ? (typeof tid === 'object' && '_id' in (tid as object)
            ? (tid as { _id: { toString(): string } })._id.toString()
            : tid.toString())
        : undefined;
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.usersService.findAll(query, currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: UserDocument) {
    // Members can only see themselves
    if (currentUser.role === UserRole.MEMBER && currentUser.id !== id) {
      return { message: 'Access denied' };
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  activate(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.activate(id, isActive);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordAdminDto,
  ) {
    return this.usersService.resetPasswordByAdmin(id, dto);
  }
}
