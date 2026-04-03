import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTeamDto: CreateTeamDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.teamsService.create(createTeamDto, currentUser.id);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.teamsService.update(id, updateTeamDto, currentUser);
  }

  @Post(':id/assign-admin')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  assignAdmin(@Param('id') id: string, @Body() dto: AssignAdminDto) {
    return this.teamsService.assignAdmin(id, dto.userId);
  }

  @Get(':id/members')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  getMembers(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.teamsService.getTeamMembers(id, currentUser);
  }
}
