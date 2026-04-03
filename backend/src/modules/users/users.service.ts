import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordAdminDto } from './dto/reset-password-admin.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: createUserDto.email });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      teamId: createUserDto.teamId
        ? new Types.ObjectId(createUserDto.teamId)
        : undefined,
    });
    return user.save();
  }

  private getTeamIdString(user: UserDocument): string | undefined {
    const tid = user.teamId;
    if (!tid) return undefined;
    if (typeof tid === 'object' && '_id' in (tid as object)) {
      return (tid as { _id: { toString(): string } })._id.toString();
    }
    return tid.toString();
  }

  async findAll(
    query: PaginationQueryDto,
    requestingUser: UserDocument,
  ): Promise<{ data: UserDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, search, role, project, teamId } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // Non-superadmins can only see users in their team
    if (requestingUser.role !== UserRole.SUPERADMIN) {
      const teamIdStr = this.getTeamIdString(requestingUser);
      // If ADMIN has no team assigned, return nothing (security guard)
      filter.teamId = teamIdStr ? new Types.ObjectId(teamIdStr) : null;
    } else if (teamId) {
      // SUPERADMIN can filter by a specific team
      filter.teamId = new Types.ObjectId(teamId);
    }

    // Role filter
    if (role) {
      filter.role = role;
    }

    // Project filter — match any user whose projects array contains this value (case-insensitive)
    if (project) {
      filter.projects = { $regex: project, $options: 'i' };
    }

    // Full-text search across name, email, and projects
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { projects: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.userModel.find(filter).populate('teamId', 'name').skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(id).populate('teamId', 'name').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUser: UserDocument,
  ): Promise<UserDocument> {
    const user = await this.findOne(id);
    this.assertCanModifyUser(requestingUser, user);

    // Explicitly cast teamId to ObjectId if provided
    const updateData: Record<string, unknown> = { ...updateUserDto };
    if (updateUserDto.teamId) {
      updateData.teamId = new Types.ObjectId(updateUserDto.teamId);
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec() as UserDocument;
    return updated;
  }

  async activate(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return user.save();
  }

  async resetPasswordByAdmin(
    id: string,
    dto: ResetPasswordAdminDto,
  ): Promise<void> {
    await this.findOne(id);
    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, {
      $set: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
    });
  }

  async setRefreshToken(userId: string, token: string | null): Promise<void> {
    const hashed = token ? await bcrypt.hash(token, 10) : null;
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { refreshToken: hashed },
    });
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { passwordResetToken: token, passwordResetExpires: expires },
    });
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  async findWithRefreshToken(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).select('+refreshToken').exec();
  }

  private assertCanModifyUser(
    requestingUser: UserDocument,
    targetUser: UserDocument,
  ): void {
    if (requestingUser.role === UserRole.SUPERADMIN) return;
    if (requestingUser.id === targetUser.id) return;
    const reqTeam = requestingUser.teamId
      ? (typeof requestingUser.teamId === 'object' && '_id' in (requestingUser.teamId as object)
          ? (requestingUser.teamId as { _id: { toString(): string } })._id.toString()
          : requestingUser.teamId.toString())
      : null;
    const tgtTeam = targetUser.teamId
      ? (typeof targetUser.teamId === 'object' && '_id' in (targetUser.teamId as object)
          ? (targetUser.teamId as { _id: { toString(): string } })._id.toString()
          : targetUser.teamId.toString())
      : null;
    if (requestingUser.role === UserRole.ADMIN && reqTeam && reqTeam === tgtTeam) {
      return;
    }
    throw new ForbiddenException('You do not have permission to modify this user');
  }
}
