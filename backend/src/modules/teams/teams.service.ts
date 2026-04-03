import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private readonly teamModel: Model<TeamDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createTeamDto: CreateTeamDto, createdBy: string): Promise<TeamDocument> {
    const team = new this.teamModel({
      ...createTeamDto,
      createdBy: new Types.ObjectId(createdBy),
    });
    return team.save();
  }

  async findAll(): Promise<TeamDocument[]> {
    return this.teamModel.find().populate('createdBy', 'firstName lastName email').exec();
  }

  async findOne(id: string): Promise<TeamDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Team not found');
    }
    const team = await this.teamModel
      .findById(id)
      .populate('createdBy', 'firstName lastName email')
      .exec();
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async update(
    id: string,
    updateTeamDto: UpdateTeamDto,
    requestingUser: UserDocument,
  ): Promise<TeamDocument> {
    await this.findOne(id);
    this.assertCanModifyTeam(requestingUser, id);
    return this.teamModel
      .findByIdAndUpdate(id, { $set: updateTeamDto }, { new: true })
      .exec() as Promise<TeamDocument>;
  }

  async assignAdmin(teamId: string, userId: string): Promise<UserDocument> {
    await this.findOne(teamId);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.role = UserRole.ADMIN;
    user.teamId = new Types.ObjectId(teamId);
    return user.save();
  }

  async getTeamMembers(
    teamId: string,
    requestingUser: UserDocument,
  ): Promise<UserDocument[]> {
    await this.findOne(teamId);
    this.assertCanViewTeam(requestingUser, teamId);
    return this.userModel.find({ teamId: new Types.ObjectId(teamId) }).exec();
  }

  private assertCanModifyTeam(
    requestingUser: UserDocument,
    teamId: string,
  ): void {
    if (requestingUser.role === UserRole.SUPERADMIN) return;
    if (
      requestingUser.role === UserRole.ADMIN &&
      requestingUser.teamId?.toString() === teamId
    ) {
      return;
    }
    throw new ForbiddenException('You do not have permission to modify this team');
  }

  private assertCanViewTeam(
    requestingUser: UserDocument,
    teamId: string,
  ): void {
    if (requestingUser.role === UserRole.SUPERADMIN) return;
    if (requestingUser.teamId?.toString() === teamId) return;
    throw new ForbiddenException('You do not have permission to view this team');
  }
}
